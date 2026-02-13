import ast
import os
import json
import psycopg2
from dotenv import load_dotenv
from os.path import expanduser
from pathlib import Path
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator


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

    # Get resource info directly from Resources table
    cursor.execute(
        'SELECT "name", "region", "resourceConfigId" FROM "Resources" WHERE id = %s;',
        (resource_id,)
    )
    resource = cursor.fetchone()
    if not resource:
        raise ValueError(f"No resource found for resource_id={resource_id}")
    repoName, region, resourceConfigId = resource

    # Get Kubernetes cluster configurations
    cursor.execute(
        'SELECT "id", "clusterName", "nodeCount", "nodeSize" '
        'FROM "AwsK8sCluster" WHERE "resourceConfigId" = %s;',
        (resourceConfigId,)
    )
    k8s_clusters = cursor.fetchall()
    if not k8s_clusters:
        raise ValueError(f"No K8s cluster found for resourceConfigId={resourceConfigId}")

    cluster_list = []
    for cluster in k8s_clusters:
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
        "k8s_clusters": cluster_list
    }
    return configInfo

def create_terraform_directory(configInfo):
    if isinstance(configInfo, str):
        configInfo = ast.literal_eval(configInfo)
        
    repoName = configInfo['repoName']
    terraform_dir = f"/opt/airflow/dags/terraform/{repoName}/k8s"
    os.makedirs(terraform_dir, exist_ok=True)
    return terraform_dir

def write_terraform_files(terraform_dir, configInfo):
    if isinstance(configInfo, str):
        configInfo = ast.literal_eval(configInfo)
        
    config_dict = configInfo
    projectName = f"{config_dict['repoName']}-{config_dict['resourcesId'][:4]}"
    k8s_clusters = config_dict['k8s_clusters']

    load_dotenv(expanduser('/opt/airflow/dags/.env'))

    # terraform.auto.tfvars
    tfvars_content = f"""
access_key       = "{os.getenv('AWS_ACCESS_KEY')}"
secret_key       = "{os.getenv('AWS_SECRET_KEY')}"
project_location = "{config_dict['region']}"
project_name     = "{projectName}"
k8s_clusters     = {json.dumps(k8s_clusters, indent=4)}
"""
    with open(f"{terraform_dir}/terraform.auto.tfvars", "w") as f:
        f.write(tfvars_content)

    # main.tf
    main_tf_content = f"""
terraform {{
  required_providers {{
    aws = {{
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }}
    kubernetes = {{
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }}
  }}
}}

provider "aws" {{
  region     = var.project_location
  access_key = var.access_key
  secret_key = var.secret_key
}}

# VPC for EKS
resource "aws_vpc" "eks_vpc" {{
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {{
    Name = "${{var.project_name}}-eks-vpc"
  }}
}}

# Internet Gateway
resource "aws_internet_gateway" "eks_igw" {{
  vpc_id = aws_vpc.eks_vpc.id
  
  tags = {{
    Name = "${{var.project_name}}-eks-igw"
  }}
}}

# Subnets
data "aws_availability_zones" "available" {{
  state = "available"
}}

resource "aws_subnet" "eks_subnet" {{
  count                   = 2
  vpc_id                  = aws_vpc.eks_vpc.id
  cidr_block              = "10.0.${{count.index}}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {{
    Name = "${{var.project_name}}-eks-subnet-${{count.index}}"
  }}
}}

# Route Table
resource "aws_route_table" "eks_rt" {{
  vpc_id = aws_vpc.eks_vpc.id
  
  route {{
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.eks_igw.id
  }}
  
  tags = {{
    Name = "${{var.project_name}}-eks-rt"
  }}
}}

resource "aws_route_table_association" "eks_rta" {{
  count          = 2
  subnet_id      = aws_subnet.eks_subnet[count.index].id
  route_table_id = aws_route_table.eks_rt.id
}}

# IAM Role for EKS Cluster
resource "aws_iam_role" "eks_cluster_role" {{
  name = "${{var.project_name}}-eks-cluster-role"

  assume_role_policy = jsonencode({{
    Version = "2012-10-17"
    Statement = [{{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {{
        Service = "eks.amazonaws.com"
      }}
    }}]
  }})
}}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {{
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster_role.name
}}

# IAM Role for EKS Node Group
resource "aws_iam_role" "eks_node_role" {{
  name = "${{var.project_name}}-eks-node-role"

  assume_role_policy = jsonencode({{
    Version = "2012-10-17"
    Statement = [{{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {{
        Service = "ec2.amazonaws.com"
      }}
    }}]
  }})
}}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {{
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_role.name
}}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {{
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_role.name
}}

resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {{
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_role.name
}}

# EKS Clusters
resource "aws_eks_cluster" "eks_cluster" {{
  for_each = {{ for cluster in var.k8s_clusters : cluster.id => cluster }}
  
  name     = each.value.cluster_name
  role_arn = aws_iam_role.eks_cluster_role.arn
  
  vpc_config {{
    subnet_ids = aws_subnet.eks_subnet[*].id
  }}
  
  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy
  ]
  
  tags = {{
    Name = each.value.cluster_name
  }}
}}

# EKS Node Groups
resource "aws_eks_node_group" "eks_nodes" {{
  for_each = {{ for cluster in var.k8s_clusters : cluster.id => cluster }}
  
  cluster_name    = aws_eks_cluster.eks_cluster[each.key].name
  node_group_name = "${{each.value.cluster_name}}-nodes"
  node_role_arn   = aws_iam_role.eks_node_role.arn
  subnet_ids      = aws_subnet.eks_subnet[*].id
  
  instance_types = [each.value.node_size]
  
  scaling_config {{
    desired_size = each.value.node_count
    max_size     = each.value.node_count + 2
    min_size     = 1
  }}
  
  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy
  ]
  
  tags = {{
    Name = "${{each.value.cluster_name}}-nodes"
  }}
}}

# Kubernetes Provider Configuration
provider "kubernetes" {{
  host                   = aws_eks_cluster.eks_cluster[keys(aws_eks_cluster.eks_cluster)[0]].endpoint
  cluster_ca_certificate = base64decode(aws_eks_cluster.eks_cluster[keys(aws_eks_cluster.eks_cluster)[0]].certificate_authority[0].data)
  
  exec {{
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args = [
      "eks",
      "get-token",
      "--cluster-name",
      aws_eks_cluster.eks_cluster[keys(aws_eks_cluster.eks_cluster)[0]].name,
      "--region",
      var.project_location
    ]
  }}
}}

# Output cluster endpoints
output "cluster_endpoints" {{
  value = {{ for name, cluster in aws_eks_cluster.eks_cluster : name => cluster.endpoint }}
}}

output "cluster_names" {{
  value = {{ for name, cluster in aws_eks_cluster.eks_cluster : name => cluster.name }}
}}
"""

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

variable "k8s_clusters" {{
  description = "List of Kubernetes cluster configurations"
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

def write_to_db(terraform_dir, configInfo, **context):
    if isinstance(configInfo, str):
        configInfo = ast.literal_eval(configInfo)

    k8s_output_file = Path(terraform_dir) / "terraform.tfstate"
    if not k8s_output_file.exists():
        raise FileNotFoundError(f"Terraform state file not found at {k8s_output_file}")

    load_dotenv(expanduser('/opt/airflow/dags/.env'))

    USER = os.getenv("DB_USER")
    PASSWORD = os.getenv("DB_PASSWORD")
    HOST = os.getenv("DB_HOST")
    PORT = os.getenv("DB_PORT")
    DBNAME = os.getenv("DB_NAME")

    connection = psycopg2.connect(
        user=USER, password=PASSWORD,
        host=HOST, port=PORT, dbname=DBNAME
    )
    cursor = connection.cursor()

    with open(k8s_output_file, 'r') as f:
        k8s_state = json.load(f)

    # Extract kubeconfig for each cluster from Terraform state
    for cluster in configInfo['k8s_clusters']:
        cluster_id = cluster['id']
        cluster_name = cluster['cluster_name']

        kube_config_raw = None
        cluster_endpoint = None

        for resource in k8s_state.get('resources', []):
            if resource.get('type') == 'aws_eks_cluster' and resource.get('name') == 'eks_cluster':
                for instance in resource.get('instances', []):
                    attributes = instance.get('attributes', {})
                    index_key = instance.get('index_key')

                    # Match either by for_each key (cluster id) or by name
                    if index_key == cluster_id or attributes.get('name') == cluster_name:
                        kube_config_raw = attributes.get('certificate_authority', [{}])[0].get('data', '')
                        cluster_endpoint = attributes.get('endpoint', '')
                        break
                if kube_config_raw:
                    break

        if not kube_config_raw:
            print(f"Warning: No kubeconfig found in Terraform state for cluster {cluster_id}")
            continue

        cursor.execute(
            'UPDATE "AwsK8sCluster" '
            'SET "kubeConfig" = %s, "clusterEndpoint" = %s, "terraformState" = %s '
            'WHERE "id" = %s;',
            (kube_config_raw, cluster_endpoint, json.dumps(k8s_state), cluster_id)
        )

    connection.commit()
    cursor.close()
    connection.close()

with DAG(
    'AWS_terraform_k8s_provision',
    default_args=default_args,
    schedule_interval=None,
    catchup=False,
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

    write_to_db_task = PythonOperator(
        task_id="write_to_db",
        python_callable=write_to_db,
        op_args=[
            "{{ ti.xcom_pull(task_ids='create_terraform_dir') }}",
            "{{ ti.xcom_pull(task_ids='fetch_config') }}",
        ],
    )

    terraform_cleanup = BashOperator(
        task_id="terraform_cleanup",
        bash_command=(
            "cd {{ ti.xcom_pull(task_ids='create_terraform_dir') }} && "
            "if [ -f .terraform.tfstate.lock.info ]; then "
            "  LOCK_ID=$(cat .terraform.tfstate.lock.info | grep -oP '(?<=\"ID\":\")[^\"]*') && "
            "  terraform force-unlock -force $LOCK_ID || true; "
            "fi"
        ),
    )

    fetch_task >> create_dir_task >> write_files_task >> terraform_init >> terraform_apply >> write_to_db_task >> terraform_cleanup