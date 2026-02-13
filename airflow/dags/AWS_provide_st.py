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
    # request_id = "6dca83a9-048f-4cfe-a81a-2f8bfa163097"
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

    # awsInstanceType, instanceName, keyName, sgName
    cursor.execute(
        'SELECT "bucketName" '
        'FROM "AwsStorageInstance" WHERE "resourceConfigId" = %s;',
        (resourceConfigId,)
    )
    st_instances = cursor.fetchall()
    if not st_instances:
        raise ValueError(f"No VM instance found for resourceConfigId={resourceConfigId}")
    print(f"VM Instances: {st_instances}")


    instances_list = []
    for instance in st_instances:
        instances_list.append({
        "bucket_name": instance[0]
     })

    cursor.close()
    connection.close()

    configInfo = {
        "resourcesId": resourcesId, 
        "project_name": projectName,
        "region": region,
        "st_instances": instances_list,
    }
    return configInfo

def create_terraform_directory(configInfo):
    if isinstance(configInfo, str):
        import ast
        configInfo = ast.literal_eval(configInfo)
        
    projectName = configInfo['project_name']
    terraform_dir = f"/opt/airflow/dags/terraform/{projectName}/st"
    os.makedirs(terraform_dir, exist_ok=True)
    print(f"[x] Created directory {terraform_dir}")
    return terraform_dir

def to_bucket_name(region: str,name: str) -> str:
    import re, uuid
    name = name.lower()
    name = re.sub(r'[^a-z0-9-]', '-', name)
    name = re.sub(r'-+', '-', name)
    name = name.strip('-')
    # add random short suffix to ensure uniqueness
    suffix = uuid.uuid4().hex[:6]
    return f"{name}-{region}-{suffix}"

def write_terraform_files(configInfo, terraform_dir):
    if isinstance(configInfo, str):
        import ast
        configInfo = ast.literal_eval(configInfo)

        config_dict = configInfo   
        st_resources = [
        {"bucket_name": to_bucket_name(config_dict['region'], b['bucket_name'])}
        for b in config_dict['st_instances']
        ]

        project_name = to_bucket_name(config_dict['project_name'], config_dict['region'])
        load_dotenv(expanduser('/opt/airflow/dags/.env'))

     # terraform.auto.tfvars
    tfvars_content = f"""
    access_key      = "{os.getenv('AWS_ACCESS_KEY')}"
    secret_key           = "{os.getenv('AWS_SECRET_KEY')}"
    project_location     = "{config_dict['region']}"
    project_name         = "{project_name}"
    st_resources = {json.dumps(st_resources, indent=4)}
    """
    with open(f"{terraform_dir}/terraform.auto.tfvars", "w") as f:
        f.write(tfvars_content)

    main_tf_content = f'''
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

locals {{
    common_tags = {{
        Project = var.project_name
    }}
}}

# S3 bucket for storage
resource "aws_s3_bucket" "app_bucket" {{
  for_each = {{ for b in var.st_resources : b.bucket_name => b }}

  bucket = each.value.bucket_name
  tags = merge(
    local.common_tags,
    {{
      Name = "${{each.value.bucket_name}}-storage"
    }}
  )
}}


# Block all public access
resource "aws_s3_bucket_public_access_block" "app_bucket_block" {{
  for_each = aws_s3_bucket.app_bucket

  bucket                  = each.value.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}}

resource "aws_s3_bucket_versioning" "app_bucket_versioning" {{
  for_each = aws_s3_bucket.app_bucket

  bucket = each.value.id
  versioning_configuration {{
    status = "Enabled"
  }}
}}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_bucket_encryption" {{
  for_each = aws_s3_bucket.app_bucket

  bucket = each.value.id

  rule {{
    apply_server_side_encryption_by_default {{
      sse_algorithm = "AES256"
    }}
  }}
}}


output "bucket_name" {{
  value = [for b in aws_s3_bucket.app_bucket : b.id]
}}

output "bucket_arn" {{
   value = [for b in aws_s3_bucket.app_bucket : b.arn]
}}

    '''

    variables_tf_content = f'''
    variable "access_key" {{
    default = "{os.getenv('AWS_ACCESS_KEY')}"
    }}

    variable "secret_key" {{
    default = "{os.getenv('AWS_SECRET_KEY')}"
    }}

    variable "project_location" {{
    default = "{config_dict['region']}"
    }}

    variable "project_name" {{
      default = "{project_name}"
    }}

    variable "st_resources" {{ 
        description = "List of storage instances"
        type        = list(object({{ bucket_name = string }})) 
        }}
    '''

    terraform_files = {
        'main.tf': main_tf_content,
        'variables.tf': variables_tf_content,
    }

    for filename, content in terraform_files.items():
        file_path = os.path.join(terraform_dir, filename)
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"[x] Written {file_path}")

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
    'UPDATE "AwsStorageInstance" SET "terraformState" = %s WHERE "resourceConfigId" = %s;',
    (json.dumps(vm_state), resourceConfigId)
    )
    connection.commit()
    cursor.close()
    connection.close()

with DAG(
    'AWS_terraform_st_provision',
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
             "{{ ti.xcom_pull(task_ids='fetch_config') }}",  
        "{{ ti.xcom_pull(task_ids='create_terraform_dir') }}", 
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

    write_to_db_st = PythonOperator(
        task_id="write_to_db",
        python_callable=write_to_db,
        op_args=[
            "{{ ti.xcom_pull(task_ids='create_terraform_dir') }}",
            "{{ ti.xcom_pull(task_ids='fetch_config') }}",
        ],
    )

    fetch_task >> create_dir_task >> write_files_task >> terraform_init >> terraform_apply >> write_to_db_st
