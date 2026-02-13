"use client"

import { DataTable } from "@/components/data-table/components/data-table"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  getClustersByStatus,
  getUserClustersByStatus,
  ClusterResource,
} from "@/app/api/requests/api"
import DataTableSkeleton from "../../requests/components/data-table-skeleton"
import { getColumnsClusters } from "./column-clusters"
import { getUser } from "@/app/api/user/api"
import { Role } from "@/types/role"
import { Status } from "@/types/api"
import { useEffect } from "react"

interface ClustersTableProps {
  pageSize?: number
}

// Extended type to include status
type ClusterResourceWithStatus = ClusterResource & { status: Status }

export default function ClustersTable({ pageSize = 10 }: ClustersTableProps) {
  const router = useRouter()

  // Fetch user session to determine role
  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  })

  // Check if user is Admin or IT
  const isAdminOrIT = session?.role === Role.Admin || session?.role === Role.IT

  // Fetch ALL clusters (we'll let the DataTable filter by status)
  const { data, isLoading, error } = useQuery({
    queryKey: ["clusters", "all", isAdminOrIT],
    queryFn: async () => {
      console.log("Fetching all clusters:", {
        isAdminOrIT,
        role: session?.role,
      })

      // Fetch clusters for all statuses
      const allClusters: ClusterResourceWithStatus[] = []

      for (const status of Object.values(Status)) {
        const clusters = isAdminOrIT
          ? await getClustersByStatus(status)
          : await getUserClustersByStatus(status)

        // Inject status into each cluster object
        const clustersWithStatus = clusters.map((cluster) => ({
          ...cluster,
          status: status,
        })) as ClusterResourceWithStatus[]

        allClusters.push(...clustersWithStatus)
      }

      console.log("All clusters received:", allClusters)

      return allClusters
    },
    enabled: !!session, // Only fetch when session is available
  })

  // Debug effect
  useEffect(() => {
    console.log("Table render state:", {
      isLoadingSession,
      isLoading,
      error,
      dataLength: data?.length,
      data: data,
      session,
      isAdminOrIT,
    })
  }, [isLoadingSession, isLoading, error, data, session, isAdminOrIT])

  if (isLoadingSession || isLoading) return <DataTableSkeleton />
  if (error) {
    console.error("Error loading clusters:", error)
    return <p>Error loading clusters: {error.message}</p>
  }

  const columns = getColumnsClusters()

  return (
    <div className="space-y-4">
      {/* Debug info */}
      <div className="text-xs text-gray-500">
        Role: {session?.role} | Admin/IT: {isAdminOrIT ? "Yes" : "No"} |
        Clusters: {data?.length || 0}
      </div>

      {/* Data Table with built-in status filter */}
      <DataTable
        prefilterStatus={false}
        data={data ?? []}
        columns={columns}
        filterColumn="name"
        pageSize={pageSize}
        onRowClick={(row) => {
          if (isAdminOrIT) {
            router.push(`/clusters/pending-clusters/${row.id}`)
          } else {
            router.push(`/clusters/${row.id}`)
          }
        }}
      />
    </div>
  )
}
