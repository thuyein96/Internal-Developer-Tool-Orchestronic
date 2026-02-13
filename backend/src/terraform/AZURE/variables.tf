variable "prefix" {
  description = "Short resource name prefix (lowercase letters + numbers). Used to build resource names."
  type        = string
}

variable "location" {
  description = "Azure region to deploy into (e.g. 'Southeast Asia', 'East US')."
  type        = string
  default     = "Southeast Asia"
}

variable "vm_count" {
  description = "Number of Windows VMs to create."
  type        = number
  default     = 1
}

variable "vm_size" {
  description = "Azure VM size (SKU)."
  type        = string
  default     = "Standard_DS1_v2"
}

variable "admin_username" {
  description = "Admin username for all VMs."
  type        = string
  default     = "azureuser"
}

variable "admin_password" {
  description = "Optional. If empty string, Terraform will generate a secure password and return it as sensitive output."
  type        = string
  default     = ""
  sensitive   = true
}

variable "assign_public_ip" {
  description = "If true, a public IP will be created/attached for each VM."
  type        = bool
  default     = true
}

variable "allowed_inbound_ports" {
  description = "List of inbound ports to allow in NSG (common: 3389, 80)."
  type        = list(number)
  default     = [3389, 80]
}

variable "vnet_address_space" {
  description = "VNet address space (list form)."
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "subnet_prefix" {
  description = "Subnet address prefixes (list form). This template uses the first element."
  type        = list(string)
  default     = ["10.0.1.0/24"]
}

variable "storage_count" {
  description = "Number of storage accounts to create."
  type        = number
  default     = 1
}

variable "db_count" {
  description = "Number of databases to create. If 0, no DB server or DBs will be created."
  type        = number
  default     = 0
}

variable "sql_admin_username" {
  description = "SQL admin username (if db_count > 0)."
  type        = string
  default     = "sqladmin"
}

variable "sql_admin_password" {
  description = "Optional. If empty string and db_count>0, Terraform will generate a secure SQL admin password."
  type        = string
  default     = ""
  sensitive   = true
}
