"use client"
import { ColumnDef } from "@tanstack/react-table"
import { ClusterResource } from "@/app/api/requests/api"
import { Cloud, MapPin, CheckCircle2, Clock, XCircle } from "lucide-react"
import { Status } from "@/types/api"

export const getColumnsClusters = (): ColumnDef<ClusterResource>[] => [
  {
    accessorKey: "name",
    header: "Cluster Name",
    cell: ({ row }) => {
      const name = row.getValue("name") as string
      console.log("Rendering name:", name, "Full row:", row.original)
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{name || "N/A"}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "cloudProvider",
    header: "Provider",
    cell: ({ row }) => {
      const provider = row.getValue("cloudProvider") as string
      console.log("Rendering provider:", provider)
      
      const providerConfig = {
        AZURE: {
          gradient: "from-blue-500 to-cyan-500",
          bgColor: "bg-blue-50 dark:bg-blue-950/30",
          textColor: "text-blue-700 dark:text-blue-300",
          borderColor: "border-blue-200 dark:border-blue-800",
        },
        AWS: {
          gradient: "from-orange-500 to-amber-500",
          bgColor: "bg-orange-50 dark:bg-orange-950/30",
          textColor: "text-orange-700 dark:text-orange-300",
          borderColor: "border-orange-200 dark:border-orange-800",
        },
      }

      const config =
        providerConfig[provider as keyof typeof providerConfig] ||
        providerConfig.AZURE

      return (
        <div
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 ${config.bgColor} ${config.borderColor}`}
        >
          <div
            className={`flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br ${config.gradient} shadow-sm`}
          >
            <Cloud className="h-3 w-3 text-white" />
          </div>
          <span className={`text-sm font-semibold ${config.textColor}`}>
            {provider || "N/A"}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "region",
    header: "Region",
    cell: ({ row }) => {
      const region = row.getValue("region") as string
      console.log("Rendering region:", region)
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{region || "N/A"}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as Status
      console.log("Rendering status:", status)
      
      const config = {
        Approved: {
          icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
          text: "text-green-700",
        },
        Pending: {
          icon: <Clock className="h-4 w-4 text-yellow-600" />,
          text: "text-yellow-700",
        },
        Rejected: {
          icon: <XCircle className="h-4 w-4 text-red-600" />,
          text: "text-red-700",
        },
        Deleted: {
          icon: <XCircle className="h-4 w-4 text-gray-600" />,
          text: "text-gray-700",
        },
      }[status]

      if (!config) return <span>N/A</span>

      return (
        <div className={`flex items-center gap-2 font-medium ${config.text}`}>
          {config.icon}
          {status}
        </div>
      )
    },
  },
]