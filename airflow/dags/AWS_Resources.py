import os
import json
import ast
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

    method_frame, header_frame, body = channel.basic_get(queue='request', auto_ack=True)
    if method_frame:
        message = body.decode()
        obj = json.loads(message)
        request_id = obj["data"]["requestId"]
        print(f"[x] Got message: {request_id}")
        connection.close()
        return request_id
    else:
        print("[x] No message in queue")
        connection.close()
        return None


# -------------------------
# Step 2: Fetch from Database
# -------------------------
def fetch_from_database(request_id):
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

    connection = psycopg2.connect(
        user=USER,
        password=PASSWORD,
        host=HOST,
        port=PORT,
        dbname=DBNAME
    )
    cursor = connection.cursor()

    # Get resourcesId from Request
    cursor.execute('SELECT "resourcesId", "repositoryId" FROM "Request" WHERE id = %s;', (request_id,))
    res = cursor.fetchone()
    if not res:
        raise ValueError(f"No request found for id={request_id}")
    resourcesId, repositoryId = res

    # Get resource data
    cursor.execute(
        '''SELECT "region", "cloudProvider", "resourceConfigId"
           FROM "Resources"
           WHERE id = %s;''',
        (resourcesId,)
    )
    resource = cursor.fetchone()
    if not resource:
        raise ValueError(f"No resource found for resourcesId={resourcesId}")

    region, cloudProvider, resourceConfigId = resource

    # ProjectName
    cursor.execute(
        'SELECT "name" FROM "Repository" WHERE id = %s;',
        (repositoryId,)
    )
    row = cursor.fetchone()
    if not row:
        raise ValueError(f"No repository found for id={repositoryId}")
    projectName = row[0]

    # Count VM OR DB OR ST instances
    cursor.execute(
        '''SELECT id FROM "AwsVMInstance" WHERE "resourceConfigId" = %s;''',
        (resourceConfigId,)
    )
    vm_instances = cursor.fetchall()
    vm_count = len(vm_instances)

    cursor.execute(
        '''SELECT id FROM "AwsDatabaseInstance" WHERE "resourceConfigId" = %s;''',
        (resourceConfigId,)
    )
    db_instances = cursor.fetchall()
    db_count = len(db_instances)

    cursor.execute(
        '''SELECT id FROM "AwsStorageInstance" WHERE "resourceConfigId" = %s;''',
        (resourceConfigId,)
    )
    st_instances = cursor.fetchall()
    st_count = len(st_instances)

    cursor.close()
    connection.close()

    configInfo = {
        "resourcesId": resourcesId,
        "projectName": projectName,
        "region": region,
        "cloudProvider": cloudProvider,
        "vmCount": vm_count,
        "dbCount": db_count,
        "stCount": st_count
    }

    return json.dumps(configInfo)

# -------------------------
# Step 3: Create terraform dir
# -------------------------
def create_terraform_directory(configInfo):
    config_dict = json.loads(configInfo)
    projectName = config_dict['projectName']
    terraform_dir = f"/opt/airflow/dags/terraform/{projectName}"
    os.makedirs(terraform_dir, exist_ok=True)
    print(f"[x] Created directory {terraform_dir}")
    return terraform_dir

# -------------------------
# Step 4: Trigger VM or ST or DB
# -------------------------
def branch_resources(configInfo):
    data = json.loads(configInfo)
    branches = []
    if data['vmCount'] > 0:
        branches.append('trigger_vm')
    if data['dbCount'] > 0:
        branches.append('trigger_db')
    if data['stCount'] > 0:
        branches.append('trigger_st')
    if not branches:
        return 'end'
    return branches
# -------------------------
# Airflow DAG
# -------------------------
with DAG(
    dag_id="AWS_Resources",
    default_args=default_args,
    description="Provision Azure Resource Group",
    schedule_interval=None,
    start_date=datetime(2025, 9, 2),
    catchup=False,
) as dag:
    
     # Step 1: RabbitMQ
    get_request_id = PythonOperator(
        task_id="get_request_id",
        python_callable=rabbitmq_consumer,
    )

    # Step 2: DB
    get_config_info = PythonOperator(
        task_id="get_config_info",
        python_callable=lambda ti: fetch_from_database(ti.xcom_pull(task_ids="get_request_id")),
    )

    # Step 3: Dir
    create_tf_dir = PythonOperator(
        task_id="create_tf_dir",
        python_callable=lambda ti: create_terraform_directory(ti.xcom_pull(task_ids="get_config_info")),
    )

    branch_task = BranchPythonOperator(
        task_id='branch_resources',
        python_callable=lambda ti: branch_resources(ti.xcom_pull(task_ids='get_config_info'))
    )

    # Trigger VM DAG
    trigger_vm = TriggerDagRunOperator(
        task_id="trigger_vm",
        trigger_dag_id="AWS_terraform_vm_provision",
        conf={"request_id": "{{ ti.xcom_pull(task_ids='get_request_id') }}"},
        wait_for_completion=False,
        trigger_rule='all_success',
    )

    # Trigger DB DAG
    trigger_db = TriggerDagRunOperator(
        task_id="trigger_db",
        trigger_dag_id="AWS_terraform_db_provision",
        conf={"request_id": "{{ ti.xcom_pull(task_ids='get_request_id') }}"},
        wait_for_completion=False,
        trigger_rule='all_success',
    )

    # Trigger ST DAG
    trigger_st = TriggerDagRunOperator(
        task_id="trigger_st",
        trigger_dag_id="AWS_terraform_st_provision",
        conf={"request_id": "{{ ti.xcom_pull(task_ids='get_request_id') }}"},
        wait_for_completion=False,
        trigger_rule='all_success',
    )

    end = EmptyOperator(task_id="end", trigger_rule="none_failed_min_one_success")

    # Workflow
    # get_request_id >> get_config_info >> create_tf_dir >> [check_vm, check_db, check_st]
    # check_vm >> trigger_vm
    # check_db >> trigger_db
    # check_st >> trigger_st
    # [trigger_vm, trigger_db, trigger_st] >> end

    get_request_id >> get_config_info >> create_tf_dir >> branch_task >> [trigger_vm, trigger_db, trigger_st] >> end
