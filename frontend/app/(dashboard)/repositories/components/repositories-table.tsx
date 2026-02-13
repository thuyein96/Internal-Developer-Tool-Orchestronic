"use client"

import { DataTable } from "@/components/data-table/components/data-table"
import { columnsRepositories } from "./columns-repositories"
import { getRepositories } from "@/app/api/repository/api"
import { useQuery } from "@tanstack/react-query"
import { extractGitlabUsername, getUser } from "@/app/api/user/api"
import { RepositoryStatus } from "@/types/repo"
import { useRouter } from "next/navigation"
import DataTableSkeleton from "../../requests/components/data-table-skeleton"

interface RepositoriesTableProps {
  pageSize?: number
}

export default function RepositoriesTable({
  pageSize = 10,
}: RepositoriesTableProps) {
  const router = useRouter()
  const { data: session } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ["repositories"],
    queryFn: getRepositories,
  })

  if (isLoading) return <DataTableSkeleton />
  if (error) return <p>Error loading table</p>

  const columns = columnsRepositories(session?.role)
  const gitlabUsername = extractGitlabUsername(session?.gitlabUrl ?? null)

  return (
    <DataTable
      data={data ?? []}
      columns={columns}
      filterColumn="name"
      pageSize={pageSize}
      onRowClick={(row) => {
        if (row.status === RepositoryStatus.Created) {
          const username = gitlabUsername || "root"
          return window.open(
            `${process.env.NEXT_PUBLIC_GITLAB_DIR}/${username}/${row.name}`,
            "_blank",
            "noopener,noreferrer"
          )
        } else {
          return router.push(`/repositories-not-created`)
        }
      }}
    />
  )
}
