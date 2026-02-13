from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime
import os
from dotenv import load_dotenv

def load_environment():
    # Load env file inside container
    load_dotenv('/opt/airflow/dags/.env')
    port = os.getenv('PORT')
    print("Environment variable PORT set:", port)

def print_message():
    message = os.getenv('PORT', 'No env found')
    print(f"Sample message: {message}")

with DAG(
    dag_id='test_load_env_and_message',
    start_date=datetime(2024, 1, 1),
    schedule_interval=None,
    catchup=False,
    tags=['sample', 'env'],
) as dag:

    task_load_env = PythonOperator(
        task_id='load_environment',
        python_callable=load_environment,
    )

    task_print_message = PythonOperator(
        task_id='print_message',
        python_callable=print_message,
    )

    task_load_env >> task_print_message
