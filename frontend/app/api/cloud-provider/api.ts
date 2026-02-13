import { fetcher } from "@/lib/fetcher"
import { Engine } from "@/types/resource"

interface getDBInstanceClassesResponse {
  id: string
  DBInstanceClass: string
  engine: Engine
  raw: JSON
  MinStorageSize: number
  MaxStorageSize: number
}

export async function getDBInstanceClasses({
  search,
  page,
  limit,
  minStorageSize,
  maxStorageSize,
  engine,
}: {
  search?: string
  page?: number
  limit?: number
  minStorageSize?: number
  maxStorageSize?: number
  engine?: Engine
}): Promise<getDBInstanceClassesResponse[]> {
  const params = new URLSearchParams({
    page: page?.toString() || "",
    limit: limit?.toString() || "",
  })

  if (minStorageSize) params.append("minStorageSize", minStorageSize.toString())
  if (maxStorageSize) params.append("maxStorageSize", maxStorageSize.toString())
  if (engine) params.append("engine", engine)
  if (search) params.append("search", search)

  const response = await fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/cloud-providers/aws-db?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )

  return response.data
}
