"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconBuilding } from "@tabler/icons-react"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { Repository } from "@/app/(dashboard)/repositories/data/schema-repository"
import Link from "next/link"
import { RepositoryStatus } from "@/types/repo"
import { AwsRequestDetail, AzureRequestDetail } from "@/types/request"
import { Spinner } from "@/components/ui/spinner"
import { extractGitlabUsername, getUser } from "@/app/api/user/api"
import { useQuery } from "@tanstack/react-query"

export default function OrganizationCard({
  data,
}: {
  data?: AwsRequestDetail | AzureRequestDetail
}) {
  const { data: session } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  })

  const gitlabUsername = extractGitlabUsername(session?.gitlabUrl ?? null)
  const username = gitlabUsername || "root"

  const repoUrl =
    data?.repository?.status === RepositoryStatus.Created
      ? `${process.env.NEXT_PUBLIC_GITLAB_DIR}/${username}/${data?.repository?.name}`
      : `/repositories-not-created`

  const isExternal = data?.repository?.status === RepositoryStatus.Created

  return (
    <Card>
      <CardHeader>
        <CardTitle className=" text-xl font-bold tracking-tight">
          <p className="flex items-center gap-1">
            <IconBuilding />
            Organization
          </p>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 items-center">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Name
            </Label>
            <p>{data?.owner?.name}</p>
          </div>
          <div>
            {data?.status === "Approved" &&
            data?.repository?.status === RepositoryStatus.Pending ? (
              <p className="text-sm text-muted-foreground">
                <Spinner size="small" className="mr-2 ">
                  Creating Repository...
                </Spinner>
              </p>
            ) : (
              <Link
                className="cursor-pointer hover:underline w-fit"
                href={repoUrl}
                target={isExternal ? "_blank" : "_self"}
                rel={isExternal ? "noopener noreferrer" : undefined}
              >
                <Label className="text-sm font-medium text-muted-foreground cursor-pointer">
                  Repository
                </Label>
                <p className="truncate">{data?.repository?.name}</p>
              </Link>
            )}
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Email
            </Label>
            <p>{data?.owner?.email}</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-1">
              Collaborators
            </Label>
            <div className="flex gap-2">
              {data?.repository.RepositoryCollaborator?.length ? (
                data.repository.RepositoryCollaborator.map(
                  (
                    initial: Repository["RepositoryCollaborator"][number],
                    index: number
                  ) => (
                    <TooltipProvider key={initial.user.id ?? index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {getInitials(initial.user.name)}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>{initial.user.name}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                )
              ) : (
                <p className="">-</p>
              )}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Role
            </Label>
            <p>{data?.owner?.role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
