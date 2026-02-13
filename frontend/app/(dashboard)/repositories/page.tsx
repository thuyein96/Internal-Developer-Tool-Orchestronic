import { getRepositories } from "@/app/api/repository/api"
import RepositoriesTable from "./components/repositories-table"
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"

export default async function Page() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ["repositories"],
    queryFn: getRepositories,
  })

  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-6 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Repositories</h2>
          <p className="text-muted-foreground">
            Here&apos;s a list of your GitLab repositories!
          </p>
        </div>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <RepositoriesTable pageSize={10} />
      </HydrationBoundary>
    </div>
  )
}
