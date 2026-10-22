#!/bin/bash
# Rendered by Terraform. Installs Docker and runs the DevMatch API container under systemd.
set -euxo pipefail

dnf install -y docker
systemctl enable --now docker

mkdir -p /opt/devmatch
cat > /opt/devmatch/run.sh <<'SCRIPT'
#!/bin/bash
set -euo pipefail
REGION="${region}"
REPO="${ecr_repo_url}"
IMAGE="$REPO:${image_tag}"

get() { aws ssm get-parameter --region "$REGION" --name "$1" --with-decryption --query Parameter.Value --output text; }

aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$${REPO%%/*}"
docker pull "$IMAGE"

%{ if serve_spa ~}
mkdir -p /opt/devmatch/web
aws s3 sync "s3://${frontend_bucket}" /opt/devmatch/web --delete --region "$REGION"
chmod -R a+rX /opt/devmatch/web
%{ endif ~}

umask 077
cat > /opt/devmatch/app.env <<ENV
NODE_ENV=production
PORT=4000
DATABASE_URL=postgres://${db_user}:$(get ${ssm_prefix}/db_password)@${db_host}:5432/${db_name}
DB_SSL=true
REDIS_URL=rediss://${redis_host}:6379
JWT_SECRET=$(get ${ssm_prefix}/jwt_secret)
OPENAI_API_KEY=$(get ${ssm_prefix}/openai_api_key)
OPENAI_MODEL=${openai_model}
AWS_REGION=$REGION
S3_UPLOADS_BUCKET=${uploads_bucket}
MEDIA_BASE_URL=/media
SEED_ON_START=${seed_on_start}
%{ if serve_spa ~}
SPA_DIR=/app/web
TRUST_PROXY_HOPS=1
%{ endif ~}
ENV

docker rm -f devmatch-api >/dev/null 2>&1 || true
exec docker run --name devmatch-api --rm -p 4000:4000 \
  --env-file /opt/devmatch/app.env \
%{ if serve_spa ~}
  -v /opt/devmatch/web:/app/web:ro \
%{ endif ~}
  --log-driver awslogs \
  --log-opt awslogs-region="$REGION" \
  --log-opt awslogs-group="${log_group}" \
  --log-opt awslogs-stream="$(hostname)" \
  "$IMAGE"
SCRIPT
chmod 700 /opt/devmatch/run.sh

cat > /etc/systemd/system/devmatch-api.service <<'UNIT'
[Unit]
Description=DevMatch API container
After=docker.service network-online.target
Requires=docker.service
StartLimitIntervalSec=0

[Service]
ExecStart=/opt/devmatch/run.sh
ExecStop=/usr/bin/docker stop -t 15 devmatch-api
Restart=always
RestartSec=15

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable --now devmatch-api.service
