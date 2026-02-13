import ast
import json
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from pathlib import Path

from datetime import datetime
import os
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
# Step 1: RabbitMQ Consumer
# -------------------------

# def rabbitmq_consumer():
#     load_dotenv(expanduser('/opt/airflow/dags/.env'))
#     rabbit_url = os.getenv("RABBITMQ_URL")
#     rabbit_url = "amqp://airflow:airflow@airflow_rabbitmq_broker:5672" #"amqp://guest:guest@host.docker.internal:5672"
#     if not rabbit_url:
#         raise ValueError("RABBITMQ_URL is not set in .env")

#     connection = pika.BlockingConnection(pika.URLParameters(rabbit_url))
#     channel = connection.channel()

#     method_frame, header_frame, body = channel.basic_get(queue='request', auto_ack=True)
#     if method_frame:
#         message = body.decode()
#         obj = json.loads(message)
#         request_id = obj["data"]["requestId"]
#         print(f"[x] Got message: {request_id}")
#         connection.close()
#         return request_id
#     else:
#         print("[x] No message in queue")
#         connection.close()
#         return None

# -------------------------
# Step 2: Fetch from Supabase / PostgreSQL
# -------------------------
import psycopg2

def fetch_from_database(**context):
    request_id = context['dag_run'].conf.get('request_id')
    if not request_id:
        raise ValueError("No message received from RabbitMQ. Stop DAG run.")

    load_dotenv(expanduser('/opt/airflow/dags/.env'))
    USER = os.getenv("DB_USER")
    PASSWORD = os.getenv("DB_PASSWORD")
    HOST = os.getenv("DB_HOST")
    PORT = os.getenv("DB_PORT")
    DBNAME = os.getenv("DB_NAME")

    if not all([USER, PASSWORD, HOST, PORT, DBNAME]):
        raise ValueError("Database credentials are missing in .env")

    try:
        connection = psycopg2.connect(
            user=USER,
            password=PASSWORD,
            host=HOST,
            port=PORT,
            dbname=DBNAME
        )
        cursor = connection.cursor()

        # Get resourcesId from requests table
        cursor.execute('SELECT "resourcesId" FROM "Request" WHERE id = %s;', (request_id,))
        res = cursor.fetchone()
        if not res:
            raise ValueError(f"No request found for id={request_id}")
        resourcesId = res[0]

        # Get projectName from Repository table
        cursor.execute('SELECT "name" FROM "Repository" WHERE "resourcesId" = %s;', (resourcesId,)
        )
        projectName = cursor.fetchone()

        # Get resource data
        cursor.execute('''
            SELECT "name", "region", "cloudProvider", "resourceConfigId" 
            FROM "Resources" 
            WHERE id = %s;
        ''', (resourcesId,))
        resource = cursor.fetchone()
        if not resource:
            raise ValueError(f"No resource found for resourcesId={resourcesId}")

        repoName, region, cloudProvider, resourceConfigId = resource

        # Get StorageInstance data
        cursor.execute('SELECT * FROM "AzureStorageInstance" WHERE "resourceConfigId" = %s;', (resourceConfigId,))
        storage_instances = cursor.fetchall()
        print(storage_instances)
        cursor.close()
        connection.close()

        # -------------------------
        # Process Storage Instances
        # -------------------------
        storage_list = []

        for storage_instance in storage_instances:
            id_, resourceConfigId, access_tier, kind, name, sku_replication, terraformState = storage_instance
            sku, replication = sku_replication.split("_", 1)
            storage_list.append({
                "id": id_,
                "resourceConfigId": resourceConfigId,
                "name": name,
                "account_tier": sku,
                "account_replication_type": replication,
                "account_kind": kind,
                "access_tier": access_tier,
            })

        configInfo = {
            "repoName": repoName,
            "region": region,
            "cloudProvider": cloudProvider,
            "resourcesId": resourcesId,
            "storageInstances": storage_list
        }

        return configInfo

    except Exception as e:
        raise RuntimeError(f"Database error: {e}")

# -------------------------
# Step 3: Create Terraform Directory
# -------------------------
def create_terraform_directory(configInfo):
    config_dict = ast.literal_eval(configInfo)
    projectName = config_dict['repoName']
    terraform_dir = f"/opt/airflow/dags/terraform/{projectName}/st"
    os.makedirs(terraform_dir, exist_ok=True)
    print(f"[x] Terraform directory ready: {terraform_dir}")
    return terraform_dir

# -------------------------
# Step 4: Write Terraform Storage Files
# -------------------------
def write_terraform_storage_files(terraform_dir, configInfo):
    import json
    from datetime import datetime

    config_dict = ast.literal_eval(configInfo)
    storage_resources = config_dict.get("storageInstances", [])
    projectName = f"{config_dict['repoName']}-{config_dict['resourcesId'][:4]}"

    # -------------------------
    # terraform.auto.tfvars
    # -------------------------
    load_dotenv(expanduser('/opt/airflow/dags/.env'))
    tfvars_content = f"""
subscription_id      = "{os.getenv('AZURE_SUBSCRIPTION_ID')}"
client_id            = "{os.getenv('AZURE_CLIENT_ID')}"
client_secret        = "{os.getenv('AZURE_CLIENT_SECRET')}"
tenant_id            = "{os.getenv('AZURE_TENANT_ID')}"
project_location     = "{config_dict['region']}"
repoName             = "{config_dict['repoName'] + '-' + config_dict['resourcesId'][:4]}"
storage_resources    = {json.dumps(storage_resources, indent=4)}
"""
    tfvars_file = os.path.join(terraform_dir, f"{config_dict['repoName']}-st.auto.tfvars")
    with open(tfvars_file, "w") as f:
        f.write(tfvars_content)
    print(f"[x] Created {tfvars_file}")

    # -------------------------
    # variables.tf
    # -------------------------
    variables_tf_content = f"""
        variable "subscription_id" {{
        default = "{os.getenv('AZURE_SUBSCRIPTION_ID')}"
        }}

        variable "client_id" {{
        default = "{os.getenv('AZURE_CLIENT_ID')}"
        }}

        variable "client_secret" {{
        default = "{os.getenv('AZURE_CLIENT_SECRET')}"
        }}

        variable "tenant_id" {{
        default = "{os.getenv('AZURE_TENANT_ID')}"
        }}

        variable "project_location" {{
        default = "{config_dict['region']}"
        }}

        variable "repoName" {{
        default = "{projectName}"
        }}

        variable "storage_resources" {{
        type = list(map(any))
        }}

        """
    variables_file = os.path.join(terraform_dir, f"{config_dict['repoName']}-st.variables.tf")
    with open(variables_file, "w") as f:
        f.write(variables_tf_content)
    print(f"[x] Created {variables_file}")

    # -------------------------
    # main.tf
    # -------------------------
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    main_tf_file = os.path.join(terraform_dir, f"{config_dict['repoName']}-st-{timestamp}.tf")
    main_tf_content = f"""
terraform {{
  required_providers {{
    azurerm = {{
      source  = "hashicorp/azurerm"
      version = "~>3.0"
    }}
  }}
}}

provider "azurerm" {{
  features {{}}
  subscription_id = var.subscription_id
  client_id       = var.client_id
  client_secret   = var.client_secret
  tenant_id       = var.tenant_id
}}

data "azurerm_resource_group" "rg" {{
  name = "{projectName}"
}}

locals {{
  rg_name     = data.azurerm_resource_group.rg.name
  rg_location = data.azurerm_resource_group.rg.location
}}


resource "azurerm_storage_account" "storage" {{
  for_each = {{ for s in var.storage_resources : s.id => s }}

  name                     = "${{each.value.name}}${{substr(each.value.id, 0, 6)}}"
  resource_group_name      = local.rg_name
  location                 = local.rg_location
  account_tier             = each.value.account_tier
  account_replication_type = each.value.account_replication_type
  account_kind             = each.value.account_kind
  access_tier              = each.value.access_tier
}}

output "storage_account_names" {{
  value = {{ for k, v in azurerm_storage_account.storage : k => v.name }}
}}
"""
    with open(main_tf_file, "w") as f:
        f.write(main_tf_content)
    print(f"[x] Created {main_tf_file}")
    return main_tf_file

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
    'UPDATE "AzureStorageInstance" SET "terraformState" = %s WHERE "resourceConfigId" = %s;',
    (json.dumps(vm_state), resourceConfigId)
    )
    connection.commit()
    cursor.close()
    connection.close()

# -------------------------
# DAG Definition
# -------------------------
with DAG(
    'AZURE_terraform_st_provision',
    default_args=default_args,
    schedule_interval=None,
    catchup=False,
    max_active_runs=5,
) as dag:

    # consume_task = PythonOperator(
    #     task_id="consume_rabbitmq",
    #     python_callable=rabbitmq_consumer,
    #     execution_timeout=timedelta(seconds=15),
    # )

    fetch_task = PythonOperator(
        task_id="fetch_config",
        python_callable=fetch_from_database
    )

    create_dir_task = PythonOperator(
        task_id="create_terraform_dir",
        python_callable=create_terraform_directory,
        op_args=["{{ ti.xcom_pull(task_ids='fetch_config') }}"],
    )

    write_files_task = PythonOperator(
        task_id="write_terraform_files",
        python_callable=write_terraform_storage_files,
        op_args=["{{ ti.xcom_pull(task_ids='create_terraform_dir') }}",
                 "{{ ti.xcom_pull(task_ids='fetch_config') }}"],
    )

    terraform_init = BashOperator(
        task_id="terraform_init",
        bash_command="cd {{ ti.xcom_pull(task_ids='create_terraform_dir') }} && terraform init",
    )

    # Import RG if exists in Azure
    # terraform_import = BashOperator(
    #     task_id="terraform_import_rg",
    #     bash_command=(
    #         "cd {{ ti.xcom_pull(task_ids='create_terraform_dir') }} && "
    #         "terraform import -no-color "
    #         "azurerm_resource_group.rg "
    #         '"/subscriptions/$AZURE_SUBSCRIPTION_ID/resourceGroups/rg-{{ ti.xcom_pull(task_ids=\'fetch_config\')[\'repoName\'] }}-{{ ti.xcom_pull(task_ids=\'fetch_config\')[\'resourcesId\'][:4] }}" || true'
    #     ),
    #     env={
    #         "AZURE_SUBSCRIPTION_ID": os.getenv("AZURE_SUBSCRIPTION_ID", ""),
    #     }
    # )

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
