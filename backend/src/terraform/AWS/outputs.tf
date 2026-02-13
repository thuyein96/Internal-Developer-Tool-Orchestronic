output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_id" {
  value = aws_subnet.public.id
}

output "ec2_instance_ids" {
  value = [for inst in aws_instance.vm : inst.id]
}

output "ec2_public_ips" {
  value = [for inst in aws_instance.vm : inst.public_ip]
}

output "ec2_private_ips" {
  value = [for inst in aws_instance.vm : inst.private_ip]
}

output "s3_buckets" {
  value = [for b in aws_s3_bucket.storage : b.bucket]
}

output "rds_endpoints" {
  value       = var.db_count > 0 ? [for db in aws_db_instance.rds : db.endpoint] : []
  description = "RDS database endpoints"
}

output "rds_master_username" {
  value = var.db_username
}

output "rds_master_password" {
  value     = local.rds_master_password
  sensitive = true
}
