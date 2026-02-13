terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# Generate random suffix for unique names
resource "random_id" "suffix" {
  byte_length = 4
}

######################
# VPC
######################
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "${var.prefix}-vpc"
  }
}

# Public subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = data.aws_availability_zones.available.names[0]
  tags = {
    Name = "${var.prefix}-public-subnet"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "${var.prefix}-igw"
  }
}

# Route table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "${var.prefix}-public-rt"
  }
}

resource "aws_route" "internet_access" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.gw.id
}

resource "aws_route_table_association" "public_subnet" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

######################
# Security Group for EC2 Instances
######################
resource "aws_security_group" "ec2_sg" {
  name        = "${var.prefix}-ec2-sg"
  description = "Allow inbound ports for EC2 instances"
  vpc_id      = aws_vpc.main.id

  dynamic "ingress" {
    for_each = var.allowed_inbound_ports
    content {
      from_port   = ingress.value
      to_port     = ingress.value
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.prefix}-ec2-sg"
  }
}

######################
# Data source: default Amazon Linux 2 AMI if none provided
######################
data "aws_ami" "default" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

######################
# EC2 Instances
######################
resource "aws_instance" "vm" {
  count         = var.vm_count
  ami           = var.ami_id != "" ? var.ami_id : data.aws_ami.default.id
  instance_type = var.instance_type
  subnet_id     = aws_subnet.public.id
  key_name      = var.key_pair_name != "" ? var.key_pair_name : null
  associate_public_ip_address = var.assign_public_ip
  vpc_security_group_ids      = [aws_security_group.ec2_sg.id]

  tags = {
    Name = "${var.prefix}-vm-${count.index + 1}"
  }
}

######################
# S3 Buckets
######################
resource "random_id" "storage" {
  count       = var.storage_count
  byte_length = 4
}

resource "aws_s3_bucket" "storage" {
  count  = var.storage_count
  bucket = lower("${var.prefix}-storage-${random_id.storage[count.index].hex}")
  acl    = "private"

  tags = {
    Name = "${var.prefix}-storage-${count.index + 1}"
  }
}

######################
# RDS Subnet Group
######################
resource "aws_db_subnet_group" "db_subnet_group" {
  count       = var.db_count > 0 ? 1 : 0
  name        = "${var.prefix}-db-subnet-group"
  subnet_ids  = [aws_subnet.public.id]
  tags = {
    Name = "${var.prefix}-db-subnet-group"
  }
}

######################
# Security group for RDS
######################
resource "aws_security_group" "rds_sg" {
  count       = var.db_count > 0 ? 1 : 0
  name        = "${var.prefix}-rds-sg"
  description = "Allow DB access"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # You may want to restrict this
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.prefix}-rds-sg"
  }
}

######################
# Password generation if not provided
######################
resource "random_password" "db_password" {
  count      = var.db_password == "" && var.db_count > 0 ? 1 : 0
  length     = 20
  special    = true
  min_upper  = 1
  min_lower  = 1
  min_numeric = 1
  min_special = 1
}

locals {
  rds_master_password = var.db_password != "" ? var.db_password : (length(random_password.db_password) > 0 ? random_password.db_password[0].result : "")
}

######################
# RDS Instances (MySQL)
######################
resource "aws_db_instance" "rds" {
  count                 = var.db_count
  allocated_storage     = 20
  engine                = "mysql"
  engine_version        = "8.0"
  instance_class        = "db.t3.micro"
  name                  = "${var.prefix}-db-${count.index + 1}"
  username              = var.db_username
  password              = local.rds_master_password
  db_subnet_group_name  = aws_db_subnet_group.db_subnet_group[0].name
  vpc_security_group_ids = [aws_security_group.rds_sg[0].id]
  skip_final_snapshot   = true
  publicly_accessible   = true

  tags = {
    Name = "${var.prefix}-db-${count.index + 1}"
  }
}
