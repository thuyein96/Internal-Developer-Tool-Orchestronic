import os
import json
import psycopg2
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from dotenv import load_dotenv

from airflow import DAG
from airflow.operators.python import PythonOperator

# --------------------------------------------------
# Default DAG args
# --------------------------------------------------
default_args = {
    "owner": "admin",
    "depends_on_past": False,
    "start_date": datetime(2025, 1, 1),
    "retries": 1,
    "retry_delay": timedelta(minutes=3),
}

# --------------------------------------------------
# Path Configuration (Airflow container paths)
# --------------------------------------------------
DAG_FOLDER = os.path.dirname(os.path.abspath(__file__))
ANSIBLE_BASE = os.path.join(DAG_FOLDER, "ansible")
SSH_KEY_PATH = os.path.join(DAG_FOLDER, ".ssh", "id_rsa")
ENV_PATH = os.path.join(DAG_FOLDER, ".env")
SSH_USER = "ubuntu"


def _parse_terraform_state_for_cluster(tf_state: dict, cluster_id: str):
    if not isinstance(tf_state, dict):
        return None

    nic_private_ip_by_id: dict[str, str] = {}
    edge_public_ip_by_cluster_id: dict[str, str] = {}
    shared_edge_public_ip = None
    master_public_ip_by_cluster_id: dict[str, str] = {}

    masters: dict[str, dict] = {}
    workers_by_cluster: dict[str, list[dict]] = {}

    for resource in tf_state.get("resources", []):
        r_type = resource.get("type")
        r_name = resource.get("name")

        if r_type == "azurerm_network_interface":
            for inst in resource.get("instances", []) or []:
                attrs = inst.get("attributes", {}) or {}
                nic_id = attrs.get("id")
                private_ip = attrs.get("private_ip_address")
                if nic_id and private_ip:
                    nic_private_ip_by_id[nic_id] = private_ip

        if r_type == "azurerm_public_ip" and r_name == "k3s_edge_public_ip":
            for inst in resource.get("instances", []) or []:
                idx = inst.get("index_key")
                attrs = inst.get("attributes", {}) or {}
                ip = attrs.get("ip_address")
                if ip and shared_edge_public_ip is None:
                    # When edge is shared (no for_each), there is no index_key.
                    shared_edge_public_ip = ip
                if idx and ip:
                    edge_public_ip_by_cluster_id[str(idx)] = ip

        if r_type == "azurerm_public_ip" and r_name == "k3s_master_public_ip":
            for inst in resource.get("instances", []) or []:
                idx = inst.get("index_key")
                attrs = inst.get("attributes", {}) or {}
                ip = attrs.get("ip_address")
                if idx and ip:
                    master_public_ip_by_cluster_id[str(idx)] = ip

        if r_type == "azurerm_linux_virtual_machine" and r_name == "k3s_master":
            for inst in resource.get("instances", []) or []:
                idx = inst.get("index_key")
                attrs = inst.get("attributes", {}) or {}
                if not idx:
                    continue
                nic_ids = attrs.get("network_interface_ids") or []
                nic_id = nic_ids[0] if nic_ids else None
                private_ip = nic_private_ip_by_id.get(nic_id) if nic_id else None
                if private_ip:
                    masters[str(idx)] = {"private_ip": private_ip}

        if r_type == "azurerm_linux_virtual_machine" and r_name == "k3s_worker":
            for inst in resource.get("instances", []) or []:
                attrs = inst.get("attributes", {}) or {}
                tags = attrs.get("tags", {}) or {}
                c_id = str(tags.get("ClusterId")) if tags.get("ClusterId") is not None else None
                if not c_id:
                    continue
                nic_ids = attrs.get("network_interface_ids") or []
                nic_id = nic_ids[0] if nic_ids else None
                private_ip = nic_private_ip_by_id.get(nic_id) if nic_id else None
                if not private_ip:
                    continue
                workers_by_cluster.setdefault(c_id, []).append({"private_ip": private_ip})

    edge_ip = edge_public_ip_by_cluster_id.get(str(cluster_id)) or shared_edge_public_ip
    master_public_ip = master_public_ip_by_cluster_id.get(str(cluster_id))
    master = masters.get(str(cluster_id))
    workers = workers_by_cluster.get(str(cluster_id), [])

    return {
        "edge_public_ip": edge_ip,
        "master_public_ip": master_public_ip,
        "master": master,
        "workers": workers,
    }


# --------------------------------------------------
# Step 1: Fetch cluster info from DB
# --------------------------------------------------
def fetch_cluster_info(**context):
    resource_id = context["dag_run"].conf.get("resource_id")
    if not resource_id:
        raise ValueError("resource_id missing")

    load_dotenv(ENV_PATH)

    conn = psycopg2.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
    )
    cur = conn.cursor()

    cur.execute('SELECT "resourceConfigId" FROM "Resources" WHERE id = %s;', (resource_id,))
    res = cur.fetchone()
    if not res:
        raise ValueError("Resource not found")
    resource_config_id = res[0]

    cur.execute(
        'SELECT "id", "clusterName", "terraformState" '
        'FROM "AzureK8sCluster" WHERE "resourceConfigId" = %s;',
        (resource_config_id,),
    )
    rows = cur.fetchall()

    cur.close()
    conn.close()

    if not rows:
        raise ValueError("No clusters found")

    clusters_data = []

    for cid, name, tf_state in rows:
        tf_state = tf_state if isinstance(tf_state, dict) else (json.loads(tf_state) if tf_state else {})

        parsed = _parse_terraform_state_for_cluster(tf_state, str(cid))
        if not parsed or not parsed.get("master"):
            raise ValueError(f"Could not locate master private IP in terraformState for cluster {cid}")

        clusters_data.append(
            {
                "cluster_id": str(cid),
                "cluster_name": name,
                "terraform_state": tf_state,
                "master": parsed["master"],
                "workers": parsed["workers"],
                "edge_public_ip": parsed["edge_public_ip"],
                "master_public_ip": parsed.get("master_public_ip"),
            }
        )

    return clusters_data


# --------------------------------------------------
# Step 2: Configure Clusters
# --------------------------------------------------
def configure_clusters(**context):
    clusters = context["ti"].xcom_pull(task_ids="fetch_cluster_info")

    for cluster in clusters:
        print(f"--- Configuring Cluster: {cluster['cluster_name']} ---")

        safe_name = str(cluster["cluster_name"]).replace(" ", "-").lower()
        inventory_path = f"/tmp/hosts_{safe_name}.ini"

        edge_public_ip = cluster.get("edge_public_ip")
        proxyjump_arg = (
            f"-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "
            f"-o ProxyCommand=\"ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i {SSH_KEY_PATH} -W %h:%p {SSH_USER}@{edge_public_ip}\""
            if edge_public_ip
            else "-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
        )

        master_private_ip = cluster["master"]["private_ip"]
        master_public_ip = cluster.get("master_public_ip")
        kube_endpoint = master_public_ip or master_private_ip

        lines = ["[k3s_master]"]
        lines.append(
            f"master ansible_host={master_private_ip} ansible_user={SSH_USER} "
            f"ansible_ssh_private_key_file={SSH_KEY_PATH} ansible_ssh_common_args='{proxyjump_arg}' "
            f"k3s_tls_san={kube_endpoint} "
            f"k3s_kubeconfig_server={kube_endpoint}"
        )

        lines.append("\n[k3s_workers]")
        for idx, w in enumerate(cluster.get("workers") or []):
            lines.append(
                f"worker{idx+1} ansible_host={w['private_ip']} private_ip={w['private_ip']} ansible_user={SSH_USER} "
                f"ansible_ssh_private_key_file={SSH_KEY_PATH} ansible_ssh_common_args='{proxyjump_arg}'"
            )

        lines.append("\n[edge]")
        if edge_public_ip:
            lines.append(
                f"edge01 ansible_host={edge_public_ip} ansible_user={SSH_USER} ansible_ssh_private_key_file={SSH_KEY_PATH}"
            )

        lines.append("\n[all:vars]")
        lines.append(f"cluster_name={safe_name}")
        lines.append(f"cluster_domain={safe_name}.orchestronic.dev")

        with open(inventory_path, "w") as f:
            f.write("\n".join(lines))

        print(f"Generated inventory: {inventory_path}")

        env = os.environ.copy()
        env["ANSIBLE_HOST_KEY_CHECKING"] = "False"
        env["ANSIBLE_ROLES_PATH"] = os.path.join(ANSIBLE_BASE, "roles")
        env["ANSIBLE_PRIVATE_KEY_FILE"] = SSH_KEY_PATH

        playbooks = ["master.yml", "worker.yml", "edge.yml"]

        for pb in playbooks:
            pb_path = os.path.join(ANSIBLE_BASE, "playbooks", pb)
            cmd = ["ansible-playbook", "-vvv", "-i", inventory_path, pb_path]

            print(f"Running playbook: {pb} for {cluster['cluster_name']}")
            result = subprocess.run(cmd, env=env, cwd=ANSIBLE_BASE, capture_output=True, text=True)

            if result.returncode != 0:
                print(f"ERROR in {pb}")
                print(f"Return code: {result.returncode}")
                print(f"Command: {' '.join(cmd)}")
                if result.stdout:
                    print(f"STDOUT:\n{result.stdout}")
                if result.stderr:
                    print(f"STDERR:\n{result.stderr}")
                raise RuntimeError(f"Ansible failed for {cluster['cluster_name']}")
            else:
                print(f"SUCCESS: {pb}")

    print("All clusters configured successfully.")


# --------------------------------------------------
# Step 3: Fetch Kubeconfigs
# --------------------------------------------------
def fetch_kubeconfigs(**context):
    clusters = context["ti"].xcom_pull(task_ids="fetch_cluster_info")
    load_dotenv(ENV_PATH)

    conn = psycopg2.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
    )
    cur = conn.cursor()

    for cluster in clusters:
        edge_public_ip = cluster.get("edge_public_ip")
        master_ip = cluster["master"]["private_ip"]
        cluster_id = cluster["cluster_id"]
        safe_name = str(cluster["cluster_name"]).replace(" ", "-").lower()
        temp_kube_path = f"/tmp/kubeconfig_{safe_name}"

        if not edge_public_ip:
            print(
                f"No edge node found for {cluster['cluster_name']}; cannot fetch kubeconfig from private master"
            )
            continue

        proxy_cmd = (
            f"ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i {SSH_KEY_PATH} "
            f"-W %h:%p {SSH_USER}@{edge_public_ip}"
        )
        cmd = (
            f"ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i {SSH_KEY_PATH} "
            f"-o ProxyCommand=\"{proxy_cmd}\" "
            f"{SSH_USER}@{master_ip} 'cat /home/ubuntu/.kube/config' > {temp_kube_path}"
        )

        if os.system(cmd) != 0:
            print(f"Failed to fetch kubeconfig for {cluster['cluster_name']}")
            continue

        with open(temp_kube_path) as f:
            kubeconfig = f.read()

        if kubeconfig.strip():
            cur.execute(
                'UPDATE "AzureK8sCluster" SET "kubeConfig" = %s WHERE id = %s;',
                (kubeconfig, cluster_id),
            )
            conn.commit()
            print(f"Updated DB for {cluster['cluster_name']}")

        if os.path.exists(temp_kube_path):
            os.remove(temp_kube_path)

    cur.close()
    conn.close()


with DAG(
    dag_id="AZURE_configure_k3s",
    default_args=default_args,
    schedule_interval=None,
    catchup=False,
    description="Configure K3s clusters on Azure dynamically",
) as dag:

    fetch_info = PythonOperator(
        task_id="fetch_cluster_info",
        python_callable=fetch_cluster_info,
    )

    configure_all = PythonOperator(
        task_id="configure_clusters",
        python_callable=configure_clusters,
    )

    store_configs = PythonOperator(
        task_id="store_kubeconfigs",
        python_callable=fetch_kubeconfigs,
    )

    fetch_info >> configure_all >> store_configs
