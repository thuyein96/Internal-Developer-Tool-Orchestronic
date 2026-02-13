import { Role } from "./role"

export type User = {
  id: string
  name: string
  email: string
  role: Role
  gitlabUrl?: string
  gitlabId?: number
}

export type GitlabUser = {
  id: number
  username: string
  name: string
  state: string
  avatar_url: string
  web_url: string
  email: string
}

export enum Status {
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
  Deleted = "Deleted",
}

export type UserState = {
  id: string
  name: string
  email: string
  role: Role
  iat: number
  exp: number
}
