output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}

output "vm_private_ips" {
  value = [for nic in azurerm_network_interface.nic : nic.ip_configuration[0].private_ip_address]
  description = "Private IPs of the VMs"
}

output "vm_public_ips" {
  value       = var.assign_public_ip ? [for pip in azurerm_public_ip.vm : pip.ip_address] : []
  description = "Public IPs (if assigned)."
  sensitive   = false
}

output "admin_username" {
  value = var.admin_username
}

output "admin_password" {
  value       = local.vm_admin_password
  description = "VM admin password (sensitive)."
  sensitive   = true
}

output "storage_accounts" {
  value = [for sa in azurerm_storage_account.storage : sa.name]
}

output "diag_storage_account" {
  value = azurerm_storage_account.diag.name
}

output "sql_server_name" {
  value     = var.db_count > 0 ? azurerm_mssql_server.sql[0].name : ""
  sensitive = false
}

output "sql_admin_username" {
  value = var.sql_admin_username
}

output "sql_admin_password" {
  value     = local.sql_admin_password_final
  sensitive = true
}

output "sql_databases" {
  value = var.db_count > 0 ? [for d in azurerm_mssql_database.db : d.name] : []
}
