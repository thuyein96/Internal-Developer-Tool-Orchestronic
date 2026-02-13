import os
import json
import pika
import psycopg2
import shutil
from airflow import DAG
from airflow.operators.python import PythonOperator,BranchPythonOperator
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta
from dotenv import load_dotenv
from os.path import expanduser
load_dotenv(expanduser('/opt/airflow/dags/.env'))


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
    if not rabbit_url:
        raise ValueError("RABBITMQ_URL is not set in .env")

    connection = pika.BlockingConnection(pika.URLParameters(rabbit_url))
    channel = connection.channel()

    method_frame, header_frame, body = channel.basic_get(queue='destroy', auto_ack=True)
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
# Step 2: Get repository/project name
# -------------------------
def repository_name(request_id):
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
    try:
        cursor.execute('SELECT "repositoryId" FROM "Request" WHERE id = %s;', (request_id,))
        res = cursor.fetchone()
        if not res:
            raise ValueError(f"No request found for id={request_id}")
        repositoryId = res[0]

        cursor.execute('SELECT "name" FROM "Repository" WHERE id = %s;', (repositoryId,))
        row = cursor.fetchone()
        if not row:
            raise ValueError(f"No repository found for id={repositoryId}")
        return row[0]
    finally:
        cursor.close()
        connection.close()

# -------------------------
# Step 3: Cleanup folder
# -------------------------
def cleanup_directory(projectName):
    directory_path = f"/opt/airflow/dags/terraform/{projectName}"
    if os.path.exists(directory_path):
        shutil.rmtree(directory_path)
    return projectName

def supabase_delete_request(request_id):
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
    try:
        # GET repositoryId, resourcesId
        cursor.execute('SELECT "repositoryId", "resourcesId" FROM "Request" WHERE id = %s;', (request_id,))
        res = cursor.fetchone()
        if not res:
            raise ValueError(f"No request found for id={request_id}")
        repositoryId, resourcesId = res

        # Delete request record
        cursor.execute('DELETE FROM "Request" WHERE id = %s;', (request_id,))
        connection.commit()
        print(f"Deleted request with id={request_id}")

        # Delete repository record
        cursor.execute('DELETE FROM "Repository" WHERE id = %s;', (repositoryId,))
        connection.commit()
        print(f"Deleted repository with id={repositoryId}")

        # GET resourceConfigId, CloudProvider
        cursor.execute('SELECT "resourceConfigId" FROM "Resources" WHERE id = %s;', (resourcesId,))
        res = cursor.fetchone()
        if not res:
            raise ValueError(f"No resources found for id={resourcesId}")
        resourceConfigId = res

        # Delete resources record
        cursor.execute('DELETE FROM "Resources" WHERE id = %s;', (resourcesId,))
        connection.commit()
        print(f"Deleted resources with id={resourcesId}")

        # Delete resources
        # AWS VM Instance
        cursor.execute('SELECT * FROM "AwsVMInstance" WHERE "resourceConfigId" = %s;', (resourceConfigId,))
        res = cursor.fetchall()
        if res:
            cursor.execute('DELETE FROM "AwsVMInstance" WHERE "resourceConfigId" = %s;', (resourceConfigId,))
            connection.commit()
            print(f"Deleted AwsVMInstance with id={resourceConfigId}")

        # AWS Database Instance
        cursor.execute('SELECT * FROM "AwsDatabaseInstance" WHERE "resourceConfigId" = %s;', (resourceConfigId,))
        res = cursor.fetchall()
        if res:
            cursor.execute('DELETE FROM "AwsDatabaseInstance" WHERE "resourceConfigId" = %s;', (resourceConfigId,))
            connection.commit()
            print(f"Deleted AwsDatabaseInstance with id={resourceConfigId}")
    
        # AWS Storage Instance
        cursor.execute('SELECT * FROM "AwsStorageInstance" WHERE "resourceConfigId" = %s;', (resourceConfigId,))
        res = cursor.fetchall()
        if res:
            cursor.execute('DELETE FROM "AwsStorageInstance" WHERE "resourceConfigId" = %s;', (resourceConfigId,))
            connection.commit()
            print(f"Deleted AwsStorageInstance with id={resourceConfigId}")

        # Azure Resource Group Instance
        cursor.execute('SELECT * FROM "Resources" WHERE "resourceConfigId" = %s;', (resourceConfigId,))
        res = cursor.fetchall()
        if res:
            cursor.execute('DELETE FROM "Resources" WHERE "resourceConfigId" = %s;', (resourceConfigId,))
            connection.commit()
            print(f"Deleted Resources with id={resourceConfigId}")
        
        # Resource Config
        cursor.execute('DELETE FROM "ResourceConfig" WHERE id = %s;', (resourceConfigId,))
        connection.commit()
        print(f"Deleted ResourceConfig with id={resourceConfigId}")

    finally:
        cursor.close()
        connection.close()

def branch_resources(request_id):
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
    try:
        cursor.execute('SELECT "resourcesId" FROM "Request" WHERE id = %s;', (request_id,))
        res = cursor.fetchone()
        if not res:
            raise ValueError(f"No request found for id={request_id}")
        resourcesId = res[0]

        cursor.execute(
        '''SELECT "resourceConfigId"
           FROM "Resources"
           WHERE id = %s;''',
        (resourcesId,)
        )
        resource = cursor.fetchone()
        if not resource:
            raise ValueError(f"No resource found for resourcesId={resourcesId}")

        resourceConfigId = resource[0]
        
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

        branches = []
        if vm_count > 0:
            branches.append('terraform_destroy_ec2')
        if db_count > 0:
            branches.append('terraform_destroy_rds')
        if st_count > 0:
            branches.append('terraform_destroy_s3')
        if not branches:
            return 'end'
    finally:
        cursor.close()
        connection.close()
    return branches
# -------------------------
# DAG Definition
# -------------------------
with DAG(
    dag_id='AWS_Destroy',
    default_args=default_args,
    schedule=None,
    catchup=False,
    max_active_runs=1,
) as dag:
    
    # Get request ID
    get_request_id = PythonOperator(
        task_id="get_request_id",
        python_callable=rabbitmq_consumer,
    )

    # Get repository/project name
    get_repository_name = PythonOperator(
        task_id="get_repository_name",
        python_callable=repository_name,
        op_args=["{{ ti.xcom_pull(task_ids='get_request_id') }}"],
    )

    destroy_rds = BashOperator(
        task_id="terraform_destroy_rds",
        bash_command=(
            'cd "/opt/airflow/dags/terraform/{{ ti.xcom_pull(task_ids=\'get_repository_name\') | trim | replace(\'"\',\'\') }}/db" && '
            'terraform init && terraform destroy -auto-approve'
        ),
        env={
            "AWS_ACCESS_KEY_ID": os.getenv('AWS_ACCESS_KEY'),
            "AWS_SECRET_ACCESS_KEY": os.getenv('AWS_SECRET_KEY'),
            "AWS_DEFAULT_REGION": os.getenv('AWS_DEFAULT_REGION'),
        },
        retries=3,
        retry_delay=timedelta(minutes=5)
    )

    destroy_s3 = BashOperator(
        task_id="terraform_destroy_s3",
        bash_command=(
            'cd "/opt/airflow/dags/terraform/{{ ti.xcom_pull(task_ids=\'get_repository_name\') | trim | replace(\'"\',\'\') }}/st" && '
            'terraform init && terraform destroy -auto-approve'
        ),
        env={
            "AWS_ACCESS_KEY_ID": os.getenv('AWS_ACCESS_KEY'),
            "AWS_SECRET_ACCESS_KEY": os.getenv('AWS_SECRET_KEY'),
            "AWS_DEFAULT_REGION": os.getenv('AWS_DEFAULT_REGION'),
        },
        retries=3,
        retry_delay=timedelta(minutes=5)
    )

    destroy_ec2 = BashOperator(
        task_id="terraform_destroy_ec2",
        bash_command=(
            'cd "/opt/airflow/dags/terraform/{{ ti.xcom_pull(task_ids=\'get_repository_name\') | trim | replace(\'"\',\'\') }}/vm" && '
            'terraform init && terraform destroy -auto-approve'
        ),
        env={
            "AWS_ACCESS_KEY_ID": os.getenv('AWS_ACCESS_KEY'),
            "AWS_SECRET_ACCESS_KEY": os.getenv('AWS_SECRET_KEY'),
            "AWS_DEFAULT_REGION": os.getenv('AWS_DEFAULT_REGION'),
        },
        retries=3,
        retry_delay=timedelta(minutes=5)
    )

    branch_task = BranchPythonOperator(
        task_id='branch_resources',
        python_callable=branch_resources,
        op_args=["{{ ti.xcom_pull(task_ids='get_request_id') }}"],
        retries=3,
        retry_delay=timedelta(minutes=5)
    )

    # Cleanup folder
    cleanup_dir = PythonOperator(
        task_id="cleanup_dir",
        python_callable=cleanup_directory,
        op_args=["{{ ti.xcom_pull(task_ids='get_repository_name') }}"],
        trigger_rule='none_failed_min_one_success',
    )

    # Delete DB record
    delete_request = PythonOperator(
        task_id='supabase_delete_request',
        python_callable=supabase_delete_request,
        op_args=["{{ ti.xcom_pull(task_ids='get_request_id') }}"],
        trigger_rule='all_done',
        retries=3,
        retry_delay=timedelta(minutes=5)
    )

    get_request_id >> get_repository_name >> branch_task>> [destroy_ec2, destroy_rds, destroy_s3] >> cleanup_dir >> delete_request


