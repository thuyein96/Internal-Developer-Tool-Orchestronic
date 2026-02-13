"use client"

import { Button } from "@/components/ui/button"
import { GitlabUser } from "@/types/api"

export function PendingUsersTable({
  users,
  onApprove,
  onReject,
}: {
  users: GitlabUser[]
  onApprove: (user: GitlabUser) => void
  onReject: (user: GitlabUser) => void
}) {
  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted">
          <tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Email</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.length === 0 && (
            <tr>
              <td
                className="px-4 py-6 text-center text-muted-foreground"
                colSpan={4}
              >
                No pending users.
              </td>
            </tr>
          )}

          {users.map((u) => (
            <tr key={u.id} className="border-b">
              <td className="px-4 py-2">{u.name}</td>
              <td className="px-4 py-2">{u.email}</td>
              <td className="px-4 py-2 capitalize">
                {u.state.replaceAll("_", " ")}
              </td>
              <td className="px-4 py-2 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReject(u)}
                >
                  Reject
                </Button>
                <Button size="sm" onClick={() => onApprove(u)}>
                  Approve
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}