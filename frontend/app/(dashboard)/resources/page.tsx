import ResourcesTable from "./components/resources-table"
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import { getResources } from "@/app/api/resources/api"

export default async function Page() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ["resources"],
    queryFn: getResources,
  })

  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-6 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Resources</h2>
          <p className="text-muted-foreground">
            Here&apos;s a list of your resources!
          </p>
        </div>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ResourcesTable pageSize={10} />
      </HydrationBoundary>
    </div>
  )
}
