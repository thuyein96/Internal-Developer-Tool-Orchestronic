"use client"

import { ColumnDef } from "@tanstack/react-table"

import { statuses } from "../data/data"
import { Request } from "../data/schema-request"
import { DataTableColumnHeader } from "@/components/data-table/components/data-table-column-header"
import { cn, haveAdminOrIT } from "@/lib/utils"
import { format } from "date-fns"
import { Role } from "@/types/role"

export const getColumnsRequests = (userRole?: Role): ColumnDef<Request>[] => {
  const columns: ColumnDef<Request>[] = [
    {
      accessorKey: "displayCode",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Request" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px] truncate">{row.getValue("displayCode")}</div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ]

  // Conditionally add Owner column for Admin/IT users
  if (haveAdminOrIT(userRole)) {
    columns.push({
      accessorKey: "owner",
      header: ({ column }) => {
        return <DataTableColumnHeader column={column} title="Owner" />
      },
      cell: ({ row }) => {
        const owner = row.getValue("owner") as Request["owner"]

        return (
          <div className="flex space-x-2">
            <span className="">{owner.name}</span>
          </div>
        )
      },
    })
  }

  columns.push(
    {
      accessorKey: "createdAt",
      meta: {
        title: "Date",
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        const formatted = format(
          new Date(row.getValue("createdAt")),
          "EEE, dd MMM yyyy, HH:mm"
        )
        return (
          <div className="flex space-x-2">
            <span className="">{formatted}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "resources",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Resources" />
      ),
      cell: ({ row }) => {
        const resources = row.getValue("resources") as Request["resources"]

        return (
          <div className="flex space-x-2">
            <span className="">{resources.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "repository",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Repository" />
      ),
      cell: ({ row }) => {
        const repository = row.getValue("repository") as Request["repository"]

        return (
          <div className="flex space-x-2">
            <span className="">{repository.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = statuses.find(
          (status) => status.value === row.getValue("status")
        )

        if (!status) {
          return null
        }

        return (
          <div className="flex w-[100px] items-center">
            {status.icon && (
              <status.icon className={cn("mr-2 h-4 w-4", status.color)} />
            )}
            <span>{status.label}</span>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    }
  )

  return columns
}

// Keep the old export for backward compatibility
export const columnsRequests = getColumnsRequests()
