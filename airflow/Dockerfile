FROM apache/airflow:2.10.4-python3.10

# Copy and install your Python dependencies
COPY requirements.txt /requirements.txt
RUN pip install --no-cache-dir -r /requirements.txt && \
    pip install --no-cache-dir apache-airflow-providers-microsoft-azure

# -----------------------------
# Install Terraform
# -----------------------------
USER root

# Install dependencies and Terraform
RUN apt-get update && apt-get install -y unzip curl && \
    curl -LO https://releases.hashicorp.com/terraform/1.5.7/terraform_1.5.7_linux_amd64.zip && \
    unzip terraform_1.5.7_linux_amd64.zip -d /usr/local/bin && \
    rm terraform_1.5.7_linux_amd64.zip && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Ansible + SSH client (required for Ansible)
RUN apt-get update && apt-get install -y \
    ansible \
    openssh-client \
    sshpass \
    git \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*