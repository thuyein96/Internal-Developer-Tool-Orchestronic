"use client"

import { ColumnDef } from "@tanstack/react-table"

import { DataTableColumnHeader } from "@/components/data-table/components/data-table-column-header"
import { getInitials, haveAdminOrIT } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Repository } from "../data/schema-repository"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Role } from "@/types/role"

export const columnsRepositories = (
  userRole?: Role
): ColumnDef<Repository>[] => {
  const columns: ColumnDef<Repository>[] = [
    {
      accessorKey: "name",
      meta: {
        title: "Repository",
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Repository" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <span className="">{row.getValue("name")}</span>
          </div>
        )
      },
    },
  ]
  // Conditionally add Owner column for Admin/IT users
  if (haveAdminOrIT(userRole)) {
    columns.push({
      accessorKey: "request",
      meta: {
        title: "Owner",
      },
      header: ({ column }) => {
        return <DataTableColumnHeader column={column} title="Owner" />
      },
      cell: ({ row }) => {
        const request = row.getValue("request") as Repository["request"]

        return (
          <div className="flex space-x-2">
            <span className="">{request.owner.name}</span>
          </div>
        )
      },
    })
  }
  columns.push(
    {
      accessorKey: "RepositoryCollaborator",
      meta: {
        title: "Collaborators",
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Collaborators" />
      ),
      cell: ({ row }) => {
        const initials = row.getValue(
          "RepositoryCollaborator"
        ) as Repository["RepositoryCollaborator"]

        if (initials.length === 0) return <span className="">-</span>

        return (
          <div className="flex space-x-2">
            {initials.map((initial, index) => (
              <TooltipProvider key={`${index}_${initial}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-8 w-8">
                      {/* <AvatarImage src="/avatars/03.png" alt={initial} /> */}
                      <AvatarFallback>
                        {getInitials(initial.user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>{initial.user.name}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => {
        const description = row.getValue("description")
        if (!description) return <span className="">-</span>
        return (
          <div className="flex space-x-2">
            <span className="">{row.getValue("description")}</span>
          </div>
        )
      },
    }
  )
  return columns
}
