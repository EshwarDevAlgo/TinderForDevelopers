variable "project" {
  type    = string
  default = "devmatch"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "enable_cloudfront" {
  description = "false = ALB is public over HTTP and the API container serves the SPA and /media (used until the AWS account is verified for CloudFront)"
  type        = bool
  default     = false
}

# --- Compute (EC2 Auto Scaling, multi-AZ) ---
variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "asg_min_size" {
  type    = number
  default = 1
}

variable "asg_max_size" {
  type    = number
  default = 2
}

variable "asg_desired_capacity" {
  type    = number
  default = 1
}

variable "backend_image_tag" {
  type    = string
  default = "latest"
}

# --- Database ---
variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "db_multi_az" {
  description = "Run RDS with a synchronous standby in a second AZ (roughly doubles DB cost)"
  type        = bool
  default     = false
}

variable "db_deletion_protection" {
  type    = bool
  default = false
}

variable "db_backup_retention_days" {
  description = "AWS free-plan accounts allow at most 1 day; use 7+ on a paid plan"
  type        = number
  default     = 1
}

variable "db_skip_final_snapshot" {
  type    = bool
  default = true
}

# --- Redis ---
variable "redis_node_type" {
  type    = string
  default = "cache.t4g.micro"
}

variable "redis_num_nodes" {
  description = "1 = single node; 2+ enables a replica with automatic multi-AZ failover"
  type        = number
  default     = 1
}

# --- App ---
variable "seed_on_start" {
  description = "Seed ~100 demo developer profiles on first boot"
  type        = bool
  default     = true
}

variable "openai_api_key" {
  description = "Optional OpenAI API key for AI recommendations (pass via TF_VAR_openai_api_key)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "openai_model" {
  type    = string
  default = "gpt-4o-mini"
}

variable "avatar_max_dimension" {
  description = "Max width/height (px) of processed profile pictures"
  type        = number
  default     = 320
}

variable "avatar_jpeg_quality" {
  type    = number
  default = 55
}
