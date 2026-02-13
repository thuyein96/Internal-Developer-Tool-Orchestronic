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
# Dynamic Path Configuration
# --------------------------------------------------
DAG_FOLDER = os.path.dirname(os.path.abspath(__file__))
ANSIBLE_BASE = os.path.join(DAG_FOLDER, "ansible")
SSH_KEY_PATH = os.path.join(DAG_FOLDER, ".ssh/id_rsa")
ENV_PATH = os.path.join(DAG_FOLDER, ".env")

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

    # Get resource config ID
    cur.execute('SELECT "resourceConfigId" FROM "Resources" WHERE id = %s;', (resource_id,))
    res = cur.fetchone()
    if not res: raise ValueError("Resource not found")
    resource_config_id = res[0]

    # Get all clusters associated with this config
    cur.execute(
        '''SELECT "id", "clusterName", "clusterEndpoint", "terraformState"
           FROM "AwsK8sCluster" WHERE "resourceConfigId" = %s;''',
        (resource_config_id,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows: raise ValueError("No clusters found")

    clusters_data = []

    for cid, name, endpoint, tf_state in rows:
        # Parse JSON
        endpoint = endpoint if isinstance(endpoint, dict) else (json.loads(endpoint) if endpoint else {})
        tf_state = tf_state if isinstance(tf_state, dict) else (json.loads(tf_state) if tf_state else {})

        workers = []
        edge = None

        # Extract resources from Terraform State
        for r in tf_state.get("resources", []):
            if r.get("type") == "aws_instance":
                # Find Edge Node for THIS specific cluster
                if r.get("name") == "k3s_edge":
                    for i in r.get("instances", []):
                        index_key = i.get("index_key")
                        attrs = i.get("attributes", {})
                        tags = attrs.get("tags", {}) or {}

                        if index_key is not None and str(index_key) == str(cid):
                            edge = attrs
                            break

                        if str(tags.get("ClusterId", "")) == str(cid):
                            edge = attrs
                            break

                    # Backward-compatible fallback (older state had a single shared edge)
                    if edge is None and r.get("instances"):
                        edge = r["instances"][0].get("attributes")
                
                # Find Workers belonging to THIS specific cluster (using Tag filtering)
                if r.get("name") == "k3s_worker":
                    for i in r.get("instances", []):
                        # Only add worker if it belongs to this cluster ID
                        if i["attributes"]["tags"].get("ClusterId") == str(cid):
                            workers.append(i["attributes"])

        clusters_data.append({
            "cluster_id": cid,
            "cluster_name": name,
            "master": endpoint,
            "workers": workers,
            "edge": edge,
        })

    return clusters_data

# --------------------------------------------------
# Step 2: Configure Clusters (Looping Logic)
# --------------------------------------------------
def configure_clusters(**context):
    clusters = context["ti"].xcom_pull(task_ids="fetch_cluster_info")
    
    # Iterate over every cluster and run Ansible sequentially
    for cluster in clusters:
        print(f"--- Configuring Cluster: {cluster['cluster_name']} ---")
        
        # 1. Generate Unique Inventory for this Cluster
        safe_name = cluster['cluster_name'].replace(" ", "-").lower()
        inventory_path = f"/tmp/hosts_{safe_name}.ini"
        
        edge_public_ip = cluster['edge']['public_ip'] if cluster.get('edge') else None
        proxyjump_arg = (
            f"-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "
            f"-o ProxyCommand=\"ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i {SSH_KEY_PATH} -W %h:%p ubuntu@{edge_public_ip}\""
            if edge_public_ip
            else "-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
        )

        master_public_ip = None
        if isinstance(cluster.get('master'), dict):
            master_public_ip = cluster['master'].get('public_ip')

        lines = ["[k3s_master]"]
        lines.append(
            f"master ansible_host={cluster['master']['private_ip']} ansible_user=ubuntu "
            f"ansible_ssh_private_key_file={SSH_KEY_PATH} ansible_ssh_common_args='{proxyjump_arg}' "
            f"k3s_tls_san={master_public_ip or cluster['master']['private_ip']} "
            f"k3s_kubeconfig_server={master_public_ip or cluster['master']['private_ip']}"
        )
        
        lines.append("\n[k3s_workers]")
        for idx, w in enumerate(cluster['workers']):
            lines.append(
                f"worker{idx+1} ansible_host={w['private_ip']} private_ip={w['private_ip']} ansible_user=ubuntu "
                f"ansible_ssh_private_key_file={SSH_KEY_PATH} ansible_ssh_common_args='{proxyjump_arg}'"
            )
        
        lines.append("\n[edge]")
        if cluster['edge']:
            lines.append(f"edge01 ansible_host={cluster['edge']['public_ip']} ansible_user=ubuntu ansible_ssh_private_key_file={SSH_KEY_PATH}")

        # --- IMPORTANT: Variables for Dynamic Routing ---
        lines.append("\n[all:vars]")
        lines.append(f"cluster_name={safe_name}")
        lines.append(f"cluster_domain={safe_name}.orchestronic.dev") # <--- Generates unique domain
        
        with open(inventory_path, "w") as f:
            f.write("\n".join(lines))
        
        print(f"Generated inventory: {inventory_path}")
        print("Inventory content:\n" + "\n".join(lines))

        # 2. Run Ansible Playbooks using Subprocess
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
# Step 3: Fetch Kubeconfigs (Looping Logic)
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
        edge_public_ip = cluster["edge"]["public_ip"] if cluster.get("edge") else None
        master_ip = cluster["master"]["private_ip"]
        cluster_id = cluster["cluster_id"]
        safe_name = cluster['cluster_name'].replace(" ", "-").lower()
        temp_kube_path = f"/tmp/kubeconfig_{safe_name}"

        if not edge_public_ip:
            print(f"No edge node found for {cluster['cluster_name']}; cannot fetch kubeconfig from private master")
            continue

        proxy_cmd = (
            f"ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i {SSH_KEY_PATH} "
            f"-W %h:%p ubuntu@{edge_public_ip}"
        )
        cmd = (
            f"ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i {SSH_KEY_PATH} "
            f"-o ProxyCommand=\"{proxy_cmd}\" "
            f"ubuntu@{master_ip} 'cat /home/ubuntu/.kube/config' > {temp_kube_path}"
        )
        
        if os.system(cmd) != 0:
            print(f"Failed to fetch kubeconfig for {cluster['cluster_name']}")
            continue

        with open(temp_kube_path) as f:
            kubeconfig = f.read()

        if kubeconfig.strip():
            cur.execute(
                'UPDATE "AwsK8sCluster" SET "kubeConfig" = %s WHERE id = %s;',
                (kubeconfig, cluster_id),
            )
            conn.commit()
            print(f"Updated DB for {cluster['cluster_name']}")
            
        if os.path.exists(temp_kube_path):
            os.remove(temp_kube_path)

    cur.close()
    conn.close()

# --------------------------------------------------
# DAG Definition
# --------------------------------------------------
with DAG(
    dag_id="AWS_configure_k3s",
    default_args=default_args,
    schedule_interval=None,
    catchup=False,
    description="Configure K3s clusters dynamically",
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