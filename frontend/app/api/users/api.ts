"use client"
import { fetcher } from "@/lib/fetcher"
import { Role } from "@/types/role"

export async function getUsers() {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
    headers: { "Content-Type": "application/json" },
  })
}

export async function updateUserRole(id: string, role: Role) {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/user/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, role }),
  })
}
