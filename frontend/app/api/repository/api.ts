"use client"
import { fetcher } from "@/lib/fetcher"

export default async function checkRepositoryAvailability(name: string) {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/repositories/available-repository?name=${encodeURIComponent(name)}`,
    {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}

export async function getRepositories() {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/repositories`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
}
