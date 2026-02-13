"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ClusterDetail } from "@/app/api/requests/api"

export const getColumnsClusterDetails = (): ColumnDef<ClusterDetail>[] => [
  {
    accessorKey: "clusterName",
    header: "Cluster Name",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("clusterName")}</div>
    },
  },
  {
    accessorKey: "nodeCount",
    header: "Node Count",
    cell: ({ row }) => {
      return <div>{row.getValue("nodeCount")}</div>
    },
  },
  {
    accessorKey: "nodeSize",
    header: "Node Size",
    cell: ({ row }) => {
      return <div className="font-mono text-sm">{row.getValue("nodeSize")}</div>
    },
  },
  {
    accessorKey: "kubeConfig",
    header: "Status",
    cell: ({ row }) => {
      const kubeConfig = row.getValue("kubeConfig")
      return (
        <Badge variant={kubeConfig ? "default" : "secondary"}>
          {kubeConfig ? "Configured" : "Pending"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      return <div>{format(date, "MMM dd, yyyy HH:mm")}</div>
    },
  },
]