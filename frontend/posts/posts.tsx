// // app/posts/posts.tsx
// "use client"

// import { getComments, getPosts } from "@/app/api/requests/api"
// import { useQuery } from "@tanstack/react-query"

// export default function Posts() {
//   // This useQuery could just as well happen in some deeper
//   // child to <Posts>, data will be available immediately either way
//   const { data, isLoading, error } = useQuery({
//     queryKey: ["posts"],
//     queryFn: () => getPosts(),
//   })

//   // This query was not prefetched on the server and will not start
//   // fetching until on the client, both patterns are fine to mix.
//   const { data: commentsData } = useQuery({
//     queryKey: ["posts-comments"],
//     queryFn: getComments,
//   })

//   if (isLoading) return <p>Loading...</p>
//   if (error) return <p>Error loading comments</p>

//   return <>{data?.map((each) => <p key={each.id}>{each.title}</p>)}</>
// }
