"use client"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
// import { generateRepoName } from "@/lib/utils"

import ClientRequestForm from "@/components/requests/client-request-form"
import { useQuery } from "@tanstack/react-query"
import { getUser } from "@/app/api/user/api"
import ClientRequestFormSkeleton from "../components/client-request-form-skeleton"

export default function Page() {
  // const suggestedName = generateRepoName()
  const {
    data: session,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  })

  if (isLoading) {
    return <ClientRequestFormSkeleton />
  }

  if (error) {
    return <div>Error fetching user data</div>
  }

  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-6 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/requests">Requests</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Create Request</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h2 className="text-2xl font-bold tracking-tight">Create Request</h2>
        </div>
      </div>
      <div className="grid gap-6">
        <ClientRequestForm
          session={session}
          // suggestedName={suggestedName}
        />
      </div>
    </div>
  )
}
