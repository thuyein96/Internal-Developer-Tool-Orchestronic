import ast
import os
import json
import psycopg2
from dotenv import load_dotenv
from os.path import expanduser
from pathlib import Path
from datetime import datetime

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.operators.trigger_dagrun import TriggerDagRunOperator

# -------------------------
# Default DAG args
# -------------------------
default_args = {
    'owner': 'admin',
    'depends_on_past': False,
    'start_date': datetime(2025, 1, 1),
    'retries': 1,
}

def fetch_from_database(**context):
    resource_id = context['dag_run'].conf.get('resource_id')
    if not resource_id:
        raise ValueError("No resource_id received. Stop DAG run.")

    load_dotenv(expanduser('/opt/airflow/dags/.env'))

    USER = os.getenv("DB_USER")
    PASSWORD = os.getenv("DB_PASSWORD")
    HOST = os.getenv("DB_HOST")
    PORT = os.getenv("DB_PORT")
    DBNAME = os.getenv("DB_NAME")

    connection = psycopg2.connect(
        user=USER,
        password=PASSWORD,
        host=HOST,
        port=PORT,
        dbname=DBNAME,
    )
    cursor = connection.cursor()

    # Get resource info
    cursor.execute(
        'SELECT "name", "region", "resourceConfigId" FROM "Resources" WHERE id = %s;',
        (resource_id,)
    )
    resource = cursor.fetchone()
    if not resource:
        raise ValueError(f"No resource found for resource_id={resource_id}")
    repoName, region, resourceConfigId = resource

    # Get K3s cluster configurations
    cursor.execute(
        'SELECT "id", "clusterName", "nodeCount", "nodeSize" '
        'FROM "AwsK8sCluster" WHERE "resourceConfigId" = %s;',
        (resourceConfigId,)
    )
    k3s_clusters = cursor.fetchall()
    if not k3s_clusters:
        raise ValueError(f"No K3s cluster found for resourceConfigId={resourceConfigId}")

    cluster_list = []
    for cluster in k3s_clusters:
        id, clusterName, nodeCount, nodeSize = cluster
        cluster_list.append({
            "id": id,
            "cluster_name": clusterName,
            "node_count": nodeCount,
            "node_size": nodeSize
        })

    cursor.close()
    connection.close()

    configInfo = {
        "resourcesId": resource_id,
        "repoName": repoName,
        "region": region,
        "k3s_clusters": cluster_list
    }
    return configInfo

def create_terraform_directory(configInfo):
    if isinstance(configInfo, str):
        configInfo = ast.literal_eval(configInfo)
        
    repoName = configInfo['repoName']
    terraform_dir = f"/opt/airflow/dags/terraform/{repoName}/k3s"
    os.makedirs(terraform_dir, exist_ok=True)
    return terraform_dir

def write_terraform_files(terraform_dir, configInfo):
    if isinstance(configInfo, str):
        configInfo = ast.literal_eval(configInfo)
        
    config_dict = configInfo
    projectName = f"{config_dict['repoName']}-{config_dict['resourcesId'][:4]}"
    k3s_clusters = config_dict['k3s_clusters']

    load_dotenv(expanduser('/opt/airflow/dags/.env'))

    # terraform.auto.tfvars
    admin_cidr = os.getenv('ADMIN_CIDR', '0.0.0.0/0')
    tfvars_content = f"""
access_key       = "{os.getenv('AWS_ACCESS_KEY')}"
secret_key       = "{os.getenv('AWS_SECRET_KEY')}"
project_location = "{config_dict['region']}"
project_name     = "{projectName}"
  admin_cidr       = \"{admin_cidr}\"
k3s_clusters     = {json.dumps(k3s_clusters, indent=4)}
"""
    with open(f"{terraform_dir}/terraform.auto.tfvars", "w") as f:
        f.write(tfvars_content)
    
    # Read SSH public key
    try:
        with open('/opt/airflow/dags/.ssh/id_rsa.pub', 'r') as pub_key_file:
            ssh_public_key = pub_key_file.read().strip()
    except FileNotFoundError:
        raise ValueError("Public key not found at /opt/airflow/dags/.ssh/id_rsa.pub")

    # main.tf - Infrastructure Only (No K3s installation)
    main_tf_template = """
terraform {{
  required_providers {{
    aws = {{
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }}
  }}
}}

provider "aws" {{
  region     = var.project_location
  access_key = var.access_key
  secret_key = var.secret_key
}}

resource "aws_key_pair" "k3s_auth" {{
  key_name   = "${{var.project_name}}-key"
  public_key = "__SSH_PUBLIC_KEY__"
}}

# DATA LOOKUPS (VPC/SUBNETS)
data "aws_vpc" "k3s_vpc" {{
  filter {{
    name   = "tag:Name"
    values = ["${{var.project_name}}-k3s-vpc"]
  }}
}}

data "aws_subnet" "k3s_public_subnet_0" {{
  filter {{
    name   = "tag:Name"
    values = ["${{var.project_name}}-k3s-public-subnet-0"]
  }}
}}

data "aws_subnet" "k3s_public_subnet_1" {{
  filter {{
    name   = "tag:Name"
    values = ["${{var.project_name}}-k3s-public-subnet-1"]
  }}
}}

data "aws_subnet" "k3s_private_subnet_0" {{
  filter {{
    name   = "tag:Name"
    values = ["${{var.project_name}}-k3s-private-subnet-0"]
  }}
}}

data "aws_subnet" "k3s_private_subnet_1" {{
  filter {{
    name   = "tag:Name"
    values = ["${{var.project_name}}-k3s-private-subnet-1"]
  }}
}}

# SECURITY GROUPS
resource "aws_security_group" "k3s_sg" {{
  name   = "${{var.project_name}}-k3s-sg"
  vpc_id = data.aws_vpc.k3s_vpc.id

  ingress {{
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    security_groups = [aws_security_group.edge_sg.id]
  }}
  ingress {{
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }}
  ingress {{
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }}
  ingress {{
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    security_groups = [aws_security_group.edge_sg.id]
  }}
  ingress {{
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }}
  ingress {{
    from_port   = 0
    to_port     = 65535
    protocol    = "udp"
    cidr_blocks = ["10.0.0.0/16"]
  }}
  ingress {{
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }}
  ingress {{
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }} 
  egress {{
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }}
  tags = {{ Name = "${{var.project_name}}-k3s-sg" }}
}}

resource "aws_security_group" "edge_sg" {{
  name   = "${{var.project_name}}-edge-sg"
  vpc_id = data.aws_vpc.k3s_vpc.id
  
  ingress {{
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }}
  ingress {{
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }}
  ingress {{
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }}  
  egress {{
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }}
  tags = {{ Name = "${{var.project_name}}-edge-sg" }}
}}

# IAM Role
resource "aws_iam_role" "k3s_role" {{
  name = "${{var.project_name}}-k3s-role"
  assume_role_policy = jsonencode({{
    Version = "2012-10-17"
    Statement = [{{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {{ Service = "ec2.amazonaws.com" }}
    }}]
  }})
}}

# SSM policy removed - using SSH for token distribution

resource "aws_iam_instance_profile" "k3s_profile" {{
  name = "${{var.project_name}}-k3s-profile"
  role = aws_iam_role.k3s_role.name
}}

resource "aws_iam_role_policy_attachment" "k3s_ssm_policy" {{
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  role       = aws_iam_role.k3s_role.name
}}

data "aws_ami" "ubuntu" {{
  most_recent = true
  owners      = ["099720109477"]
  filter {{
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }}
  filter {{
    name   = "virtualization-type"
    values = ["hvm"]
  }}
}}

# K3s Master Nodes (VMs only - no K3s installation yet)
resource "aws_instance" "k3s_master" {{
  for_each = {{ for cluster in var.k3s_clusters : cluster.id => cluster }}
  
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "c7i-flex.large"
  iam_instance_profile   = aws_iam_instance_profile.k3s_profile.name
  subnet_id              = data.aws_subnet.k3s_public_subnet_0.id
  vpc_security_group_ids = [aws_security_group.k3s_sg.id]
  associate_public_ip_address = true
  key_name = aws_key_pair.k3s_auth.key_name

  user_data = base64encode(<<-EOF
              #!/bin/bash
              set -ex
              apt-get update
              apt-get install -y curl wget git awscli
              echo "Master VM ready for configuration"
              EOF
  )
  
  tags = {{
    Name = "${{each.value.cluster_name}}-master"
    ClusterName = each.value.cluster_name
    Role = "k3s-master"
    ProjectName = var.project_name
  }}
}}

# Edge Proxy (VM only - no Traefik yet) - shared across clusters
resource "aws_instance" "k3s_edge" {{
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  iam_instance_profile   = aws_iam_instance_profile.k3s_profile.name
  subnet_id              = data.aws_subnet.k3s_public_subnet_0.id
  vpc_security_group_ids = [aws_security_group.edge_sg.id]
  associate_public_ip_address = true
  key_name = aws_key_pair.k3s_auth.key_name

  user_data = base64encode(<<-EOF
              #!/bin/bash
              set -ex
              apt-get update
              apt-get install -y ca-certificates curl gnupg docker.io
              echo "Edge VM ready for configuration"
              EOF
  )

  tags = {{ 
    Name = "${{var.project_name}}-edge"
    Role = "edge-proxy"
    ProjectName = var.project_name
  }}
  depends_on = [aws_instance.k3s_master]
}}

# K3s Worker Nodes (VMs only - no K3s agent yet)
resource "aws_instance" "k3s_worker" {{
  for_each = {{
    for item in flatten([
      for cluster in var.k3s_clusters : [
        for i in range(cluster.node_count) : {{
          cluster_id = cluster.id
          cluster_name = cluster.cluster_name
          node_size = cluster.node_size
          index = i
        }}
      ]
    ]) : "${{item.cluster_id}}-worker-${{item.index}}" => item
  }}
  
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = each.value.node_size
  iam_instance_profile   = aws_iam_instance_profile.k3s_profile.name
  subnet_id              = each.value.index % 2 == 0 ? data.aws_subnet.k3s_public_subnet_0.id : data.aws_subnet.k3s_public_subnet_1.id
  vpc_security_group_ids = [aws_security_group.k3s_sg.id]
  associate_public_ip_address = true
  key_name = aws_key_pair.k3s_auth.key_name

  user_data = base64encode(<<-EOF
              #!/bin/bash
              set -ex
              apt-get update
              apt-get install -y curl wget git awscli jq
              echo "Worker VM ready for configuration"
              EOF
  )
  
  tags = {{
    Name = "${{each.value.cluster_name}}-worker-${{each.value.index}}"
    ClusterName = each.value.cluster_name
    ClusterId = each.value.cluster_id
    Role = "k3s-worker"
    ProjectName = var.project_name
  }}

  depends_on = [aws_instance.k3s_master]
}}

# Outputs for DAG 2
output "k3s_masters" {{
  value = {{
    for cluster_id, master in aws_instance.k3s_master : cluster_id => {{
      instance_id = master.id
      public_ip   = master.public_ip
      private_ip  = master.private_ip
      cluster_name = master.tags.ClusterName
    }}
  }}
}}

output "k3s_workers" {{
  value = {{
    for worker_id, worker in aws_instance.k3s_worker : worker_id => {{
      instance_id = worker.id
      public_ip   = worker.public_ip
      private_ip  = worker.private_ip
      cluster_id  = worker.tags.ClusterId
    }}
  }}
}}

output "edge_proxy" {{
  value = {{
    instance_id = aws_instance.k3s_edge.id
    public_ip   = aws_instance.k3s_edge.public_ip
    private_ip  = aws_instance.k3s_edge.private_ip
  }}
}}

output "project_name" {{
  value = var.project_name
}}
"""

    # Replace placeholders
    main_tf_content = (
        main_tf_template
        .replace("{{", "{")
        .replace("}}", "}")
        .replace("__SSH_PUBLIC_KEY__", ssh_public_key)
    )

    with open(f"{terraform_dir}/main.tf", "w") as f:
        f.write(main_tf_content)

    # variables.tf
    variables_tf = f"""
variable "access_key" {{
  description = "AWS Access Key"
  type        = string
}}
variable "secret_key" {{
  description = "AWS Secret Key"
  type        = string
}}
variable "project_location" {{
  description = "AWS Region"
  type        = string
  default     = "{config_dict['region']}"
}}
variable "project_name" {{
  description = "Project Name"
  type        = string
  default     = "{projectName}"
}}
variable "admin_cidr" {{
  description = "CIDR allowed to reach Kubernetes API (6443/tcp). Set to your public IP /32 for safety."
  type        = string
  default     = "{admin_cidr}"
}}
variable "k3s_clusters" {{
  description = "List of K3s cluster configurations"
  type = list(object({{
    id           = string
    cluster_name = string
    node_count   = number
    node_size    = string
  }}))
}}
"""
    with open(f"{terraform_dir}/variables.tf", "w") as f:
        f.write(variables_tf)

def write_instance_info_to_db(terraform_dir, configInfo, **context):
    """Store instance IPs and IDs in database for DAG 2"""
    if isinstance(configInfo, str):
        configInfo = ast.literal_eval(configInfo)

    state_file = Path(terraform_dir) / "terraform.tfstate"
    if not state_file.exists():
        raise FileNotFoundError(f"Terraform state file not found at {state_file}")

    load_dotenv(expanduser('/opt/airflow/dags/.env'))

    connection = psycopg2.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME")
    )
    cursor = connection.cursor()

    with open(state_file, 'r') as f:
        state = json.load(f)

    edge_info = (
      state.get("outputs", {})
      .get("edge_proxy", {})
      .get("value", {})
    ) or {}

    edge_public_ip = edge_info.get("public_ip")


    # Store infrastructure state for each cluster
    for cluster in configInfo['k3s_clusters']:
        cluster_id = cluster['id']
        
        # Extract master info
        master_info = None
        for resource in state.get('resources', []):
            if resource.get('type') == 'aws_instance' and resource.get('name') == 'k3s_master':
                for instance in resource.get('instances', []):
                    if instance.get('index_key') == cluster_id:
                        attrs = instance.get('attributes', {})
                        master_info = {
                            'instance_id': attrs.get('id'),
                            'public_ip': attrs.get('public_ip'),
                            'private_ip': attrs.get('private_ip')
                        }
                        break
        
        if not master_info:
            print(f"Warning: No master found for cluster {cluster_id}")
            continue

        # Keep backward compatibility: AWS_configure_k3s expects master fields at top-level.
        # Add edge info as additional fields.
        master_info["edge_public_ip"] = edge_public_ip
        master_info["edge"] = {"public_ip": edge_public_ip}

        # Store in database with status 'provisioned'
        cursor.execute(
            '''UPDATE "AwsK8sCluster" 
               SET "clusterEndpoint" = %s, 
                   "terraformState" = %s
               WHERE "id" = %s;''',
            (
                json.dumps(master_info),
                json.dumps(state), # New status field
                cluster_id
            )
        )
        connection.commit()
        print(f"✓ Stored infrastructure info for cluster {cluster_id}")

    cursor.close()
    connection.close()

    # Return resource_id for triggering DAG 2
    return configInfo['resourcesId']

with DAG(
    'AWS_terraform_k3s_provision',
    default_args=default_args,
    schedule_interval=None,
    catchup=False,
    description='Provision K3s infrastructure (VMs only)',
) as dag:

    fetch_task = PythonOperator(
        task_id="fetch_config",
        python_callable=fetch_from_database,
    )

    create_dir_task = PythonOperator(
        task_id="create_terraform_dir",
        python_callable=create_terraform_directory,
        op_args=["{{ ti.xcom_pull(task_ids='fetch_config') }}"],
    )

    write_files_task = PythonOperator(
        task_id="write_terraform_files",
        python_callable=write_terraform_files,
        op_args=[
            "{{ ti.xcom_pull(task_ids='create_terraform_dir') }}",
            "{{ ti.xcom_pull(task_ids='fetch_config') }}",
        ],
    )

    terraform_init = BashOperator(
        task_id="terraform_init",
        bash_command="cd {{ ti.xcom_pull(task_ids='create_terraform_dir') }} && terraform init",
    )

    terraform_apply = BashOperator(
        task_id="terraform_apply",
        bash_command="cd {{ ti.xcom_pull(task_ids='create_terraform_dir') }} && terraform apply -auto-approve",
    )

    write_db_task = PythonOperator(
        task_id="write_instance_info_to_db",
        python_callable=write_instance_info_to_db,
        op_args=[
            "{{ ti.xcom_pull(task_ids='create_terraform_dir') }}",
            "{{ ti.xcom_pull(task_ids='fetch_config') }}",
        ],
    )

    # Trigger configuration DAG
    trigger_config = TriggerDagRunOperator(
        task_id="trigger_k3s_configuration",
        trigger_dag_id="AWS_configure_k3s",
        conf={"resource_id": "{{ ti.xcom_pull(task_ids='write_instance_info_to_db') }}"},
        wait_for_completion=False,
    )

    fetch_task >> create_dir_task >> write_files_task >> terraform_init >> terraform_apply >> write_db_task >> trigger_config