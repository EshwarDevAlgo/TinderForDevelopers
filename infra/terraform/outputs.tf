output "app_url" {
  description = "Public URL of DevMatch"
  value       = local.app_origin
}

output "cloudfront_distribution_id" {
  value = var.enable_cloudfront ? aws_cloudfront_distribution.main[0].id : ""
}

output "frontend_bucket" {
  value = aws_s3_bucket.frontend.bucket
}

output "uploads_bucket" {
  value = aws_s3_bucket.uploads.bucket
}

output "ecr_repository_url" {
  value = aws_ecr_repository.api.repository_url
}

output "asg_name" {
  value = aws_autoscaling_group.api.name
}

output "alb_dns_name" {
  value = aws_lb.api.dns_name
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.address
}

output "redis_endpoint" {
  value = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "image_processor_lambda" {
  value = aws_lambda_function.image_processor.function_name
}

output "api_log_group" {
  value = aws_cloudwatch_log_group.api.name
}
