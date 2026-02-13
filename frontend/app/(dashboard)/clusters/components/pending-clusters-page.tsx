"use client"

import { DataTable } from "@/components/data-table/components/data-table"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { getPendingClusters } from "@/app/api/requests/api"
import DataTableSkeleton from "../../requests/components/data-table-skeleton"
import { getColumnsClusters } from "./column-clusters"

interface PendingClustersTableProps {
  pageSize?: number
}

export default function PendingClustersTable({
  pageSize = 10,
}: PendingClustersTableProps) {
  const router = useRouter()

  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-clusters"],
    queryFn: getPendingClusters,
  })

  if (isLoading) return <DataTableSkeleton />
  if (error) return <p>Error loading pending clusters</p>

  const columns = getColumnsClusters()

  return (
    <DataTable
      data={data ?? []}
      columns={columns}
      filterColumn="name"
      pageSize={pageSize}
      onRowClick={(row) => router.push(`/clusters/pending-clusters/${row.id}`)}
    />
  )
}
