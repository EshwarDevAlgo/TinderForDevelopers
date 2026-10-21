# DevMatch – Tinder for Developers

Developers swipe on each other and match based on **shared stack** (React ↔ React, Spring ↔ Spring) or **complementary roles** (frontend ↔ backend, data ↔ ML, designer ↔ frontend), then chat in real time.

**Stack:** React (Vite) · Express.js · PostgreSQL · Redis · WebSockets · OpenAI API (optional) · Docker · Terraform · GitHub Actions
**AWS:** VPC (2 AZs) · EC2 Auto Scaling · ALB · CloudFront · S3 · Lambda · RDS PostgreSQL · ElastiCache Redis · ECR · SSM Parameter Store · CloudWatch · IAM (OIDC)

```
Browser ──HTTPS──> CloudFront ──┬── /*        → S3 (React SPA)
                                ├── /media/*  → S3 uploads (processed avatars)
                                └── /api/*, /ws → ALB → EC2 ASG (Docker, 2 AZs, private subnets)
                                                         ├── RDS PostgreSQL
                                                         └── ElastiCache Redis (cache + chat pub/sub)
Avatar upload: browser ─presigned POST→ S3 raw/ ─event→ Lambda (downscale to 320px, JPEG q55) → S3 media/
```

## Features
- **Recommendations** – `similar`, `complementary`, and `mixed` modes ([recommendations.js](backend/src/services/recommendations.js)). If an OpenAI key is set, the top 25 results are re-ranked by an LLM (cached in Redis for 5 min).
- **Real-time chat** – WebSockets fanned out across instances through Redis pub/sub, with typing indicators and live match notifications.
- **Profile cache** – `GET /api/profiles/:id` is cached in Redis for 60s. Redis uses `allkeys-lru` eviction. The `X-Cache` header reports HIT or MISS.
- **Image Lambda** – shrinks uploaded profile pictures (lower resolution and quality) and deletes the full-size original.
- **Seed data** – 100 developer profiles plus demo accounts, matches, and messages.

| Demo login | Password |
|---|---|
| `demo@devmatch.dev` (React frontend) | `DevMatch123!` |
| `backend@devmatch.dev` (Spring Boot backend) | `DevMatch123!` |

All seeded users (`*@seed.devmatch.dev`) share the same password. About 40% of them have already liked the demo accounts, so liking them back creates a match right away.

## Run locally
```bash
docker compose up --build        # http://localhost:8080
# optional AI recommendations:
OPENAI_API_KEY=sk-... docker compose up --build
```
Hot-reload dev: `docker compose up -d postgres redis`, then `cd backend && npm run dev` and `cd frontend && npm run dev` (http://localhost:5173).
Local mode has no S3, so avatar upload is turned off there. Paste an image URL instead.

Tests: `cd backend && npm test`. Integration tests run when `DATABASE_URL` and `REDIS_URL` are set. Also `cd lambda/image-processor && npm test`.

## Deploy to AWS

### 1. One-time bootstrap (from your machine, with admin AWS credentials)
```bash
cd infra/bootstrap
terraform init
terraform apply -var="github_repo=<your-gh-user>/<repo>" -var="aws_region=us-east-1"
# If your account already has the GitHub OIDC provider add: -var="create_oidc_provider=false"
```
This creates the Terraform state bucket and an IAM role. Only GitHub Actions runs on the `main` branch of your repo can assume that role. No AWS access keys are stored in GitHub.

### 2. Configure the GitHub repo
**Settings → Secrets and variables → Actions**
- Variables: `AWS_REGION` (e.g. `us-east-1`), `AWS_ROLE_ARN` (bootstrap output `github_actions_role_arn`), `TF_STATE_BUCKET` (bootstrap output `tf_state_bucket`)
- Secret (optional): `OPENAI_API_KEY` – turns on AI recommendations

### 3. Push to `main`
```bash
git init && git add . && git commit -m "DevMatch" && git branch -M main
git remote add origin git@github.com:<you>/<repo>.git && git push -u origin main
```
Pipeline:
- **CI** ([ci.yml](.github/workflows/ci.yml)) runs on every PR and branch: backend unit and integration tests against Postgres and Redis containers, Docker build, frontend build, Lambda tests, and `terraform fmt` plus `validate`.
- **Deploy** ([deploy.yml](.github/workflows/deploy.yml)) runs on `main`: CI → `terraform apply` → push the API image to ECR → rolling ASG instance refresh → upload the SPA to S3 → CloudFront invalidation.

The app URL appears in the workflow summary (`terraform output app_url`). The first deploy takes about 20 minutes because RDS, ElastiCache and CloudFront are slow to create. The 100 profiles are seeded automatically on first boot.

### Manual deploy (no CI)
```bash
cd lambda/image-processor && npm ci --omit=dev && cd -
cd infra/terraform
cp backend.hcl.example backend.hcl   # fill in the bucket
terraform init -backend-config=backend.hcl
terraform apply
ECR=$(terraform output -raw ecr_repository_url)
aws ecr get-login-password | docker login --username AWS --password-stdin ${ECR%%/*}
docker build --platform linux/amd64 -t $ECR:latest ../../backend && docker push $ECR:latest
aws autoscaling start-instance-refresh --auto-scaling-group-name $(terraform output -raw asg_name)
cd ../../frontend && npm ci && npm run build
aws s3 sync dist s3://$(cd ../infra/terraform && terraform output -raw frontend_bucket) --delete
```

### Operations
- Logs: CloudWatch `/devmatch/prod/api` (API) and `/aws/lambda/devmatch-prod-image-processor`
- Shell on an instance: SSM Session Manager (instances have no SSH or public IP)
- Rotate the OpenAI key: update the GitHub secret and re-run Deploy
- Higher availability: set `db_multi_az = true` and `redis_num_nodes = 2` in Terraform variables
- Tear down: `terraform destroy` in `infra/terraform`, then in `infra/bootstrap`

### Cost note
The defaults (2× t3.small, db.t4g.micro, cache.t4g.micro, 1 NAT gateway, ALB, CloudFront) cost roughly **$90–110/month**. Destroy the stack when you are not using it.
