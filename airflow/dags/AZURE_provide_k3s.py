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
    "owner": "admin",
    "depends_on_past": False,
    "start_date": datetime(2025, 1, 1),
    "retries": 1,
}
def fetch_from_database(**context):
    resource_id = context["dag_run"].conf.get("resource_id")
    if not resource_id:
        raise ValueError("No resource_id received. Stop DAG run.")

    load_dotenv(expanduser("/opt/airflow/dags/.env"))

    connection = psycopg2.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
    )
    cursor = connection.cursor()

    cursor.execute(
        'SELECT "name", "region", "resourceConfigId" FROM "Resources" WHERE id = %s;',
        (resource_id,),
    )
    resource = cursor.fetchone()
    if not resource:
        raise ValueError(f"No resource found for resource_id={resource_id}")

    repo_name, region, resource_config_id = resource

    cursor.execute(
        'SELECT "id", "clusterName", "nodeCount", "nodeSize" '
        'FROM "AzureK8sCluster" WHERE "resourceConfigId" = %s;',
        (resource_config_id,),
    )
    k3s_clusters = cursor.fetchall()
    if not k3s_clusters:
        raise ValueError(f"No K3s clusters found for resourceConfigId={resource_config_id}")

    cluster_list = []
    for cluster_id, cluster_name, node_count, node_size in k3s_clusters:
        cluster_list.append(
            {
                "id": str(cluster_id),
                "cluster_name": cluster_name,
                "node_count": int(node_count),
                "node_size": node_size,
            }
        )

    cursor.close()
    connection.close()

    return {
        "resourcesId": str(resource_id),
        "repoName": repo_name,
        "region": region,
        "k3s_clusters": cluster_list,
    }


def create_terraform_directory(config_info):
    if isinstance(config_info, str):
        config_info = ast.literal_eval(config_info)

    repo_name = config_info["repoName"]
    terraform_dir = f"/opt/airflow/dags/terraform/{repo_name}/k3s"
    os.makedirs(terraform_dir, exist_ok=True)
    return terraform_dir


def write_terraform_files(terraform_dir, config_info):
    if isinstance(config_info, str):
        config_info = ast.literal_eval(config_info)

    project_name = f"{config_info['repoName']}-{config_info['resourcesId'][:4]}"
    k3s_clusters = config_info["k3s_clusters"]

    load_dotenv(expanduser("/opt/airflow/dags/.env"))

    admin_cidr = os.getenv("ADMIN_CIDR", "0.0.0.0/0")

    tfvars_content = f"""
subscription_id  = \"{os.getenv('AZURE_SUBSCRIPTION_ID')}\"
client_id        = \"{os.getenv('AZURE_CLIENT_ID')}\"
client_secret    = \"{os.getenv('AZURE_CLIENT_SECRET')}\"
tenant_id        = \"{os.getenv('AZURE_TENANT_ID')}\"
project_location = \"{config_info['region']}\"
project_name     = \"{project_name}\"
admin_cidr       = \"{admin_cidr}\"
k3s_clusters     = {json.dumps(k3s_clusters, indent=4)}
"""

    with open(f"{terraform_dir}/terraform.auto.tfvars", "w") as f:
        f.write(tfvars_content)

    try:
        with open("/opt/airflow/dags/.ssh/id_rsa.pub", "r") as pub_key_file:
            ssh_public_key = pub_key_file.read().strip()
    except FileNotFoundError:
        raise ValueError("Public key not found at /opt/airflow/dags/.ssh/id_rsa.pub")

    main_tf_template = """
terraform {{
  required_providers {{
    azurerm = {{
      source  = \"hashicorp/azurerm\"
      version = \"~>3.0\"
    }}
  }}
  backend \"local\" {{}}
}}

provider \"azurerm\" {{
  features {{}}
  subscription_id = var.subscription_id
  client_id       = var.client_id
  client_secret   = var.client_secret
  tenant_id       = var.tenant_id
}}

data \"azurerm_resource_group\" \"rg\" {{
  name = var.project_name
}}

locals {{
  rg_name     = data.azurerm_resource_group.rg.name
  rg_location = data.azurerm_resource_group.rg.location

  master_map = {{ for c in var.k3s_clusters : c.id => c }}

  worker_instances = flatten([
    for c in var.k3s_clusters : [
      for i in range(c.node_count) : {{
        key         = \"${{c.id}}-${{i}}\"
        cluster_id  = c.id
        cluster_name = c.cluster_name
        node_size   = c.node_size
        index       = i
      }}
    ]
  ])

  worker_map = {{ for w in local.worker_instances : w.key => w }}
}}

resource \"azurerm_virtual_network\" \"k3s_vnet\" {{
  name                = \"vnet-${{var.project_name}}\"
  location            = local.rg_location
  resource_group_name = local.rg_name
  address_space       = [\"10.0.0.0/16\"]
}}

resource \"azurerm_subnet\" \"public_subnet\" {{
  name                 = \"subnet-public-${{var.project_name}}\"
  resource_group_name  = local.rg_name
  virtual_network_name = azurerm_virtual_network.k3s_vnet.name
  address_prefixes     = [\"10.0.0.0/24\"]
}}

resource \"azurerm_subnet\" \"private_subnet\" {{
  name                 = \"subnet-private-${{var.project_name}}\"
  resource_group_name  = local.rg_name
  virtual_network_name = azurerm_virtual_network.k3s_vnet.name
  address_prefixes     = [\"10.0.1.0/24\"]
}}

# NAT Gateway for private subnet outbound internet
resource \"azurerm_public_ip\" \"nat_public_ip\" {{
  name                = \"pip-nat-${{var.project_name}}\"
  location            = local.rg_location
  resource_group_name = local.rg_name
  allocation_method   = \"Static\"
  sku                 = \"Standard\"
}}

resource \"azurerm_nat_gateway\" \"nat\" {{
  name                = \"nat-${{var.project_name}}\"
  location            = local.rg_location
  resource_group_name = local.rg_name
  sku_name            = \"Standard\"
}}

resource \"azurerm_nat_gateway_public_ip_association\" \"nat_ip_assoc\" {{
  nat_gateway_id       = azurerm_nat_gateway.nat.id
  public_ip_address_id = azurerm_public_ip.nat_public_ip.id
}}

resource \"azurerm_subnet_nat_gateway_association\" \"private_nat_assoc\" {{
  subnet_id      = azurerm_subnet.private_subnet.id
  nat_gateway_id = azurerm_nat_gateway.nat.id
}}

# Edge NSG (SSH + HTTP/HTTPS)
resource \"azurerm_network_security_group\" \"edge_nsg\" {{
  name                = \"nsg-edge-${{var.project_name}}\"
  location            = local.rg_location
  resource_group_name = local.rg_name

  security_rule {{
    name                       = \"Allow-SSH\"
    priority                   = 100
    direction                  = \"Inbound\"
    access                     = \"Allow\"
    protocol                   = \"Tcp\"
    source_port_range          = \"*\"
    destination_port_range     = \"22\"
    source_address_prefix      = var.admin_cidr
    destination_address_prefix = \"*\"
  }}

  security_rule {{
    name                       = \"Allow-HTTP\"
    priority                   = 110
    direction                  = \"Inbound\"
    access                     = \"Allow\"
    protocol                   = \"Tcp\"
    source_port_range          = \"*\"
    destination_port_range     = \"80\"
    source_address_prefix      = \"*\"
    destination_address_prefix = \"*\"
  }}

  security_rule {{
    name                       = \"Allow-HTTPS\"
    priority                   = 120
    direction                  = \"Inbound\"
    access                     = \"Allow\"
    protocol                   = \"Tcp\"
    source_port_range          = \"*\"
    destination_port_range     = \"443\"
    source_address_prefix      = \"*\"
    destination_address_prefix = \"*\"
  }}
}}

# --------------
# Edge (shared across all clusters)
# --------------
resource \"azurerm_public_ip\" \"k3s_edge_public_ip\" {{
  name                = \"pip-edge-${{var.project_name}}\"
  location            = local.rg_location
  resource_group_name = local.rg_name
  allocation_method   = \"Static\"
  sku                 = \"Standard\"
}}

resource \"azurerm_network_interface\" \"k3s_edge_nic\" {{
  name                = \"nic-edge-${{var.project_name}}\"
  location            = local.rg_location
  resource_group_name = local.rg_name

  ip_configuration {{
    name                          = \"ipconfig\"
    subnet_id                     = azurerm_subnet.public_subnet.id
    private_ip_address_allocation = \"Dynamic\"
    public_ip_address_id          = azurerm_public_ip.k3s_edge_public_ip.id
  }}
}}

resource \"azurerm_network_interface_security_group_association\" \"edge_nic_nsg\" {{
  network_interface_id      = azurerm_network_interface.k3s_edge_nic.id
  network_security_group_id = azurerm_network_security_group.edge_nsg.id
}}

resource \"azurerm_linux_virtual_machine\" \"k3s_edge\" {{
  name                = \"k3s-edge-${{var.project_name}}\"
  resource_group_name = local.rg_name
  location            = local.rg_location
  size                = \"Standard_B1ms\"
  admin_username      = \"ubuntu\"

  network_interface_ids = [
    azurerm_network_interface.k3s_edge_nic.id
  ]

  admin_ssh_key {{
    username   = \"ubuntu\"
    public_key = \"__SSH_PUBLIC_KEY__\"
  }}

  os_disk {{
    caching              = \"ReadWrite\"
    storage_account_type = \"Standard_LRS\"
  }}

  source_image_reference {{
    publisher = \"Canonical\"
    offer     = \"0001-com-ubuntu-server-jammy\"
    sku       = \"22_04-lts\"
    version   = \"latest\"
  }}

  tags = {{
    Role      = \"edge\"
  }}
}}

# --------------
# Master per cluster (publicly accessible API)
# --------------
resource \"azurerm_network_security_group\" \"master_nsg\" {{
  name                = \"nsg-master-${{var.project_name}}\"
  location            = local.rg_location
  resource_group_name = local.rg_name

  security_rule {{
    name                       = \"Allow-SSH\"
    priority                   = 100
    direction                  = \"Inbound\"
    access                     = \"Allow\"
    protocol                   = \"Tcp\"
    source_port_range          = \"*\"
    destination_port_range     = \"22\"
    source_address_prefix      = var.admin_cidr
    destination_address_prefix = \"*\"
  }}

  security_rule {{
    name                       = \"Allow-K3s-API-Admin\"
    priority                   = 110
    direction                  = \"Inbound\"
    access                     = \"Allow\"
    protocol                   = \"Tcp\"
    source_port_range          = \"*\"
    destination_port_range     = \"6443\"
    source_address_prefix      = var.admin_cidr
    destination_address_prefix = \"*\"
  }}

  security_rule {{
    name                       = \"Allow-K3s-API-VNet\"
    priority                   = 120
    direction                  = \"Inbound\"
    access                     = \"Allow\"
    protocol                   = \"Tcp\"
    source_port_range          = \"*\"
    destination_port_range     = \"6443\"
    source_address_prefix      = \"VirtualNetwork\"
    destination_address_prefix = \"*\"
  }}
}}

resource \"azurerm_public_ip\" \"k3s_master_public_ip\" {{
  for_each            = local.master_map
  name                = \"pip-master-${{var.project_name}}-${{each.key}}\"
  location            = local.rg_location
  resource_group_name = local.rg_name
  allocation_method   = \"Static\"
  sku                 = \"Standard\"
}}

resource \"azurerm_network_interface\" \"k3s_master_nic\" {{
  for_each            = local.master_map
  name                = \"nic-master-${{var.project_name}}-${{each.key}}\"
  location            = local.rg_location
  resource_group_name = local.rg_name

  ip_configuration {{
    name                          = \"ipconfig\"
    subnet_id                     = azurerm_subnet.public_subnet.id
    private_ip_address_allocation = \"Dynamic\"
    public_ip_address_id          = azurerm_public_ip.k3s_master_public_ip[each.key].id
  }}
}}

resource \"azurerm_network_interface_security_group_association\" \"master_nic_nsg\" {{
  for_each                  = local.master_map
  network_interface_id      = azurerm_network_interface.k3s_master_nic[each.key].id
  network_security_group_id = azurerm_network_security_group.master_nsg.id
}}

resource \"azurerm_linux_virtual_machine\" \"k3s_master\" {{
  for_each            = local.master_map
  name                = \"k3s-master-${{var.project_name}}-${{each.key}}\"
  resource_group_name = local.rg_name
  location            = local.rg_location
  size                = each.value.node_size
  admin_username      = \"ubuntu\"

  network_interface_ids = [
    azurerm_network_interface.k3s_master_nic[each.key].id
  ]

  admin_ssh_key {{
    username   = \"ubuntu\"
    public_key = \"__SSH_PUBLIC_KEY__\"
  }}

  os_disk {{
    caching              = \"ReadWrite\"
    storage_account_type = \"Standard_LRS\"
  }}

  source_image_reference {{
    publisher = \"Canonical\"
    offer     = \"0001-com-ubuntu-server-jammy\"
    sku       = \"22_04-lts\"
    version   = \"latest\"
  }}

  tags = {{
    ClusterId = each.key
    Role      = \"master\"
  }}
}}

# --------------
# Workers (publicly accessible)
# --------------
resource \"azurerm_network_security_group\" \"k3s_workers_nsg\" {{
  name                = \"nsg-workers-${{var.project_name}}\"
  location            = local.rg_location
  resource_group_name = local.rg_name

  security_rule {{
    name                       = \"Allow-SSH\"
    priority                   = 100
    direction                  = \"Inbound\"
    access                     = \"Allow\"
    protocol                   = \"Tcp\"
    source_port_range          = \"*\"
    destination_port_range     = \"22\"
    source_address_prefix      = var.admin_cidr
    destination_address_prefix = \"*\"
  }}
}}

resource \"azurerm_public_ip\" \"k3s_worker_public_ip\" {{
  for_each            = local.worker_map
  name                = \"pip-worker-${{var.project_name}}-${{each.key}}\"
  location            = local.rg_location
  resource_group_name = local.rg_name
  allocation_method   = \"Static\"
  sku                 = \"Standard\"

  tags = {{
    ClusterId = each.value.cluster_id
    Role      = \"worker\"
  }}
}}

resource \"azurerm_network_interface\" \"k3s_worker_nic\" {{
  for_each            = local.worker_map
  name                = \"nic-worker-${{var.project_name}}-${{each.key}}\"
  location            = local.rg_location
  resource_group_name = local.rg_name

  ip_configuration {{
    name                          = \"ipconfig\"
    subnet_id                     = azurerm_subnet.private_subnet.id
    private_ip_address_allocation = \"Dynamic\"
    public_ip_address_id          = azurerm_public_ip.k3s_worker_public_ip[each.key].id
  }}
}}

resource \"azurerm_network_interface_security_group_association\" \"worker_nic_nsg\" {{
  for_each                  = local.worker_map
  network_interface_id      = azurerm_network_interface.k3s_worker_nic[each.key].id
  network_security_group_id = azurerm_network_security_group.k3s_workers_nsg.id
}}

resource \"azurerm_linux_virtual_machine\" \"k3s_worker\" {{
  for_each            = local.worker_map
  name                = \"k3s-worker-${{var.project_name}}-${{each.key}}\"
  resource_group_name = local.rg_name
  location            = local.rg_location
  size                = each.value.node_size
  admin_username      = \"ubuntu\"

  network_interface_ids = [
    azurerm_network_interface.k3s_worker_nic[each.key].id
  ]

  admin_ssh_key {{
    username   = \"ubuntu\"
    public_key = \"__SSH_PUBLIC_KEY__\"
  }}

  os_disk {{
    caching              = \"ReadWrite\"
    storage_account_type = \"Standard_LRS\"
  }}

  source_image_reference {{
    publisher = \"Canonical\"
    offer     = \"0001-com-ubuntu-server-jammy\"
    sku       = \"22_04-lts\"
    version   = \"latest\"
  }}

  tags = {{
    ClusterId = each.value.cluster_id
    Role      = \"worker\"
  }}
}}

output \"edge_public_ip\" {{
  value = azurerm_public_ip.k3s_edge_public_ip.ip_address
}}
"""

    main_tf_content = (
        main_tf_template.replace("{{", "{")
        .replace("}}", "}")
        .replace("__SSH_PUBLIC_KEY__", ssh_public_key)
    )

    with open(f"{terraform_dir}/main.tf", "w") as f:
        f.write(main_tf_content)

    variables_tf = f"""
variable \"subscription_id\" {{ type = string }}
variable \"client_id\" {{ type = string }}
variable \"client_secret\" {{ type = string }}
variable \"tenant_id\" {{ type = string }}

variable \"project_location\" {{
  type    = string
  default = \"{config_info['region']}\"
}}

variable \"project_name\" {{
  type    = string
  default = \"{project_name}\"
}}

variable \"admin_cidr\" {{
  type    = string
  default = \"{admin_cidr}\"
}}

variable \"k3s_clusters\" {{
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


def write_instance_info_to_db(terraform_dir, config_info, **context):
    if isinstance(config_info, str):
        config_info = ast.literal_eval(config_info)

    state_file = Path(terraform_dir) / "terraform.tfstate"
    if not state_file.exists():
        raise FileNotFoundError(f"Terraform state file not found at {state_file}")

    load_dotenv(expanduser("/opt/airflow/dags/.env"))

    connection = psycopg2.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
    )
    cursor = connection.cursor()

    with open(state_file, "r") as f:
        state = json.load(f)

    for cluster in config_info["k3s_clusters"]:
        cluster_id = cluster["id"]

        cursor.execute(
            'UPDATE "AzureK8sCluster" SET "terraformState" = %s WHERE "id" = %s;',
            (json.dumps(state), cluster_id),
        )
        connection.commit()
        print(f"✓ Stored terraformState for AzureK8sCluster id={cluster_id}")

    cursor.close()
    connection.close()

    return config_info["resourcesId"]


with DAG(
    "AZURE_terraform_k3s_provision",
    default_args=default_args,
    schedule_interval=None,
    catchup=False,
    description="Provision Azure K3s infrastructure (VMs only)",
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

    trigger_config = TriggerDagRunOperator(
        task_id="trigger_k3s_configuration",
        trigger_dag_id="AZURE_configure_k3s",
        conf={"resource_id": "{{ ti.xcom_pull(task_ids='write_instance_info_to_db') }}"},
        wait_for_completion=False,
    )

    fetch_task >> create_dir_task >> write_files_task >> terraform_init >> terraform_apply >> write_db_task >> trigger_config
