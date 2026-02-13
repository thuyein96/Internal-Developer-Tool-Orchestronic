"use client"

import {
  approveGitlabUser,
  getGitlabUsers,
  rejectGitlabUser,
} from "@/app/api/user/api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PendingUsersTable } from "./components/pending-user-table"
import { GitlabUser } from "@/types/api"

export default function UsersPage() {
  const queryClient = useQueryClient()

  const {
    data: users = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["gitlab-users"],
    queryFn: getGitlabUsers,
  })

  const pendingUsers = users.filter(
    (u) => u.state === "blocked_pending_approval"
  )

  const approveMutation = useMutation<string, Error, GitlabUser>({
    mutationFn: (user) => approveGitlabUser(user.id),
    onSuccess: (_, user) => {
      alert(`${user.name} approved`)
      queryClient.invalidateQueries({ queryKey: ["gitlab-users"] })
    },
  })

  const rejectMutation = useMutation<string, Error, GitlabUser>({
    mutationFn: (user) => rejectGitlabUser(user.id),
    onSuccess: (_, user) => {
      alert(`${user.name} rejected`)
      queryClient.invalidateQueries({ queryKey: ["gitlab-users"] })
    },
  })

  return (
    <div className="flex w-full flex-col space-y-8 p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">
          Review accounts awaiting approval before they can access Orchestronic
          GitLab.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-muted rounded w-1/4" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      )}

      {isError && (
        <p className="text-red-500">Failed to load users. Please try again.</p>
      )}

      {!isLoading && !isError && (
        <PendingUsersTable
          users={pendingUsers}
          onApprove={(user) => approveMutation.mutate(user)}
          onReject={(user) => rejectMutation.mutate(user)}
        />
      )}
    </div>
  )
}
