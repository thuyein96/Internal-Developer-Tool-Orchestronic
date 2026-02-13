"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardHeader } from "@/components/ui/card"
import { getInitials } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { getUser } from "@/app/api/user/api"
import { useQuery } from "@tanstack/react-query"

export default function Page() {
  const {
    data: session,
    isLoading: isLoadingUser,
    error: errorUser,
  } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  })

  if (isLoadingUser) {
    return <div>Loading...</div>
  }

  if (errorUser) {
    return <div>Error fetching user data</div>
  }

  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-6 md:flex">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        <p className="text-muted-foreground">
          Here&apos;s your account information!
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" alt={session?.name} />
              <AvatarFallback className="text-lg">
                {getInitials(session?.name || "")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{session?.name}</h2>
              <p className="text-muted-foreground">{session?.email}</p>
              <Badge variant="default">{session?.role}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}
