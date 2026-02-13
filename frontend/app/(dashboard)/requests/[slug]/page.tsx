import { getRequestBySlug } from "@/app/api/requests/api"
import RequestDetail from "@/components/requests/[slug]/request-detail"

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ["request", slug],
    queryFn: () => getRequestBySlug(slug),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RequestDetail slug={slug} />
    </HydrationBoundary>
  )
}
