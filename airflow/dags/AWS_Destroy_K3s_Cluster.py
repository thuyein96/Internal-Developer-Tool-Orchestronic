import os
import json
import ast
import shutil
import psycopg2
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.operators.empty import EmptyOperator
from dotenv import load_dotenv
from os.path import expanduser

# -------------------------
# Default DAG args
# -------------------------
default_args = {
    "owner": "admin",
    "depends_on_past": False,
    "start_date": datetime(2025, 1, 1),
    "retries": 1,
    "retry_delay": timedelta(minutes=3),
}

ENV_PATH = expanduser("/opt/airflow/dags/.env")


# -------------------------
# DB Connection Helper
# -------------------------
def get_db_connection():
    load_dotenv(ENV_PATH)
    return psycopg2.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
    )


# -------------------------
# Step 1: Get resource_id from dag_run conf
# -------------------------
def get_resource_id(**context):
    resource_id = context["dag_run"].conf.get("resource_id")
    if not resource_id:
        raise ValueError("resource_id missing from dag_run conf")
    print(f"[x] Destroying resources for resource_id: {resource_id}")
    return resource_id


# -------------------------
# Step 2: Fetch destroy configuration from DB
# -------------------------
def fetch_destroy_config(**context):
    resource_id = context["ti"].xcom_pull(task_ids="get_resource_id")
    if not resource_id:
        raise ValueError("No resource_id available")

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Get resource info
        cur.execute(
            'SELECT "name", "region", "resourceConfigId" FROM "Resources" WHERE id = %s;',
            (resource_id,),
        )
        res = cur.fetchone()
        if not res:
            raise ValueError(f"No resource found for resource_id={resource_id}")
        repo_name, region, resource_config_id = res

        # Get K3s cluster info (includes terraform state for destroy)
        cur.execute(
            '''SELECT "id", "clusterName", "nodeCount", "nodeSize", "terraformState"
               FROM "AwsK8sCluster" WHERE "resourceConfigId" = %s;''',
            (resource_config_id,),
        )
        rows = cur.fetchall()

        clusters = []
        k3s_terraform_state = None
        for cid, cname, node_count, node_size, tf_state in rows:
            clusters.append(
                {
                    "id": str(cid),
                    "cluster_name": cname,
                    "node_count": int(node_count),
                    "node_size": node_size,
                }
            )
            # All clusters share the same terraform state (stored per-cluster but identical)
            if k3s_terraform_state is None and tf_state:
                k3s_terraform_state = (
                    tf_state if isinstance(tf_state, dict) else json.loads(tf_state)
                )

        return {
            "resource_id": resource_id,
            "repo_name": repo_name,
            "region": region,
            "resource_config_id": str(resource_config_id),
            "project_name": f"{repo_name}-{str(resource_id)[:4]}",
            "k3s_clusters": clusters,
            "k3s_terraform_state": k3s_terraform_state,
        }
    finally:
        cur.close()
        conn.close()


# -------------------------
# Step 3a: Prepare K3s Terraform files for destroy
# Matches path from AWS_provide_k3s: /opt/airflow/dags/terraform/{repoName}/k3s
# -------------------------
def prepare_k3s_terraform(config):
    if isinstance(config, str):
        try:
            config = json.loads(config)
        except Exception:
            config = ast.literal_eval(config)

    repo_name = config["repo_name"]
    terraform_dir = f"/opt/airflow/dags/terraform/{repo_name}/k3s"
    os.makedirs(terraform_dir, exist_ok=True)

    # Re-generate terraform files so destroy has the correct .tf definitions
    from AWS_provide_k3s import write_terraform_files  # type: ignore

    config_info = {
        "resourcesId": config["resource_id"],
        "repoName": repo_name,
        "region": config["region"],
        "k3s_clusters": config["k3s_clusters"],
    }
    write_terraform_files(terraform_dir, config_info)

    # Restore terraform.tfstate from DB so destroy works even if directory was wiped
    state = config.get("k3s_terraform_state")
    if not state:
        raise ValueError(
            "Missing k3s terraformState in DB; cannot safely destroy compute resources."
        )

    state_path = os.path.join(terraform_dir, "terraform.tfstate")
    with open(state_path, "w") as f:
        json.dump(state, f)

    print(f"[x] Prepared K3s terraform dir: {terraform_dir}")
    return terraform_dir


# -------------------------
# Step 3b: Prepare RG (VPC/Network) Terraform files for destroy
# Matches path from AWS_Resources_Cluster: /opt/airflow/dags/terraform/{repoName}/aws/rg
# -------------------------
def prepare_rg_terraform(config):
    if isinstance(config, str):
        try:
            config = json.loads(config)
        except Exception:
            config = ast.literal_eval(config)

    repo_name = config["repo_name"]
    terraform_dir = f"/opt/airflow/dags/terraform/{repo_name}/aws/rg"
    os.makedirs(terraform_dir, exist_ok=True)

    # Re-generate terraform files matching AWS_Resources_Cluster
    from AWS_Resources_Cluster import write_terraform_files as write_rg_files  # type: ignore

    config_info = json.dumps(
        {
            "resourceId": config["resource_id"],
            "repoName": repo_name,
            "region": config["region"],
            "cloudProvider": "aws",
            "k8sCount": len(config.get("k3s_clusters", [])),
        }
    )
    write_rg_files(terraform_dir, config_info)

    # RG state is stored on disk (not in DB). If missing, we cannot destroy safely.
    state_path = os.path.join(terraform_dir, "terraform.tfstate")
    if not os.path.exists(state_path):
        raise FileNotFoundError(
            f"Missing {state_path}. Cannot destroy VPC/network without Terraform state."
        )

    print(f"[x] Prepared RG terraform dir: {terraform_dir}")
    return terraform_dir


# -------------------------
# Step 6: Cleanup terraform directories
# -------------------------
def cleanup_directories(config):
    if isinstance(config, str):
        try:
            config = json.loads(config)
        except Exception:
            config = ast.literal_eval(config)

    repo_name = config.get("repo_name")
    if not repo_name:
        raise ValueError("Missing repo_name for cleanup")

    base_path = f"/opt/airflow/dags/terraform/{repo_name}"
    k3s_path = os.path.join(base_path, "k3s")
    rg_path = os.path.join(base_path, "aws", "rg")

    for path in [k3s_path, rg_path]:
        if os.path.exists(path):
            shutil.rmtree(path)
            print(f"[x] Removed directory: {path}")

    # Clean up empty parent directories
    aws_path = os.path.join(base_path, "aws")
    if os.path.exists(aws_path) and not os.listdir(aws_path):
        os.rmdir(aws_path)
        print(f"[x] Removed empty directory: {aws_path}")

    if os.path.exists(base_path) and not os.listdir(base_path):
        os.rmdir(base_path)
        print(f"[x] Removed empty directory: {base_path}")

    return repo_name


# -------------------------
# Step 7: Delete database records
# -------------------------
def delete_db_records(**context):
    resource_id = context["ti"].xcom_pull(task_ids="get_resource_id")
    if not resource_id:
        raise ValueError("No resource_id available for DB cleanup")

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Get resourceConfigId before deleting
        cur.execute(
            'SELECT "resourceConfigId" FROM "Resources" WHERE id = %s;',
            (resource_id,),
        )
        res = cur.fetchone()
        resource_config_id = res[0] if res else None

        if resource_config_id:
            # Get all cluster IDs for this config
            cur.execute(
                'SELECT "id" FROM "AwsK8sCluster" WHERE "resourceConfigId" = %s;',
                (resource_config_id,),
            )
            cluster_ids = [row[0] for row in cur.fetchall()]

            # Delete child records that reference clusters
            for cluster_id in cluster_ids:
                cur.execute(
                    'DELETE FROM "K8sService" WHERE "awsClusterId" = %s;',
                    (cluster_id,),
                )
                cur.execute(
                    'DELETE FROM "K8sDeployment" WHERE "awsClusterId" = %s;',
                    (cluster_id,),
                )
                cur.execute(
                    'DELETE FROM "ImageDeployment" WHERE "AwsK8sClusterId" = %s;',
                    (cluster_id,),
                )
                print(f"[x] Deleted child records for cluster {cluster_id}")

            # Delete K3s cluster records
            cur.execute(
                'DELETE FROM "AwsK8sCluster" WHERE "resourceConfigId" = %s;',
                (resource_config_id,),
            )
            print(f"[x] Deleted AwsK8sCluster records for config {resource_config_id}")

        # Delete the Resource record
        cur.execute('DELETE FROM "Resources" WHERE id = %s;', (resource_id,))
        print(f"[x] Deleted Resources record {resource_id}")

        # Delete the ResourceConfig (root)
        if resource_config_id:
            cur.execute(
                'DELETE FROM "ResourceConfig" WHERE id = %s;',
                (resource_config_id,),
            )
            print(f"[x] Deleted ResourceConfig {resource_config_id}")

        conn.commit()
        print("[x] All database records cleaned up successfully")
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


# -------------------------
# DAG Definition
# -------------------------
with DAG(
    dag_id="AWS_Destroy_K3s_Cluster",
    default_args=default_args,
    schedule=None,
    catchup=False,
    max_active_runs=1,
    description="Destroy K3s cluster infrastructure and clean up database records",
) as dag:

    # 1. Get resource_id
    get_id = PythonOperator(
        task_id="get_resource_id",
        python_callable=get_resource_id,
    )

    # 2. Fetch full config from DB
    fetch_config = PythonOperator(
        task_id="fetch_destroy_config",
        python_callable=fetch_destroy_config,
    )

    # 3. Prepare K3s terraform files (restore state + .tf files)
    prep_k3s = PythonOperator(
        task_id="prepare_k3s_terraform",
        python_callable=prepare_k3s_terraform,
        op_args=["{{ ti.xcom_pull(task_ids='fetch_destroy_config') | tojson }}"],
    )

    # 4. Destroy compute layer (K3s VMs, SGs, IAM, KeyPairs)
    destroy_k3s = BashOperator(
        task_id="terraform_destroy_k3s",
        bash_command=(
            'TF_DIR="{{ ti.xcom_pull(task_ids=\'prepare_k3s_terraform\') }}"; '
            'echo "Destroying K3s compute in: $TF_DIR"; '
            "cd \"$TF_DIR\" && terraform init -input=false && "
            "terraform destroy -auto-approve -input=false"
        ),
        retries=3,
        retry_delay=timedelta(minutes=1),
    )

    # 5. Prepare RG terraform files
    prep_rg = PythonOperator(
        task_id="prepare_rg_terraform",
        python_callable=prepare_rg_terraform,
        op_args=["{{ ti.xcom_pull(task_ids='fetch_destroy_config') | tojson }}"],
    )

    # 6. Destroy network layer (VPC, Subnets, IGW, NAT)
    destroy_rg = BashOperator(
        task_id="terraform_destroy_rg",
        bash_command=(
            'TF_DIR="{{ ti.xcom_pull(task_ids=\'prepare_rg_terraform\') }}"; '
            'echo "Destroying VPC/network in: $TF_DIR"; '
            "cd \"$TF_DIR\" && terraform init -input=false && "
            "terraform destroy -auto-approve -input=false"
        ),
        retries=3,
        retry_delay=timedelta(minutes=1),
    )

    # 7. Cleanup terraform directories
    cleanup = PythonOperator(
        task_id="cleanup_directories",
        python_callable=cleanup_directories,
        op_args=["{{ ti.xcom_pull(task_ids='fetch_destroy_config') | tojson }}"],
        trigger_rule="all_done",
    )

    # 8. Delete database records
    delete_db = PythonOperator(
        task_id="delete_db_records",
        python_callable=delete_db_records,
    )

    end = EmptyOperator(task_id="end")

    # Workflow: Compute destroy must complete before network destroy
    get_id >> fetch_config >> prep_k3s >> destroy_k3s >> prep_rg >> destroy_rg >> cleanup >> delete_db >> end
