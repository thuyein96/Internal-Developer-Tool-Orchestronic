import { getRequests } from "@/app/api/requests/api"
import {
  getClustersByStatus,
  getUserClustersByStatus,
} from "@/app/api/requests/api"
import { getUser } from "@/app/api/user/api"
import RequestsTable from "./components/requests-table"
import ClustersTable from "../clusters/components/clusters-table"
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import { RequestButton } from "./components/request-button"
import { cookies } from "next/headers"
import { Role } from "@/types/role"
import { Status } from "@/types/api"

async function getUserRole(): Promise<Role | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value
  if (!token) return null
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    )
    return payload.role as Role
  } catch {
    return null
  }
}

export default async function Page() {
  const queryClient = new QueryClient()
  const userRole = await getUserRole()
  const isAdminOrIT = userRole === Role.Admin || userRole === Role.IT
  const defaultStatus: Status = Status.Approved

  await queryClient.prefetchQuery({
    queryKey: ["user"],
    queryFn: getUser,
  })

  await queryClient.prefetchQuery({
    queryKey: ["requests"],
    queryFn: getRequests,
  })

  await queryClient.prefetchQuery({
    queryKey: ["clusters", defaultStatus, isAdminOrIT],
    queryFn: async () => {
      const clusters = isAdminOrIT
        ? await getClustersByStatus(defaultStatus)
        : await getUserClustersByStatus(defaultStatus)

      return clusters.map((cluster) => ({
        ...cluster,
        status: defaultStatus,
      }))
    },
  })

  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-6 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Requests</h2>
          <p className="text-muted-foreground">
            Here&apos;s a list of your requests!
          </p>
        </div>
        <RequestButton />
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <RequestsTable pageSize={10} />
      </HydrationBoundary>

      <div className="flex items-center justify-between space-y-2 pt-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clusters</h2>
          <p className="text-muted-foreground">
            {isAdminOrIT
              ? "View and manage all clusters. Use filters to view by status."
              : "Here's a list of your clusters. Use filters to view by status."}
          </p>
        </div>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ClustersTable pageSize={10} />
      </HydrationBoundary>
    </div>
  )
}
