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

    # cursor.execute(
    #     'SELECT "resourcesId" FROM "ProjectRequest" WHERE id = %s;',
    #     (resource_id,)
    # )
    # res = cursor.fetchone()
    # if not res:
    #     raise ValueError(f"No request found for id={resource_id}")
    # resourcesId = res[0]

    cursor.execute('''
        SELECT "name", "region", "resourceConfigId"
        FROM "Resources" WHERE id = %s;
    ''', (resource_id,))
    resource = cursor.fetchone()
    if not resource:
        raise ValueError(f"No resource found for resourcesId={resource_id}")

    repoName, region, resourceConfigId = resource

    cursor.execute(
        'SELECT "id", "clusterName", "nodeCount", "nodeSize" '
        'FROM "AzureK8sCluster" WHERE "resourceConfigId" = %s;',
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
subscription_id  = "{os.getenv('AZURE_SUBSCRIPTION_ID')}"
client_id        = "{os.getenv('AZURE_CLIENT_ID')}"
client_secret    = "{os.getenv('AZURE_CLIENT_SECRET')}"
tenant_id        = "{os.getenv('AZURE_TENANT_ID')}"
project_location = "{config_dict['region']}"
project_name     = "{projectName}"
k8s_clusters     = {json.dumps(k8s_clusters, indent=4)}
"""
    with open(f"{terraform_dir}/terraform.auto.tfvars", "w") as f:
        f.write(tfvars_content)

    # main.tf - CREATE OR USE EXISTING VNET
    main_tf_content = f"""
terraform {{
  required_providers {{
    azurerm = {{
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }}
    kubernetes = {{
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
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
  name = var.project_name
}}

# Try to get existing VNet, create if doesn't exist
resource "azurerm_virtual_network" "aks_vnet" {{
  name                = "${{var.project_name}}-aks-vnet"
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  address_space       = ["10.1.0.0/16"]
  
  lifecycle {{
    ignore_changes = [tags]
  }}
}}

# Try to get existing Subnet, create if doesn't exist
resource "azurerm_subnet" "aks_subnet" {{
  name                 = "${{var.project_name}}-aks-subnet"
  resource_group_name  = data.azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.aks_vnet.name
  address_prefixes     = ["10.1.0.0/24"]
  
  lifecycle {{
    ignore_changes = [delegation]
  }}
}}

# AKS Clusters - All share the same VNet/Subnet
resource "azurerm_kubernetes_cluster" "aks_cluster" {{
  for_each = {{ for cluster in var.k8s_clusters : cluster.id => cluster }}
  
  name                = each.value.cluster_name
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  dns_prefix          = each.value.cluster_name
  
  default_node_pool {{
    name                = "default"
    node_count          = each.value.node_count
    vm_size             = each.value.node_size
    vnet_subnet_id      = azurerm_subnet.aks_subnet.id
    enable_auto_scaling = false
  }}
  
  identity {{
    type = "SystemAssigned"
  }}
  
  network_profile {{
    network_plugin     = "azure"
    load_balancer_sku  = "standard"
    service_cidr       = "10.2.0.0/16"
    dns_service_ip     = "10.2.0.10"
  }}
}}

# Output cluster information
output "cluster_names" {{
  value = {{ for name, cluster in azurerm_kubernetes_cluster.aks_cluster : name => cluster.name }}
}}

output "kube_configs" {{
  value = {{ for name, cluster in azurerm_kubernetes_cluster.aks_cluster : name => cluster.kube_admin_config_raw }}
  sensitive = true
}}

output "cluster_fqdns" {{
  value = {{ for name, cluster in azurerm_kubernetes_cluster.aks_cluster : name => cluster.fqdn }}
}}
"""

    with open(f"{terraform_dir}/main.tf", "w") as f:
        f.write(main_tf_content)

    # variables.tf (same as before)
    variables_tf = f"""
variable "subscription_id" {{
  description = "Azure Subscription ID"
  type        = string
}}

variable "client_id" {{
  description = "Azure Client ID"
  type        = string
}}

variable "client_secret" {{
  description = "Azure Client Secret"
  type        = string
  sensitive   = true
}}

variable "tenant_id" {{
  description = "Azure Tenant ID"
  type        = string
}}

variable "project_location" {{
  description = "Azure Location"
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

def write_to_db(terraform_dir, configInfo, *args, **context):
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
        cluster_fqdn = None

        for resource in k8s_state.get('resources', []):
            if resource.get('type') == 'azurerm_kubernetes_cluster' and resource.get('name') == 'aks_cluster':
                for instance in resource.get('instances', []):
                    attributes = instance.get('attributes', {})
                    index_key = instance.get('index_key')

                    # Match either by for_each key (cluster id) or by name
                    if index_key == cluster_id or attributes.get('name') == cluster_name:
                        kube_config_raw = (
                            attributes.get('kube_admin_config_raw')
                            or attributes.get('kube_config_raw')
                            or ''
                        )
                        cluster_fqdn = attributes.get('fqdn', '')
                        break
                if kube_config_raw:
                    break

        if not kube_config_raw:
            print(f"Warning: No kubeconfig found in Terraform state for cluster {cluster_id}")
            continue

        cursor.execute(
            'UPDATE "AzureK8sCluster" '
            'SET "kubeConfig" = %s, "clusterFqdn" = %s, "terraformState" = %s '
            'WHERE "id" = %s;',
            (kube_config_raw, cluster_fqdn, json.dumps(k8s_state), cluster_id)
        )

    connection.commit()
    cursor.close()
    connection.close()

with DAG(
    'AZURE_terraform_k8s_provision',
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