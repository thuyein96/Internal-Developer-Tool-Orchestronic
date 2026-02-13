// // app/posts/page.tsx
// import {
//   dehydrate,
//   HydrationBoundary,
//   QueryClient,
// } from "@tanstack/react-query"
// import Posts from "./posts"
// import CommentsServerComponent from "./comments-server"
// import { getPosts } from "@/app/api/requests/api"

// export default async function Page() {
//   const queryClient = new QueryClient()

//   await queryClient.prefetchQuery({
//     queryKey: ["posts"],
//     queryFn: getPosts,
//   })

//   return (
//     <HydrationBoundary state={dehydrate(queryClient)}>
//       <Posts />
//       <CommentsServerComponent />
//     </HydrationBoundary>
//   )
// }
