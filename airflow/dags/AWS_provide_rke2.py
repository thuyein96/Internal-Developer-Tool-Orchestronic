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

    # Get resource info
    cursor.execute(
        'SELECT "name", "region", "resourceConfigId" FROM "Resources" WHERE id = %s;',
        (resource_id,)
    )
    resource = cursor.fetchone()
    if not resource:
        raise ValueError(f"No resource found for resource_id={resource_id}")
    repoName, region, resourceConfigId = resource

    # Get RKE2 cluster configurations
    cursor.execute(
        'SELECT "id", "clusterName", "nodeCount", "nodeSize" '
        'FROM "AwsK8sCluster" WHERE "resourceConfigId" = %s;',
        (resourceConfigId,)
    )
    clusters = cursor.fetchall()
    if not clusters:
        raise ValueError(f"No cluster config found for resourceConfigId={resourceConfigId}")

    cluster_list = []
    for cluster in clusters:
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
        "rke2_clusters": cluster_list
    }
    return configInfo

def create_terraform_directory(configInfo):
    if isinstance(configInfo, str):
        configInfo = ast.literal_eval(configInfo)
        
    repoName = configInfo['repoName']
    terraform_dir = f"/opt/airflow/dags/terraform/{repoName}/rke2"
    os.makedirs(terraform_dir, exist_ok=True)
    return terraform_dir

def write_terraform_files(terraform_dir, configInfo):
    if isinstance(configInfo, str):
        configInfo = ast.literal_eval(configInfo)
        
    config_dict = configInfo
    projectName = f"{config_dict['repoName']}-{config_dict['resourcesId'][:4]}"
    rke2_clusters = config_dict['rke2_clusters']

    load_dotenv(expanduser('/opt/airflow/dags/.env'))

    # terraform.auto.tfvars
    tfvars_content = f"""
access_key       = "{os.getenv('AWS_ACCESS_KEY')}"
secret_key       = "{os.getenv('AWS_SECRET_KEY')}"
project_location = "{config_dict['region']}"
project_name     = "{projectName}"
rke2_clusters    = {json.dumps(rke2_clusters, indent=4)}
"""
    with open(f"{terraform_dir}/terraform.auto.tfvars", "w") as f:
        f.write(tfvars_content)
    
    # Read Public Key for AWS Key Pair
    try:
        with open('/opt/airflow/dags/.ssh/id_rsa.pub', 'r') as pub_key_file:
            ssh_public_key = pub_key_file.read().strip()
    except FileNotFoundError:
        raise ValueError("Public key not found at /opt/airflow/dags/.ssh/id_rsa.pub")

    # Read Private Key to embed into Worker User Data (for SCP/SSH)
    try:
        with open('/opt/airflow/dags/.ssh/id_rsa', 'r') as priv_key_file:
            ssh_private_key_content = priv_key_file.read()
    except FileNotFoundError:
        raise ValueError("Private key not found at /opt/airflow/dags/.ssh/id_rsa")

    # main.tf template
    main_tf_template = """
terraform {{
  required_providers {{
    aws = {{
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }}
  }}
}}

provider "aws" {{
  region     = var.project_location
  access_key = var.access_key
  secret_key = var.secret_key
}}

# Define the Key Pair
resource "aws_key_pair" "rke2_auth" {{
  key_name   = "${{var.project_name}}-rke2-key"
  public_key = "__SSH_PUBLIC_KEY__"
}}

# Lookup Shared VPC/Subnets
data "aws_vpc" "rke2_vpc" {{
  filter {{
    name   = "tag:Name"
    values = ["${{var.project_name}}-rke2-vpc"]
  }}
}}

data "aws_subnet" "rke2_subnet_0" {{
  filter {{
    name   = "tag:Name"
    values = ["${{var.project_name}}-rke2-subnet-0"]
  }}
}}

data "aws_subnet" "rke2_subnet_1" {{
  filter {{
    name   = "tag:Name"
    values = ["${{var.project_name}}-rke2-subnet-1"]
  }}
}}

# Security Group for RKE2
resource "aws_security_group" "rke2_sg" {{
  name   = "${{var.project_name}}-rke2-sg"
  vpc_id = data.aws_vpc.rke2_vpc.id

  # Allow SSH
  ingress {{
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }}

  # Allow K8s API (6443)
  ingress {{
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }}

  # Allow RKE2 Node Registration (9345)
  ingress {{
    from_port   = 9345
    to_port     = 9345
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }}

  # Allow internal VPC traffic
  ingress {{
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }}

  # Allow all outbound traffic
  egress {{
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }}

  tags = {{
    Name = "${{var.project_name}}-rke2-sg"
  }}
}}

# Edge Security Group (Nginx)
resource "aws_security_group" "edge_sg" {{
  name   = "${{var.project_name}}-edge-sg"
  vpc_id = data.aws_vpc.rke2_vpc.id

  ingress {{
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }}

  ingress {{
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }}

  ingress {{
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }}

  egress {{
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }}

  tags = {{
    Name = "${{var.project_name}}-edge-sg"
  }}
}}

# IAM Role for RKE2 nodes
resource "aws_iam_role" "rke2_role" {{
  name = "${{var.project_name}}-rke2-role"

  assume_role_policy = jsonencode({{
    Version = "2012-10-17"
    Statement = [{{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {{
        Service = "ec2.amazonaws.com"
      }}
    }}]
  }})
}}

resource "aws_iam_instance_profile" "rke2_profile" {{
  name = "${{var.project_name}}-rke2-profile"
  role = aws_iam_role.rke2_role.name
}}

resource "aws_iam_role_policy_attachment" "rke2_ssm_policy" {{
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  role       = aws_iam_role.rke2_role.name
}}

data "aws_ami" "ubuntu" {{
  most_recent = true
  owners      = ["099720109477"] 

  filter {{
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }}

  filter {{
    name   = "virtualization-type"
    values = ["hvm"]
  }}
}}

# RKE2 Master Node
resource "aws_instance" "rke2_master" {{
  for_each = {{ for cluster in var.rke2_clusters : cluster.id => cluster }}
  
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.medium"
  iam_instance_profile   = aws_iam_instance_profile.rke2_profile.name
  subnet_id              = data.aws_subnet.rke2_subnet_0.id
  vpc_security_group_ids = [aws_security_group.rke2_sg.id]
  
  associate_public_ip_address = true
  
  key_name = aws_key_pair.rke2_auth.key_name

  user_data = base64encode(<<-EOF
              #!/bin/bash
              set -e
              apt-get update
              apt-get install -y curl wget git awscli
              
              PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

              # Install RKE2 Server
              curl -sfL https://get.rke2.io | sh -
              
              systemctl enable rke2-server.service
              systemctl start rke2-server.service
              
              export PATH=$PATH:/var/lib/rancher/rke2/bin
              echo 'export PATH=$PATH:/var/lib/rancher/rke2/bin' >> /home/ubuntu/.bashrc

              mkdir -p /home/ubuntu/.kube
              until [ -f /etc/rancher/rke2/rke2.yaml ]; do sleep 2; done
              
              cp /etc/rancher/rke2/rke2.yaml /home/ubuntu/.kube/config
              chown ubuntu:ubuntu /home/ubuntu/.kube/config
              chmod 600 /home/ubuntu/.kube/config

              # Wait for token to exist for agents
              until [ -f /var/lib/rancher/rke2/server/node-token ]; do sleep 2; done

              # Patch RKE2's default Nginx Ingress to use NodePorts 30080/30443
              # so the Edge Nginx can route to it.
              sleep 30
              export KUBECONFIG=/etc/rancher/rke2/rke2.yaml
              /var/lib/rancher/rke2/bin/kubectl -n kube-system patch svc rke2-ingress-nginx-controller --type merge -p '{"spec":{"type":"NodePort","ports":[{"name":"http","port":80,"protocol":"TCP","targetPort":"http","nodePort":30080},{"name":"https","port":443,"protocol":"TCP","targetPort":"https","nodePort":30443}]}}'
              EOF
  )
  
  tags = {{
    Name = "${{each.value.cluster_name}}-master"
    ClusterName = each.value.cluster_name
  }}
}}

# Edge VM (Nginx)
resource "aws_instance" "rke2_edge" {{
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  iam_instance_profile   = aws_iam_instance_profile.rke2_profile.name
  subnet_id              = data.aws_subnet.rke2_subnet_0.id
  vpc_security_group_ids = [aws_security_group.edge_sg.id]

  associate_public_ip_address = true
  key_name = aws_key_pair.rke2_auth.key_name

  user_data = base64encode(<<-EOF
              #!/bin/bash
              set -e
              apt-get update
              apt-get install -y ca-certificates curl gnupg

              # Install Docker
              install -m 0755 -d /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
              chmod a+r /etc/apt/keyrings/docker.gpg
              echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu jammy stable" > /etc/apt/sources.list.d/docker.list
              apt-get update
              apt-get install -y docker-ce docker-ce-cli containerd.io

              # Setup Nginx Config Directory
              mkdir -p /etc/nginx/conf.d
              mkdir -p /etc/nginx/certs
              
              # Generate Self-Signed Certs for Nginx start (Production should use Certbot/ACME)
              openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout /etc/nginx/certs/nginx.key \
                -out /etc/nginx/certs/nginx.crt \
                -subj "/C=US/ST=State/L=City/O=Orchestronic/CN=*.orchestronic.dev"

              # Write Nginx Configuration
              # Routes *.cluster.orchestronic.dev -> Cluster Master IP:30080
              cat > /etc/nginx/nginx.conf <<'NGINX_CONF'
              user  nginx;
              worker_processes  auto;
              error_log  /var/log/nginx/error.log notice;
              pid        /var/run/nginx.pid;

              events {{
                  worker_connections  1024;
              }}

              http {{
                  include       /etc/nginx/mime.types;
                  default_type  application/octet-stream;
                  log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                                    '$status $body_bytes_sent "$http_referer" '
                                    '"$http_user_agent" "$http_x_forwarded_for"';
                  access_log  /var/log/nginx/access.log  main;
                  sendfile        on;
                  keepalive_timeout  65;

                  # Default server to drop unmatched traffic or handle health checks
                  server {{
                      listen 80 default_server;
                      server_name _;
                      return 404;
                  }}

                  # Template loop for RKE2 clusters
%{{ for cluster in var.rke2_clusters ~}}
                  upstream backend_${{cluster.id}} {{
                      # Point to the Master Node's private IP and NodePort 30080 (Ingress HTTP)
                      server ${{aws_instance.rke2_master[cluster.id].private_ip}}:30080;
                  }}

                  server {{
                      listen 80;
                      server_name *.${{cluster.cluster_name}}.orchestronic.dev;
                      # Redirect HTTP to HTTPS
                      return 301 https://$host$request_uri;
                  }}

                  server {{
                      listen 443 ssl;
                      server_name *.${{cluster.cluster_name}}.orchestronic.dev;

                      ssl_certificate     /etc/nginx/certs/nginx.crt;
                      ssl_certificate_key /etc/nginx/certs/nginx.key;
                      
                      # Basic SSL settings
                      ssl_protocols TLSv1.2 TLSv1.3;
                      ssl_ciphers HIGH:!aNULL:!MD5;

                      location / {{
                          proxy_pass http://backend_${{cluster.id}};
                          proxy_set_header Host $host;
                          proxy_set_header X-Real-IP $remote_addr;
                          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                          proxy_set_header X-Forwarded-Proto $scheme;
                      }}
                  }}
%{{ endfor ~}}
              }}
              NGINX_CONF

              # Run Nginx Container
              docker run -d --restart unless-stopped \
                --name nginx-edge \
                -p 80:80 -p 443:443 \
                -v /etc/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
                -v /etc/nginx/certs:/etc/nginx/certs:ro \
                nginx:latest
              EOF
  )

  tags = {{
    Name = "${{var.project_name}}-edge"
  }}

  depends_on = [aws_instance.rke2_master]
}}

# RKE2 Worker Nodes
resource "aws_instance" "rke2_worker" {{
  for_each = {{
    for item in flatten([
      for cluster in var.rke2_clusters : [
        for i in range(cluster.node_count) : {{
          cluster_id = cluster.id
          cluster_name = cluster.cluster_name
          node_size = cluster.node_size
          index = i
        }}
      ]
    ]) : "${{item.cluster_id}}-worker-${{item.index}}" => item
  }}
  
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = each.value.node_size
  iam_instance_profile   = aws_iam_instance_profile.rke2_profile.name
  subnet_id              = each.value.index % 2 == 0 ? data.aws_subnet.rke2_subnet_0.id : data.aws_subnet.rke2_subnet_1.id
  vpc_security_group_ids = [aws_security_group.rke2_sg.id]
  
  associate_public_ip_address = true
  key_name = aws_key_pair.rke2_auth.key_name

  # Worker installation script using SSH to fetch token
  user_data = base64encode(<<-EOF
              #!/bin/bash
              set -e
              apt-get update
              apt-get install -y curl wget git awscli
              
              # Save Private Key for SSH
              echo "__SSH_PRIVATE_KEY__" > /home/ubuntu/.ssh/id_rsa
              chmod 600 /home/ubuntu/.ssh/id_rsa
              chown ubuntu:ubuntu /home/ubuntu/.ssh/id_rsa

              # Wait for master 
              sleep 45
              
              MASTER_IP="${{aws_instance.rke2_master[each.value.cluster_id].private_ip}}"

              # Fetch token via SSH
              TOKEN=""
              for i in $(seq 1 60); do
                TOKEN=$(ssh -i /home/ubuntu/.ssh/id_rsa -o StrictHostKeyChecking=no -o ConnectTimeout=5 ubuntu@$MASTER_IP "sudo cat /var/lib/rancher/rke2/server/node-token" 2>/dev/null || true)
                if [ -n "$TOKEN" ]; then
                  break
                fi
                sleep 5
              done

              rm -f /home/ubuntu/.ssh/id_rsa

              if [ -z "$TOKEN" ]; then
                echo "Failed to fetch RKE2 token from $MASTER_IP via SSH" >&2
                exit 1
              fi

              # Install RKE2 Agent
              curl -sfL https://get.rke2.io | INSTALL_RKE2_TYPE="agent" sh -

              mkdir -p /etc/rancher/rke2
              echo "server: https://$MASTER_IP:9345" > /etc/rancher/rke2/config.yaml
              echo "token: $TOKEN" >> /etc/rancher/rke2/config.yaml

              systemctl enable rke2-agent.service
              systemctl start rke2-agent.service
              EOF
  )
  
  tags = {{
    Name = "${{each.value.cluster_name}}-worker-${{each.value.index}}"
    ClusterName = each.value.cluster_name
  }}

  depends_on = [aws_instance.rke2_master]
}}

output "rke2_masters" {{
  value = {{
    for cluster_id, master in aws_instance.rke2_master : cluster_id => {{
      public_ip  = master.public_ip
      private_ip = master.private_ip
    }}
  }}
}}
"""

    main_tf_content = (
        main_tf_template
        .replace("{{", "{")
        .replace("}}", "}")
        .replace("__SSH_PUBLIC_KEY__", ssh_public_key)
        .replace("__SSH_PRIVATE_KEY__", ssh_private_key_content)
    )

    with open(f"{terraform_dir}/main.tf", "w") as f:
        f.write(main_tf_content)

    # variables.tf
    variables_tf = f"""
variable "access_key" {{ type = string }}
variable "secret_key" {{ type = string }}
variable "project_location" {{ type = string, default = "{config_dict['region']}" }}
variable "project_name" {{ type = string, default = "{projectName}" }}

variable "rke2_clusters" {{
  description = "List of RKE2 cluster configurations"
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

def write_to_db(terraform_dir, configInfo, **context):
    if isinstance(configInfo, str):
        configInfo = ast.literal_eval(configInfo)

    output_file = Path(terraform_dir) / "terraform.tfstate"
    if not output_file.exists():
        raise FileNotFoundError(f"Terraform state file not found at {output_file}")

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

    with open(output_file, 'r') as f:
        tf_state = json.load(f)

    for cluster in configInfo['rke2_clusters']:
        cluster_id = cluster['id']
        master_public_ip = None
        
        for resource in tf_state.get('resources', []):
            if resource.get('type') == 'aws_instance' and resource.get('name') == 'rke2_master':
                for instance in resource.get('instances', []):
                    if instance.get('index_key') == cluster_id:
                        master_public_ip = instance.get('attributes', {}).get('public_ip')
                        break

        if not master_public_ip:
            print(f"Warning: No master found for cluster {cluster_id}")
            continue

        import subprocess
        import time
        import tempfile
        kubeconfig = None
        
        tmp_key_path = None
        try:
            with tempfile.NamedTemporaryFile(mode='w', delete=False) as tmp_key:
                with open('/opt/airflow/dags/.ssh/id_rsa', 'r') as key_file:
                    tmp_key.write(key_file.read())
                tmp_key_path = tmp_key.name
            
            os.chmod(tmp_key_path, 0o600)

            max_retries = 10
            for attempt in range(max_retries):
                try:
                    result = subprocess.run(
                        [
                            'ssh',
                            '-o', 'StrictHostKeyChecking=no',
                            '-o', 'UserKnownHostsFile=/dev/null',
                            '-i', tmp_key_path,
                            f'ubuntu@{master_public_ip}',
                            'sudo cat /etc/rancher/rke2/rke2.yaml'
                        ],
                        capture_output=True,
                        text=True,
                        timeout=10
                    )
                    
                    if result.returncode == 0 and result.stdout.strip():
                        kubeconfig = result.stdout
                        kubeconfig = kubeconfig.replace('127.0.0.1', master_public_ip)
                        kubeconfig = kubeconfig.replace('localhost', master_public_ip)
                        break
                except Exception:
                    pass
                if attempt < max_retries - 1:
                    time.sleep(30)
        finally:
            if tmp_key_path and os.path.exists(tmp_key_path):
                os.unlink(tmp_key_path)

        update_query = 'UPDATE "AwsK8sCluster" SET "clusterEndpoint" = %s, "terraformState" = %s'
        params = [json.dumps(master_public_ip), json.dumps(tf_state)]
        
        if kubeconfig:
            update_query += ', "kubeConfig" = %s'
            params.append(kubeconfig)
        
        update_query += ' WHERE "id" = %s;'
        params.append(cluster_id)
        
        cursor.execute(update_query, tuple(params))
        connection.commit()

    connection.commit()
    cursor.close()
    connection.close()

with DAG(
    'AWS_terraform_rke2_provision',
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