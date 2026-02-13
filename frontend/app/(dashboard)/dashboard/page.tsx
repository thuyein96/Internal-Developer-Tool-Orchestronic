"use client"

import RepositoriesTable from "@/app/(dashboard)/repositories/components/repositories-table"

import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"
import Link from "next/link"
import RequestsTable from "@/app/(dashboard)/requests/components/requests-table"

export default function Page() {
  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 p-6 md:flex">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
            <p className="text-muted-foreground">
              Here&apos;s a list of your requests!
            </p>
          </div>
          <Button asChild>
            <Link href="/requests/create">
              <IconPlus /> Request
            </Link>
          </Button>
        </div>
        <RequestsTable pageSize={5} prefilterStatus={true} />
      </div>

      <div className="hidden h-full flex-1 flex-col space-y-8 p-6 md:flex">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Repositories</h2>
            <p className="text-muted-foreground">
              Here&apos;s a list of your GitLab repositories
            </p>
          </div>
        </div>
        <RepositoriesTable pageSize={5} />
      </div>
    </>
  )
}
