import { fetcher } from "@/lib/fetcher"

export default async function checkRepositoryAvailability(name: string) {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/repositories/available-repository?name=${encodeURIComponent(name)}`
  )
}

export async function getResources() {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/resource`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
}
