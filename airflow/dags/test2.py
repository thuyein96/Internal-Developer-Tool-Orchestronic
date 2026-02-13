from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
import requests
import os

def delete_from_backend(request_id):
    token = os.getenv("BACKEND_API_TOKEN")   # store in .env or Airflow connection/Variable
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    url = f"http://orchestronic.online/api/request/{request_id}"
    
    response = requests.delete(url, headers=headers)
    
    if response.status_code == 200:
        print(f"Deleted VM {request_id} from backend successfully.")
    else:
        raise Exception(f"Failed to delete VM {request_id}, status: {response.status_code}, body: {response.text}")

dag = DAG(
    'delete_vm_from_backend',
    default_args={
        'owner': 'airflow',
        'depends_on_past': False,
        'start_date': datetime(2024, 1, 1),
        'retries': 1,
        'retry_delay': timedelta(minutes=5),
    },
    schedule_interval=None,
    catchup=False,
    tags=['example'],
)

delete_task = PythonOperator(
    task_id="delete_from_db",
    python_callable=delete_from_backend,
    provide_context=True,
    dag=dag,
)

delete_task