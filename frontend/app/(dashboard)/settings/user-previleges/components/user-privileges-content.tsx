"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Role } from "@/types/role"
import { getUsers, updateUserRole } from "@/app/api/users/api"

interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
  updatedAt: string
}

const roleColors: Record<string, string> = {
  Admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Developer:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  IT: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
}

const roleOptions = [
  { value: Role.Admin },
  { value: Role.Developer },
  { value: Role.IT },
]

export default function UserPrivilegesContent() {
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, Role>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const queryClient = useQueryClient()

  const {
    data: users,
    isLoading,
    error,
  } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: getUsers,
  })

  // Filter and group users
  const groupedUsers = useMemo(() => {
    if (!users) return {}

    // Filter users based on search query
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Group by role
    const grouped = filtered.reduce(
      (acc, user) => {
        const role = user.role
        if (!acc[role]) {
          acc[role] = []
        }
        acc[role].push(user)
        return acc
      },
      {} as Record<Role, User[]>
    )

    return grouped
  }, [users, searchQuery])

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setPendingUpdates({})
    },
    onError: (error) => {
      console.error("Failed to update user role:", error)
    },
  })

  const handleRoleChange = (userId: string, newRole: Role) => {
    setPendingUpdates((prev) => ({
      ...prev,
      [userId]: newRole,
    }))
  }

  const saveChanges = (role?: Role) => {
    const updatesToSave = role
      ? Object.fromEntries(
          Object.entries(pendingUpdates).filter(([userId]) => {
            const user = users?.find((u) => u.id === userId)
            return user?.role === role
          })
        )
      : pendingUpdates

    Object.entries(updatesToSave).forEach(([userId, newRole]) => {
      updateRoleMutation.mutate({ userId, role: newRole })
    })
  }

  const cancelChanges = (role?: Role) => {
    if (role) {
      setPendingUpdates((prev) => {
        const filtered = Object.fromEntries(
          Object.entries(prev).filter(([userId]) => {
            const user = users?.find((u) => u.id === userId)
            return user?.role !== role
          })
        )
        return filtered
      })
    } else {
      setPendingUpdates({})
    }
  }

  const hasChangesForRole = (role: Role) => {
    return Object.keys(pendingUpdates).some((userId) => {
      const user = users?.find((u) => u.id === userId)
      return user?.role === role
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <Skeleton className="h-8 w-[100px] ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>Error loading users: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users by Role Groups */}
      {(Object.entries(groupedUsers) as [Role, User[]][]).map(
        ([role, roleUsers]) => {
          const roleHasChanges = hasChangesForRole(role)

          return (
            <Card key={role}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CardTitle>
                    {role} ({roleUsers.length})
                  </CardTitle>
                  <Badge className={roleColors[role]} variant="secondary">
                    {role}
                  </Badge>
                </div>
                {roleHasChanges && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelChanges(role)}
                      disabled={updateRoleMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveChanges(role)}
                      disabled={updateRoleMutation.isPending}
                    >
                      {updateRoleMutation.isPending
                        ? "Saving..."
                        : "Save Changes"}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Change Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roleUsers.map((user: User) => {
                      const pendingRole = pendingUpdates[user.id]
                      const currentRole = pendingRole || user.role
                      const hasChanged =
                        pendingRole && pendingRole !== user.role

                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>
                                  {user.name
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={currentRole}
                              onValueChange={(value: Role) =>
                                handleRoleChange(user.id, value)
                              }
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {roleOptions.map((role) => (
                                  <SelectItem
                                    key={role.value}
                                    value={role.value}
                                  >
                                    {role.value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {hasChanged ? (
                              <Badge
                                variant="outline"
                                className="text-orange-600"
                              >
                                Modified
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-green-600"
                              >
                                Current
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        }
      )}

      {/* No results message */}
      {Object.keys(groupedUsers).length === 0 && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>No users found matching your search criteria.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
