terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

###################
# Resource group
###################
resource "azurerm_resource_group" "rg" {
  name     = "${var.prefix}-rg"
  location = var.location
}

###################
# Network: VNet + Subnet + NSG
###################
resource "azurerm_virtual_network" "vnet" {
  name                = "${var.prefix}-vnet"
  address_space       = var.vnet_address_space
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_subnet" "subnet" {
  name                 = "${var.prefix}-subnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = var.subnet_prefix
}

resource "azurerm_network_security_group" "nsg" {
  name                = "${var.prefix}-nsg"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  # Static well-known rules (RDP, HTTP) if present in allowed_inbound_ports - we add below using dynamic
}

# Add security rules for allowed_inbound_ports
dynamic "security_rule" {
  for_each = toset(var.allowed_inbound_ports)
  content {
    name                       = "allow-${security_rule.value}"
    priority                   = 1000 + security_rule.value
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = security_rule.value == 3389 ? "*" : "Tcp"
    source_port_range          = "*"
    destination_port_range     = tostring(security_rule.value)
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

# Associate NSG to subnet (recommended)
resource "azurerm_subnet_network_security_group_association" "subnet_nsg_assoc" {
  subnet_id                 = azurerm_subnet.subnet.id
  network_security_group_id = azurerm_network_security_group.nsg.id
}

###################
# Public IPs (one per VM if assign_public_ip true)
###################
resource "azurerm_public_ip" "vm" {
  count               = var.assign_public_ip ? var.vm_count : 0
  name                = "${var.prefix}-pip-${count.index + 1}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  allocation_method   = "Dynamic"
  sku                 = "Basic"
}

###################
# Network interfaces (one per VM)
###################
resource "azurerm_network_interface" "nic" {
  count               = var.vm_count
  name                = "${var.prefix}-nic-${count.index + 1}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  ip_configuration {
    name                          = "ipconfig${count.index + 1}"
    subnet_id                     = azurerm_subnet.subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = var.assign_public_ip ? element(azurerm_public_ip.vm.*.id, count.index) : null
  }
}

###################
# Storage accounts (dynamic)
###################
resource "random_id" "storage" {
  count       = var.storage_count
  byte_length = 4
}

resource "azurerm_storage_account" "storage" {
  count                   = var.storage_count
  name                    = lower("${var.prefix}st${random_id.storage[count.index].hex}")
  resource_group_name     = azurerm_resource_group.rg.name
  location                = azurerm_resource_group.rg.location
  account_tier            = "Standard"
  account_replication_type = "LRS"
  allow_blob_public_access = false
}

# A single storage account used for VM boot diagnostics (one-off)
resource "random_id" "diag" {
  byte_length = 4
}

resource "azurerm_storage_account" "diag" {
  name                    = lower("${var.prefix}diag${random_id.diag.hex}")
  resource_group_name     = azurerm_resource_group.rg.name
  location                = azurerm_resource_group.rg.location
  account_tier            = "Standard"
  account_replication_type = "LRS"
}

###################
# Password generation (if not supplied)
###################
resource "random_password" "admin" {
  count      = var.admin_password == "" ? 1 : 0
  length     = 20
  special    = true
  min_upper  = 1
  min_lower  = 1
  min_numeric = 1
  min_special = 1
}

locals {
  vm_admin_password = var.admin_password != "" ? var.admin_password : (length(random_password.admin) > 0 ? random_password.admin[0].result : "")
}

###################
# Windows Virtual Machines (dynamic)
###################
resource "azurerm_windows_virtual_machine" "vm" {
  count                 = var.vm_count
  name                  = "${var.prefix}-vm-${count.index + 1}"
  resource_group_name   = azurerm_resource_group.rg.name
  location              = azurerm_resource_group.rg.location
  size                  = var.vm_size
  admin_username        = var.admin_username
  admin_password        = local.vm_admin_password
  network_interface_ids = [azurerm_network_interface.nic[count.index].id]

  os_disk {
    name                 = "${var.prefix}-osdisk-${count.index + 1}"
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
  }

  source_image_reference {
    publisher = "MicrosoftWindowsServer"
    offer     = "WindowsServer"
    sku       = "2022-datacenter-azure-edition"
    version   = "latest"
  }

  boot_diagnostics {
    storage_account_uri = azurerm_storage_account.diag.primary_blob_endpoint
  }

  # Tagging for clarity
  tags = {
    created_by = "terraform"
    role       = "web"
  }
}

# Install IIS via VM extension
resource "azurerm_virtual_machine_extension" "iis" {
  count                = var.vm_count
  name                 = "${var.prefix}-wsi-${count.index + 1}"
  virtual_machine_id   = azurerm_windows_virtual_machine.vm[count.index].id
  publisher            = "Microsoft.Compute"
  type                 = "CustomScriptExtension"
  type_handler_version = "1.10"

  settings = <<SETTINGS
    {
      "commandToExecute": "powershell -ExecutionPolicy Unrestricted Install-WindowsFeature -Name Web-Server -IncludeAllSubFeature -IncludeManagementTools"
    }
  SETTINGS
}

###################
# SQL Server + Databases (create server only if db_count > 0)
###################
resource "random_id" "sql" {
  count       = var.db_count > 0 ? 1 : 0
  byte_length = 4
}

resource "random_password" "sql_admin" {
  count      = var.sql_admin_password == "" && var.db_count > 0 ? 1 : 0
  length     = 20
  special    = true
  min_upper  = 1
  min_lower  = 1
  min_numeric = 1
  min_special = 1
}

locals {
  sql_admin_password_final = var.sql_admin_password != "" ? var.sql_admin_password : (length(random_password.sql_admin) > 0 ? random_password.sql_admin[0].result : "")
}

resource "azurerm_mssql_server" "sql" {
  count                = var.db_count > 0 ? 1 : 0
  name                 = lower("${var.prefix}sql${random_id.sql[0].hex}")
  resource_group_name  = azurerm_resource_group.rg.name
  location             = azurerm_resource_group.rg.location
  version              = "12.0"

  administrator_login          = var.sql_admin_username
  administrator_login_password = local.sql_admin_password_final

  tags = {
    created_by = "terraform"
  }
}

resource "azurerm_mssql_database" "db" {
  count     = var.db_count
  name      = "${var.prefix}-db-${count.index + 1}"
  server_id = azurerm_mssql_server.sql[0].id
  sku_name  = "S0"
}
