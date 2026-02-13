"use client"

import { fetcher } from "@/lib/fetcher"
import { GitlabUser, User } from "@/types/api"
import { Role } from "@/types/role"

const API_BASE = process.env.NEXT_PUBLIC_API_URL

export async function getUserByEmail(email: string): Promise<User> {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/user/by-email?email=${encodeURIComponent(email)}`
  )
}

export async function fuzzyFindUsersByEmail(email: string): Promise<User[]> {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/user/fuzzy-find-by-email?email=${encodeURIComponent(email)}`
  )
}

// export async function getAllUsers(): Promise<GitlabUser[]> {
//   return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/gitlab/users`, {
//     headers: { "Content-Type": "application/json" },
//   })
// }

export async function getAllUsers(): Promise<GitlabUser[]> {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/gitlab/users`)
}

export async function createUser(user: User) {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: user.name,
      email: user.email,
      role: Role.Developer,
    }),
  })
}

export async function getUser(): Promise<User | undefined> {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/user/me`, {
    headers: { "Content-Type": "application/json" },
  })
}

export async function updateGitLabUrl(gitlabUrl: string): Promise<User> {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/user/me/gitlab-url`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gitlabUrl }),
  })
}

export async function getGitLabUrl(): Promise<string | null> {
  const res = await fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/user/me/gitlab-url`
  )
  return res.gitlabUrl ?? null
}

export function extractGitlabUsername(url: string | null): string | null {
  if (!url) return null
  try {
    const parts = url.split("/")
    return parts.pop() || null
  } catch {
    return null
  }
}

export async function getGitlabUsers(): Promise<GitlabUser[]> {
  const res = await fetch(`${API_BASE}/gitlab/users`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("Failed to fetch users")
  }

  return res.json()
}

export async function approveGitlabUser(id: number) {
  const res = await fetch(`${API_BASE}/gitlab/users/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || "Failed to approve user")
  }

  return res.text()
}

export async function rejectGitlabUser(id: number) {
  const res = await fetch(`${API_BASE}/gitlab/users/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || "Failed to reject user")
  }

  return res.text()
}
