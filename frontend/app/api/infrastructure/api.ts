import { fetcher } from "@/lib/fetcher"

export async function getInfrastructureSummary() {
  return await fetcher(`${process.env.NEXT_PUBLIC_API_URL}/infrastructure`)
}
