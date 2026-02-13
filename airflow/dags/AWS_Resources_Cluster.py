import os
import json
import ast
import glob
import pika
import psycopg2
from airflow import DAG
from airflow.operators.python import PythonOperator, BranchPythonOperator
from airflow.operators.bash import BashOperator
from airflow.operators.trigger_dagrun import TriggerDagRunOperator
from airflow.operators.empty import EmptyOperator
from datetime import datetime
from dotenv import load_dotenv
from os.path import expanduser

# -------------------------
# Default DAG args
# -------------------------
default_args = {
    'owner': 'admin',
    'depends_on_past': False,
    'start_date': datetime(2025, 1, 1),
    'retries': 1,
}

# -------------------------
# Step 1: RabbitMQ consumer
# -------------------------
def rabbitmq_consumer():
    load_dotenv(expanduser('/opt/airflow/dags/.env'))
    rabbit_url = os.getenv("RABBITMQ_URL")
    # rabbit_url = "amqp://guest:guest@host.docker.internal:5672"
    if not rabbit_url:
        raise ValueError("RABBITMQ_URL is not set in .env")

    connection = pika.BlockingConnection(pika.URLParameters(rabbit_url))
    channel = connection.channel()

    method_frame, header_frame, body = channel.basic_get(queue='resource', auto_ack=True)
    if method_frame:
        message = body.decode()
        obj = json.loads(message)
        resource_id = obj["data"]["resourceId"]
        print(f"[x] Got message: {resource_id}")
        connection.close()
        return resource_id
    else:
        print("[x] No message in queue")
        connection.close()
        return None


# -------------------------
# Step 2: Fetch from Database
# -------------------------
def fetch_from_database(resource_id):
    if not resource_id:
        raise ValueError("No message received from RabbitMQ. Stop DAG run.")

    load_dotenv(expanduser('/opt/airflow/dags/.env'))

    USER = os.getenv("DB_USER")
    PASSWORD = os.getenv("DB_PASSWORD")
    HOST = os.getenv("DB_HOST")
    PORT = os.getenv("DB_PORT")
    DBNAME = os.getenv("DB_NAME")

    if not all([USER, PASSWORD, HOST, PORT, DBNAME]):
        raise ValueError("Database credentials are missing in .env")

    connection = psycopg2.connect(
        user=USER,
        password=PASSWORD,
        host=HOST,
        port=PORT,
        dbname=DBNAME
    )
    cursor = connection.cursor()

    # Get resource data directly from Resources table
    cursor.execute(
        '''SELECT "name", "region", "cloudProvider", "resourceConfigId"
           FROM "Resources"
           WHERE id = %s;''',
        (resource_id,)
    )
    resource = cursor.fetchone()
    if not resource:
        raise ValueError(f"No resource found for resource_id={resource_id}")

    repoName, region, cloudProvider, resourceConfigId = resource

    # Count K8s instances
    cursor.execute(
        '''SELECT id FROM "AwsK8sCluster" WHERE "resourceConfigId" = %s;''',
        (resourceConfigId,)
    )
    k8s_instances = cursor.fetchall()
    k8s_count = len(k8s_instances)

    cursor.close()
    connection.close()

    configInfo = {
        "resourceId": resource_id,
        "repoName": repoName,
        "region": region,
        "cloudProvider": cloudProvider,
        "k8sCount": k8s_count
    }

    return json.dumps(configInfo)


# -------------------------
# Step 3: Create terraform dir
# -------------------------
def create_terraform_directory(configInfo):
    config_dict = json.loads(configInfo)
    projectName = config_dict['repoName']
    # Keep AWS terraform modules isolated from other cloud providers.
    terraform_dir = f"/opt/airflow/dags/terraform/{projectName}/aws/rg"
    os.makedirs(terraform_dir, exist_ok=True)
    print(f"[x] Created directory {terraform_dir}")
    return terraform_dir


# -------------------------
# Step 4: Write terraform files
# -------------------------
def write_terraform_files(terraform_dir, configInfo):
    config_dict = json.loads(configInfo)

    # This folder is also used by other cloud DAGs in some setups. Terraform loads
    # all *.tf files in a directory; any leftover azurerm provider config will
    # break AWS runs (e.g., "Insufficient features blocks"). Clean old configs
    # but keep state files so re-runs remain idempotent.
    for tf_file in glob.glob(os.path.join(terraform_dir, "*.tf")):
        try:
            os.remove(tf_file)
        except OSError:
            pass
    lock_file = os.path.join(terraform_dir, ".terraform.lock.hcl")
    if os.path.exists(lock_file):
        try:
            os.remove(lock_file)
        except OSError:
            pass

    load_dotenv(expanduser('/opt/airflow/dags/.env'))

    project_name = f"{config_dict['repoName']}-{config_dict['resourceId'][:4]}"

    # terraform.auto.tfvars
    tfvars_content = f"""
access_key       = "{os.getenv('AWS_ACCESS_KEY')}"
secret_key       = "{os.getenv('AWS_SECRET_KEY')}"
project_location = "{config_dict['region']}"
project_name     = "{project_name}"
"""
    with open(f"{terraform_dir}/terraform.auto.tfvars", "w") as f:
        f.write(tfvars_content)

        # main.tf for shared cluster networking (VPC/Subnets/IGW/Routes)
        # This replaces the old aws_default_vpc approach.
        main_tf = """
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "local" {}
}

provider "aws" {
  region     = var.project_location
  access_key = var.access_key
  secret_key = var.secret_key
}

variable "access_key" {}
variable "secret_key" {}
variable "project_location" {}
variable "project_name" {}

resource "aws_vpc" "k3s_vpc" {
    cidr_block           = "10.0.0.0/16"
    enable_dns_hostnames = true
    enable_dns_support   = true

    tags = {
        Name = "${var.project_name}-k3s-vpc"
    }
}

resource "aws_internet_gateway" "k3s_igw" {
    vpc_id = aws_vpc.k3s_vpc.id

    tags = {
        Name = "${var.project_name}-k3s-igw"
    }
}

data "aws_availability_zones" "available" {
    state = "available"
}

# -------------------------
# Public + Private subnets
# -------------------------
resource "aws_subnet" "k3s_public_subnet" {
    count                   = 2
    vpc_id                  = aws_vpc.k3s_vpc.id
    cidr_block              = "10.0.${count.index}.0/24"
    availability_zone       = data.aws_availability_zones.available.names[count.index]
    map_public_ip_on_launch = true

    tags = {
        Name = "${var.project_name}-k3s-public-subnet-${count.index}"
        Tier = "public"
    }
}

resource "aws_subnet" "k3s_private_subnet" {
    count                   = 2
    vpc_id                  = aws_vpc.k3s_vpc.id
    cidr_block              = "10.0.${count.index + 10}.0/24"
    availability_zone       = data.aws_availability_zones.available.names[count.index]
    map_public_ip_on_launch = false

    tags = {
        Name = "${var.project_name}-k3s-private-subnet-${count.index}"
        Tier = "private"
    }
}

# -------------------------
# Routing: IGW for public, NAT for private
# -------------------------
resource "aws_route_table" "k3s_public_rt" {
    vpc_id = aws_vpc.k3s_vpc.id

    route {
        cidr_block = "0.0.0.0/0"
        gateway_id = aws_internet_gateway.k3s_igw.id
    }

    tags = {
        Name = "${var.project_name}-k3s-public-rt"
    }
}

resource "aws_route_table_association" "k3s_public_rta" {
    count          = 2
    subnet_id      = aws_subnet.k3s_public_subnet[count.index].id
    route_table_id = aws_route_table.k3s_public_rt.id
}

resource "aws_eip" "k3s_nat_eip" {
    domain = "vpc"
    tags = {
        Name = "${var.project_name}-k3s-nat-eip"
    }
}

resource "aws_nat_gateway" "k3s_nat" {
    allocation_id = aws_eip.k3s_nat_eip.id
    subnet_id     = aws_subnet.k3s_public_subnet[0].id

    tags = {
        Name = "${var.project_name}-k3s-nat"
    }

    depends_on = [aws_internet_gateway.k3s_igw]
}

resource "aws_route_table" "k3s_private_rt" {
    vpc_id = aws_vpc.k3s_vpc.id

    route {
        cidr_block     = "0.0.0.0/0"
        nat_gateway_id = aws_nat_gateway.k3s_nat.id
    }

    tags = {
        Name = "${var.project_name}-k3s-private-rt"
    }
}

resource "aws_route_table_association" "k3s_private_rta" {
    count          = 2
    subnet_id      = aws_subnet.k3s_private_subnet[count.index].id
    route_table_id = aws_route_table.k3s_private_rt.id
}

output "k3s_vpc_id" {
    value = aws_vpc.k3s_vpc.id
}

output "k3s_public_subnet_ids" {
    value = aws_subnet.k3s_public_subnet[*].id
}

output "k3s_private_subnet_ids" {
    value = aws_subnet.k3s_private_subnet[*].id
}
"""
    with open(f"{terraform_dir}/main.tf", "w") as f:
        f.write(main_tf)

    print(f"[x] Wrote terraform files in {terraform_dir}")


# -------------------------
# Step 5: Trigger K3s
# -------------------------
def branch_resources(configInfo):
    data = json.loads(configInfo)
    branches = []
    if data['k8sCount'] > 0:
        branches.append('trigger_k3s')
    if not branches:
        return 'end'
    return branches

# -------------------------
# Airflow DAG
# -------------------------
with DAG(
    dag_id="AWS_Resources_Cluster",
    default_args=default_args,
    description="Provision AWS VPC for Cluster",
    schedule_interval=None,
    start_date=datetime(2025, 9, 2),
    catchup=False,
) as dag:

    # Step 1: RabbitMQ
    get_resource_id = PythonOperator(
        task_id="get_resource_id",
        python_callable=rabbitmq_consumer,
    )

    # Step 2: DB
    get_config_info = PythonOperator(
        task_id="get_config_info",
        python_callable=lambda ti: fetch_from_database(ti.xcom_pull(task_ids="get_resource_id")),
    )

    # Step 3: Dir
    create_tf_dir = PythonOperator(
        task_id="create_tf_dir",
        python_callable=lambda ti: create_terraform_directory(ti.xcom_pull(task_ids="get_config_info")),
    )

    # Step 4: Write tf files
    write_tf_files = PythonOperator(
        task_id="write_tf_files",
        python_callable=lambda ti: write_terraform_files(
            ti.xcom_pull(task_ids="create_tf_dir"),
            ti.xcom_pull(task_ids="get_config_info"),
        ),
    )

    # Step 5: Terraform apply
    terraform_apply = BashOperator(
        task_id="terraform_apply",
        bash_command="""
        cd {{ ti.xcom_pull(task_ids='create_tf_dir') }}
        terraform init -input=false
        terraform apply -auto-approve -input=false
        """,
    )

    branch_task = BranchPythonOperator(
        task_id='branch_resources',
        python_callable=lambda ti: branch_resources(ti.xcom_pull(task_ids='get_config_info'))
    )

    # Trigger K3s DAG
    trigger_k3s = TriggerDagRunOperator(
        task_id="trigger_k3s",
        trigger_dag_id="AWS_terraform_k3s_provision",
        conf={"resource_id": "{{ ti.xcom_pull(task_ids='get_resource_id') }}"},
        wait_for_completion=False,
        trigger_rule='all_success',
    )

    end = EmptyOperator(task_id="end")

    # Workflow
    get_resource_id >> get_config_info >> create_tf_dir >> write_tf_files >> terraform_apply >> branch_task >> trigger_k3s >> end
