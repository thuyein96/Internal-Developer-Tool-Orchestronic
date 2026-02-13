"use client"

import { DataTable } from "@/components/data-table/components/data-table"
import { getColumnsClusterDetails } from "./columns-cluster-details"
import { useQuery } from "@tanstack/react-query"
import { getClusterResources } from "@/app/api/requests/api"
import DataTableSkeleton from "../../requests/components/data-table-skeleton"

interface ClusterDetailsTableProps {
  clusterId: string
  pageSize?: number
}

export default function ClusterDetailsTable({
  clusterId,
  pageSize = 10,
}: ClusterDetailsTableProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["cluster-resources", clusterId],
    queryFn: () => getClusterResources(clusterId),
  })

  if (isLoading) return <DataTableSkeleton />
  if (error) return <p>Error loading cluster details</p>

  const columns = getColumnsClusterDetails()

  return (
    <DataTable
      data={data ?? []}
      columns={columns}
      filterColumn="clusterName"
      pageSize={pageSize}
    />
  )
}
