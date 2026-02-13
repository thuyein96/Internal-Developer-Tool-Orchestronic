variable "prefix" {
  description = "Short resource name prefix (lowercase letters and numbers, 3-12 chars). Used for naming all resources."
  type        = string
}

variable "region" {
  description = "AWS region to deploy resources to (e.g. us-east-1, ap-southeast-1)."
  type        = string
  default     = "us-east-1"
}

variable "vm_count" {
  description = "Number of EC2 instances to create."
  type        = number
  default     = 1
}

variable "instance_type" {
  description = "EC2 instance type (SKU)."
  type        = string
  default     = "t3.micro"
}

variable "ami_id" {
  description = "AMI ID to use for EC2 instances. Default is latest Amazon Linux 2."
  type        = string
  default     = ""
}

variable "key_pair_name" {
  description = "Name of existing AWS EC2 Key Pair to allow SSH access. Leave empty to skip."
  type        = string
  default     = ""
}

variable "assign_public_ip" {
  description = "If true, assign public IP addresses to EC2 instances."
  type        = bool
  default     = true
}

variable "allowed_inbound_ports" {
  description = "List of inbound TCP ports to allow on EC2 security group (e.g. 22 for SSH, 80 for HTTP)."
  type        = list(number)
  default     = [22, 80]
}

variable "storage_count" {
  description = "Number of S3 buckets to create."
  type        = number
  default     = 1
}

variable "db_count" {
  description = "Number of RDS databases to create. If 0, no RDS will be created."
  type        = number
  default     = 0
}

variable "db_username" {
  description = "Master username for RDS databases (if db_count > 0)."
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "Master password for RDS databases (if db_count > 0). Must meet AWS requirements."
  type        = string
  default     = ""
  sensitive   = true
}
