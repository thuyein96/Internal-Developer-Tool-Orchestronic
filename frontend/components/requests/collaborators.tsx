"use client"

import { useState } from "react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { User } from "@/types/api"
import { useDebounce } from "@/hooks/useDebounce"
import { FieldValues, Path, PathValue, UseFormReturn } from "react-hook-form"
import { IconTrash } from "@tabler/icons-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { getUser } from "@/app/api/user/api"
import { getUsers } from "@/app/api/users/api"

interface CollaboratorsProps<T extends FieldValues> {
  form: UseFormReturn<T>
}

export default function Collaborators<T extends FieldValues>({
  form,
}: CollaboratorsProps<T>) {
  const [open, setOpen] = useState<boolean>(false)
  const [search, setSearch] = useState<string>("")
  const debouncedSearch = useDebounce(search, 500)

  const [selectedUsers, setSelectedUsers] = useState<
    Array<User & { gitlabUserId: number }>
  >([])

  // Authenticated user
  const {
    data: session,
    isLoading: isLoadingUser,
    error: errorUser,
  } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  })

  // Fetch all Orchestronic users
  const {
    data: localUsers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["localUsers"],
    queryFn: getUsers,
  })

  if (isLoadingUser) return <div>Loading...</div>
  if (errorUser) return <div>Error fetching user data</div>

  // Only users that are linked to GitLab
  const gitlabLinkedUsers: User[] =
    localUsers?.filter((u: User) => u.gitlabId && u.gitlabUrl) ?? []

  // Filter by search (name or email)
  const filteredUsers = gitlabLinkedUsers.filter((u) => {
    if (!debouncedSearch.trim()) return true
    const lower = debouncedSearch.toLowerCase()
    return (
      u.name.toLowerCase().includes(lower) ||
      u.email.toLowerCase().includes(lower)
    )
  })

  // Optionally hide the current logged-in user from the list
  const currentUserId = session?.id
  const availableUsers = filteredUsers.filter((u) => u.id !== currentUserId)

  // Select collaborator
  function handleUserSelect(user: User) {
    if (!user.gitlabId) {
      console.error("Selected user does not have gitlabId")
      return
    }

    setSelectedUsers((prev) => {
      if (prev.some((u) => u.id === user.id)) return prev

      const updated = [...prev, { ...user, gitlabUserId: user.gitlabId! }]

      form.setValue(
        "repository.collaborators" as Path<T>,
        updated.map((u) => ({
          userId: u.id,
          gitlabUserId: u.gitlabUserId,
        })) as PathValue<T, Path<T>>
      )

      return updated
    })

    setOpen(false)
    setSearch("")
  }

  // Remove collaborator
  function handleRemoveUser(userId: string) {
    setSelectedUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId)

      form.setValue(
        "repository.collaborators" as Path<T>,
        updated.map((u) => ({
          userId: u.id,
          gitlabUserId: u.gitlabUserId,
        })) as PathValue<T, Path<T>>
      )

      return updated
    })
  }

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput
            placeholder="Search by name or email"
            onValueChange={(value) => setSearch(value)}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : error ? (
              <CommandEmpty>{(error as Error).message}</CommandEmpty>
            ) : availableUsers.length === 0 ? (
              <CommandEmpty>No users found.</CommandEmpty>
            ) : (
              availableUsers.map((user) => {
                if (selectedUsers.some((sel) => sel.id === user.id)) {
                  return null
                }

                return (
                  <CommandItem
                    key={user.id}
                    value={user.email}
                    className="cursor-pointer"
                    onSelect={() => handleUserSelect(user)}
                  >
                    {user.name} ({user.email})
                  </CommandItem>
                )
              })
            )}
          </CommandList>
        </Command>
      </CommandDialog>

      <Card>
        <CardHeader>
          <CardTitle>Collaborators</CardTitle>
          <CardDescription>
            Invite teammates to contribute to this repository.
          </CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(true)}
            >
              Add people
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          {selectedUsers.length > 0 ? (
            <div className="flex flex-col gap-3 mt-4">
              {selectedUsers.map((user) => (
                <div key={user.id} className="flex items-center">
                  <Avatar>
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>

                  <div className="ml-2 flex flex-1 flex-col text-sm">
                    {user.name}
                    <span className="text-muted-foreground text-xs">
                      {user.email}
                    </span>
                  </div>

                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveUser(user.id)}
                  >
                    <IconTrash />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm mt-4">
              No collaborators added yet.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  )
}
