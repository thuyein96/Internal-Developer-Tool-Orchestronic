# test_env.py
import os
from dotenv import load_dotenv
from os.path import expanduser

# Load .env file
env_path = expanduser('/Users/pattiyayiadram/GitHub/nestJS/lesson01/dags/.env')
load_dotenv(env_path)

# List of env variables to test
env_vars = [
    "AZURE_SUBSCRIPTION_ID",
    "AZURE_CLIENT_ID",
    "AZURE_CLIENT_SECRET",
    "AZURE_TENANT_ID",
    "DB_USER",
    "DB_PASSWORD",
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "RABBITMQ_URL"
]

# Test and print values
for var in env_vars:
    value = os.getenv(var)
    if value:
        print(f"{var}: {value}")
    else:
        print(f"{var} is not set!")
