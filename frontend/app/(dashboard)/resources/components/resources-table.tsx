"use client"

import { DataTable } from "@/components/data-table/components/data-table"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { getResources } from "@/app/api/resources/api"
import { columnsResources } from "./columns-resources"
import DataTableSkeleton from "../../requests/components/data-table-skeleton"

interface ResourcesTableProps {
  pageSize?: number
}

export default function ResourcesTable({ pageSize = 10 }: ResourcesTableProps) {
  const router = useRouter()

  const { data, isLoading, error } = useQuery({
    queryKey: ["resources"],
    queryFn: getResources,
  })

  if (isLoading) return <DataTableSkeleton />
  if (error) return <p>Error loading table</p>

  return (
    <DataTable
      data={data ?? []}
      columns={columnsResources}
      filterColumn="name"
      pageSize={pageSize}
      onRowClick={(row) => router.push(`/requests/${row.request.displayCode}`)}
    />
  )
}
