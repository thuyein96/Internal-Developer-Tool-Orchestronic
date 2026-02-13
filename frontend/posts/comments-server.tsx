// // app/posts/comments-server.tsx
// import {
//   dehydrate,
//   HydrationBoundary,
//   QueryClient,
// } from "@tanstack/react-query"
// import { getComments } from "@/app/api/requests/api"
// import Comments from "./comments"

// export default async function CommentsServerComponent() {
//   const queryClient = new QueryClient()

//   await queryClient.prefetchQuery({
//     queryKey: ["posts-comments"],
//     queryFn: getComments,
//   })

//   return (
//     <HydrationBoundary state={dehydrate(queryClient)}>
//       <Comments />
//     </HydrationBoundary>
//   )
// }
