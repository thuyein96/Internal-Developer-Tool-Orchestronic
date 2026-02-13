// "use client"

// import { useQuery } from "@tanstack/react-query"
// import { getComments } from "@/app/api/requests/api"

// export default function Comments() {
//   const { data, isLoading, error } = useQuery({
//     queryKey: ["posts-comments"],
//     queryFn: () => getComments(),
//   })

//   if (isLoading) return <p>Loading...</p>
//   if (error) return <p>Error loading comments</p>

//   return (
//     <ul>{data?.map((comment) => <li key={comment.id}>{comment.text}</li>)}</ul>
//   )
// }
