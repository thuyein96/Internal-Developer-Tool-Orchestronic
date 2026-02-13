import ast
import os
import json
import pika
import psycopg2
from dotenv import load_dotenv
from os.path import expanduser
from pathlib import Path
from datetime import datetime, timedelta
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

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
    request_id = context['dag_run'].conf.get('request_id')
    if not request_id:
        raise ValueError("No message received. Stop DAG run.")

    # Load environment variables
    load_dotenv(expanduser('/opt/airflow/dags/.env'))

    USER = os.getenv("DB_USER")
    PASSWORD = os.getenv("DB_PASSWORD")
    HOST = os.getenv("DB_HOST")
    PORT = os.getenv("DB_PORT")
    DBNAME = os.getenv("DB_NAME")

    print(f"Connecting to database {DBNAME} at {HOST}:{PORT} as user {USER}")

    connection = psycopg2.connect(
        user=USER,
        password=PASSWORD,
        host=HOST,
        port=PORT,
        dbname=DBNAME,
    )
    cursor = connection.cursor()

    # ResourcesId, repositoryId
    cursor.execute(
        'SELECT "resourcesId", "repositoryId" FROM "Request" WHERE id = %s;',
        (request_id,)
    )
    res = cursor.fetchone()
    if not res:
        raise ValueError(f"No request found for id={request_id}")
    resourcesId, repositoryId = res

    # ResourceConfigId
    cursor.execute(
        'SELECT "region", "resourceConfigId" FROM "Resources" WHERE id = %s;',
        (resourcesId,)
    )
    row = cursor.fetchone()
    if not row:
        raise ValueError(f"No resource found for resourceConfigId={resourcesId}")
    region, resourceConfigId = row

    # ProjectName
    cursor.execute(
        'SELECT "name" FROM "Repository" WHERE id = %s;',
        (repositoryId,)
    )
    row = cursor.fetchone()
    if not row:
        raise ValueError(f"No repository found for id={repositoryId}")
    projectName = row[0]

    # dbAllocatedStorage, dbName, dbUsername, dbPassword, engine, awsDatabaseTypeId
    cursor.execute(
        'SELECT "dbAllocatedStorage", "dbName", "dbUsername", "dbPassword", "engine", "awsDatabaseTypeId" '
        'FROM "AwsDatabaseInstance" WHERE "resourceConfigId" = %s;',
        (resourceConfigId,)
    )
    db_instances = cursor.fetchall()
    if not db_instances:
        raise ValueError(f"No DB instance found for resourceConfigId={resourceConfigId}")
    # print(f"DB Instances: {db_instances}")
    # Shared values


    instance_list = []
    for db in db_instances:
        dbAllocatedStorage, dbName, dbUsername, dbPassword, engine, awsDatabaseTypeId = db
        cursor.execute(
            'SELECT "DBInstanceClass" FROM "AwsDatabaseType" WHERE id = %s;',
            (awsDatabaseTypeId,)
        )
        row = cursor.fetchone()
        if not row:
            raise ValueError(f"No instance type found for id={awsDatabaseTypeId}")
        instanceType = row[0]

        instance_list.append({
            "db_name": dbName,
            "instance_type": instanceType,
            "db_allocated_storage": dbAllocatedStorage,
            "db_username": dbUsername,
            "db_password": dbPassword,
            "engine": "postgres" if engine == "PostgreSQL" else "mysql"
        })

    cursor.close()
    connection.close()

    configInfo = {
        "resourcesId": resourcesId, 
        "project_name": projectName,
        "region": region,
        "db_instances": instance_list
    }
    return configInfo


def create_terraform_directory(configInfo):
    if isinstance(configInfo, str):
        import ast
        configInfo = ast.literal_eval(configInfo)
        
    projectName = configInfo['project_name']
    terraform_dir = f"/opt/airflow/dags/terraform/{projectName}/db"
    os.makedirs(terraform_dir, exist_ok=True)
    print(f"[x] Created directory {terraform_dir}")
    return terraform_dir

def write_terraform_files(terraform_dir, configInfo):
    if isinstance(configInfo, str):
        import ast
        configInfo = ast.literal_eval(configInfo)
        
    config_dict = configInfo
    projectName = f"{config_dict['project_name']}"
    db_resources = config_dict['db_instances']

    load_dotenv(expanduser('/opt/airflow/dags/.env'))
     # terraform.auto.tfvars
    tfvars_content = f"""
    access_key      = "{os.getenv('AWS_ACCESS_KEY')}"
    secret_key           = "{os.getenv('AWS_SECRET_KEY')}"
    project_location     = "{config_dict['region']}"
    project_name         = "{projectName}"
    db_resources = {json.dumps(db_resources, indent=4)}
    """
    with open(f"{terraform_dir}/terraform.auto.tfvars", "w") as f:
        f.write(tfvars_content)

    main_tf_content = f"""
terraform {{
  required_providers {{
    aws = {{
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }}
  }}
  required_version = ">= 1.5.0"
}}

provider "aws" {{
    region     = var.project_location
    access_key = var.access_key
    secret_key = var.secret_key
}}

# ===============================
# Networking - VPC + Subnets
# ===============================
resource "aws_vpc" "main" {{
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
}}

resource "aws_internet_gateway" "igw" {{
  vpc_id = aws_vpc.main.id
}}

resource "aws_route_table" "rt" {{
  vpc_id = aws_vpc.main.id

  route {{
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }}
}}

resource "aws_subnet" "subnet1" {{
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "ap-southeast-1a"
  map_public_ip_on_launch = true
}}

resource "aws_subnet" "subnet2" {{
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "ap-southeast-1b"
  map_public_ip_on_launch = true
}}

resource "aws_route_table_association" "subnet1_assoc" {{
  subnet_id      = aws_subnet.subnet1.id
  route_table_id = aws_route_table.rt.id
}}

resource "aws_route_table_association" "subnet2_assoc" {{
  subnet_id      = aws_subnet.subnet2.id
  route_table_id = aws_route_table.rt.id
}}

# ===============================
# Security Group
# ===============================

resource "aws_security_group" "db_sg" {{
  name        = "{projectName}-db-sg"
  description = "Allow DB traffic"
  vpc_id      = aws_vpc.main.id

  ingress {{
    from_port   = var.db_resources[0].engine == "postgres" ? 5432 : 3306
    to_port     = var.db_resources[0].engine == "postgres" ? 5432 : 3306
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }}

  egress {{
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }}
}}

# ===============================
# DB Subnet Group
# ===============================
resource "aws_db_subnet_group" "db_subnet" {{
  name       = "{projectName}-db-subnet-group"
  subnet_ids = [aws_subnet.subnet1.id, aws_subnet.subnet2.id]
  description = "Subnet group for RDS"
}}

# ===============================
# RDS Database Instance
# ===============================
resource "aws_db_instance" "db" {{
  for_each              = {{ for db in var.db_resources : db.db_name => db }}
  identifier             = each.value.db_name
  engine                 = each.value.engine
  instance_class         = each.value.instance_type
  allocated_storage      = each.value.db_allocated_storage
  db_name                = each.value.db_name
  username               = each.value.db_username
  password               = each.value.db_password
  db_subnet_group_name   = aws_db_subnet_group.db_subnet.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  skip_final_snapshot    = true
  publicly_accessible    = true
}}

# ===============================
# Outputs
# ===============================
output "db_endpoint" {{
  value = {{ for k, v in aws_db_instance.db : k => v.endpoint }}
}}

output "db_port" {{
  value = {{ for k, v in aws_db_instance.db : k => v.port }}
}}
    """
    with open(f"{terraform_dir}/main.tf", "w") as f:
        f.write(main_tf_content)

    load_dotenv(expanduser('/opt/airflow/dags/.env'))

    variables_tf = f"""
    variable "access_key" {{
    default = "{os.getenv('AWS_ACCESS_KEY')}"
    }}

    variable "secret_key" {{
    default = "{os.getenv('AWS_SECRET_KEY')}"
    }}

    variable "project_name" {{
    type        = string
    description = "Project name"
    }}


    variable "project_location" {{
    default = "{config_dict['region']}"
    }}

    variable "db_resources" {{
    type = list(object({{
    db_name             = string
    instance_type       = string
    db_allocated_storage= number
    db_username         = string
    db_password         = string
    engine              = string
    }}))
    }}

    """
    with open(f"{terraform_dir}/variables.tf", "w") as f:
        f.write(variables_tf)
    
    print(f"[x] Created Terraform files in {terraform_dir}")

def write_to_db(terraform_dir, configInfo):
    import ast
    configInfo = ast.literal_eval(configInfo)

    vm_output_file = Path(terraform_dir) / "terraform.tfstate"

    if not vm_output_file.exists():
        raise FileNotFoundError(f"Terraform state file not found at {vm_output_file}")

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
    cursor.execute('''
        SELECT "name", "region", "resourceConfigId"
        FROM "Resources" WHERE id = %s;
    ''', (configInfo['resourcesId'],))
    resource = cursor.fetchone()
    if not resource:
        raise ValueError(f"No resource found for resourcesId={configInfo['resourcesId']}")

    repoName, region, resourceConfigId = resource

    with open(vm_output_file, 'r') as f:
        vm_state = json.load(f)

    print(vm_output_file, resourceConfigId)
    cursor.execute(
    'UPDATE "AwsDatabaseInstance" SET "terraformState" = %s WHERE "resourceConfigId" = %s;',
    (json.dumps(vm_state), resourceConfigId)
    )
    connection.commit()
    cursor.close()
    connection.close()

with DAG(
    'AWS_terraform_db_provision',
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

    write_to_db_db = PythonOperator(
        task_id="write_to_db",
        python_callable=write_to_db,
        op_args=[
            "{{ ti.xcom_pull(task_ids='create_terraform_dir') }}",
            "{{ ti.xcom_pull(task_ids='fetch_config') }}",
        ],
    )

    fetch_task >> create_dir_task >> write_files_task >> terraform_init >> terraform_apply >> write_to_db_db
