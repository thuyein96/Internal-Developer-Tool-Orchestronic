"use client"

import { DataTable } from "@/components/data-table/components/data-table"
import { useRouter } from "next/navigation"
import { getColumnsRequests } from "./columns-requests"
import { getRequests } from "@/app/api/requests/api"
import { useQuery } from "@tanstack/react-query"
import { getUser } from "@/app/api/user/api"
import { Role } from "@/types/role"
import DataTableSkeleton from "./data-table-skeleton"

interface RequestsTableProps {
  prefilterStatus?: boolean
  pageSize?: number
}

export default function RequestsTable({
  prefilterStatus = false,
  pageSize = 10,
}: RequestsTableProps) {
  const router = useRouter()

  const {
    data: session,
    isLoading: isLoadingSession,
    error: errorSession,
  } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ["requests"],
    queryFn: getRequests,
  })

  if (isLoadingSession) return <DataTableSkeleton />
  if (errorSession) return <p>Error loading user session</p>

  if (isLoading) return <DataTableSkeleton />
  if (error) return <p>Error loading table</p>

  const columns = getColumnsRequests(session?.role as Role)

  return (
    <DataTable
      prefilterStatus={prefilterStatus}
      data={data ?? []}
      columns={columns}
      filterColumn="displayCode"
      pageSize={pageSize}
      onRowClick={(row) => router.push(`/requests/${row.displayCode}`)}
    />
  )
}
