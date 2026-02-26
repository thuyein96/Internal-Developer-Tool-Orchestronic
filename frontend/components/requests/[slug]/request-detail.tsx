"use client"

import Image from "next/image"
import {
  changeRequestStatus,
  deleteRequest,
  deploy,
  getAddressOfRepository,
  getRequestBySlug,
  getUserAllApprovedClusters,
  RequestStatusResponse,
  updateRequestFeedback,
} from "@/app/api/requests/api"
import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import ResourceGroupCard from "./resource-group-card"
import OrganizationCard from "./organization-card"
import { Role } from "@/types/role"
import DescriptionCard from "./description-card"
import { haveAdminOrIT, showDestroyButtonAfterCreation } from "@/lib/utils"
import {
  AlertDialog,

  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"
import { Status } from "@/types/api"
import { useState } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import FeedbackCard from "./feedback-card"
import { Textarea } from "@/components/ui/textarea"
import {
  MessageSquareText,
  Rocket,
  Cloud,
  Server,
  Database,
  HardDrive,
  Settings,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RequestPageSkeleton } from "./request-page-skeleton"
import { getUser } from "@/app/api/user/api"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
// import { RepositoryStatus } from "@/types/repo"
import { AwsRequestDetail, AzureRequestDetail } from "@/types/request"
import { CloudProvider } from "@/types/resource"

// const AirflowLogs = lazy(() => import("./airflow-logs"))

export default function RequestDetail({ slug }: { slug: string }) {
  const queryClient = useQueryClient()
  // const [showApprovePopup, setShowApprovePopup] = useState(false)
  const [showRejectPopup, setShowRejectPopup] = useState(false)
  const [feedback, setFeedback] = useState<string>("")

  const [deploymentOpen, setDeploymentOpen] = useState(false)
  const [selectedClusterId, setSelectedClusterId] = useState<string>("")
  const [deploymentPort, setDeploymentPort] = useState<string>("80")
  const [repoPrivate, setRepoPrivate] = useState(false)
  const [vmEnv, setVmEnv] = useState<string>("")
  const [storageEnv, setStorageEnv] = useState<string>("")
  const [dbEnv, setDbEnv] = useState<string>("")
  const [deployResult, setDeployResult] = useState<
    { type: "success" | "error"; message: string } | undefined
  >(undefined)
  const [hostedUrl, setHostedUrl] = useState<string | undefined>(undefined)
  const [deploymentInfo, setDeploymentInfo] = useState<{
    clusterId: string
    provider: CloudProvider
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const portNumber = Number.parseInt(deploymentPort, 10)
  const isPortValid =
    Number.isInteger(portNumber) && portNumber > 0 && portNumber <= 65535

  const { data, isLoading, error } = useQuery<
    AzureRequestDetail | AwsRequestDetail
  >({
    queryKey: ["request", slug],
    queryFn: () => getRequestBySlug(slug),
    refetchInterval: () => 30000,
    refetchIntervalInBackground: true,
    staleTime: 0,
    gcTime: 0,
  })

  // Fetch hosted URL when request data is available
  useQuery({
    queryKey: ["hostedUrl", data?.repositoryId],
    queryFn: async () => {
      if (!data?.repositoryId) return null
      try {
        const response = await getAddressOfRepository(data.repositoryId)
        setHostedUrl(response.hostedUrl)

        // Store deployment info for pre-filling form
        const clusterId = response.AwsK8sClusterId || response.AzureK8sClusterId
        if (clusterId) {
          const provider = response.AwsK8sClusterId
            ? CloudProvider.AWS
            : CloudProvider.AZURE
          setDeploymentInfo({ clusterId, provider })
        }

        return response
      } catch {
        console.log("No hosted URL available yet")
        return null
      }
    },
    enabled: !!data?.repositoryId && data?.status === Status.Approved,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const updateFeedback = useMutation({
    mutationFn: ({
      requestId,
      feedback,
    }: {
      requestId: string
      feedback: string
    }) => updateRequestFeedback(requestId, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["request", slug],
      })
    },
  })

  const { data: approvedClusters } = useQuery({
    queryKey: ["clusters", Status.Approved],
    queryFn: () => getUserAllApprovedClusters(),
    enabled: deploymentOpen,
  })

  // Filter clusters to show only AWS clusters
  const filteredClusters =
    approvedClusters?.filter(
      (cluster) => cluster.cloudProvider === CloudProvider.AWS
    ) ?? []

  const deployMutation = useMutation({
    mutationFn: deploy,
    onSuccess: async (response) => {
      console.log("Deployment successful:", response)
      setDeployResult({
        type: "success",
        message: "Deployment request submitted.",
      })

      // Invalidate and refetch hosted URL
      queryClient.invalidateQueries({
        queryKey: ["hostedUrl", data?.repositoryId],
      })

      // Fetch hosted URL after deployment
      if (data?.repositoryId) {
        try {
          const addressResponse = await getAddressOfRepository(
            data.repositoryId
          )
          setHostedUrl(addressResponse.hostedUrl)
          console.log("Hosted URL:", addressResponse.hostedUrl)

          // Store deployment info
          const clusterId =
            addressResponse.AwsK8sClusterId || addressResponse.AzureK8sClusterId
          if (clusterId) {
            const provider = addressResponse.AwsK8sClusterId
              ? CloudProvider.AWS
              : CloudProvider.AZURE
            setDeploymentInfo({ clusterId, provider })
          }
        } catch {
          console.log("Hosted URL not available yet")
        }
      }
    },
    onError: (e) => {
      console.error("Deployment failed:", e)
      const message =
        e instanceof Error ? e.message : "Failed to submit deployment request."
      setDeployResult({ type: "error", message })
    },
  })

  const approveMutation = useMutation({
    mutationFn: ({ requestId }: { requestId: string }) =>
      changeRequestStatus(requestId, Status.Approved),
    onSuccess: (data) => {
      if (data.status === Status.Approved) {
        // confetti({
        //   particleCount: 200,
        //   spread: 70,
        //   origin: { y: 0.6 },
        // })
        // setShowApprovePopup(true)
        queryClient.invalidateQueries({
          queryKey: ["request", slug],
        })
      }
    },
    onError: (error) => {
      console.error("Failed to approve request:", error)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId }: { requestId: string }) => {
      return await changeRequestStatus(requestId, Status.Rejected)
    },
    onSuccess: (data) => {
      if (data.status === Status.Rejected) {
        setShowRejectPopup(true)
        queryClient.invalidateQueries({
          queryKey: ["request", slug],
        })
      }
    },
    onError: (error) => {
      console.error("Failed to reject request:", error)
    },
  })

  function handleApprove() {
    if (data && feedback.trim()) {
      approveMutation.mutate({ requestId: data.id })
      updateFeedback.mutate({
        requestId: data.id,
        feedback: feedback,
      })
    }
  }

  function handleReject() {
    if (data) {
      rejectMutation.mutate({ requestId: data.id })
      updateFeedback.mutate({
        requestId: data.id,
        feedback: feedback,
      })
    }
  }

  const deleteMutation = useMutation({
    mutationFn: async ({ requestId }: { requestId: string }) => {
      await changeRequestStatus(requestId, Status.Deleted)
      return await deleteRequest(requestId)
    },
    onSuccess: (data) => {
      if (data.status === Status.Rejected) {
        setShowRejectPopup(true)
        queryClient.invalidateQueries({
          queryKey: ["request", slug],
        })
      }
    },
    onError: (error) => {
      console.error("Failed to reject request:", error)
    },
  })

  function handleDelete() {
    if (data && data.feedback?.trim()) {
      deleteMutation.mutate({ requestId: data.id })
    }
  }

  const {
    data: session,
    isLoading: isLoadingUser,
    error: errorUser,
  } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  })

  if (isLoadingUser) return <RequestPageSkeleton />
  if (errorUser) return <p>Error fetching user data...</p>

  if (isLoading) return <RequestPageSkeleton />
  if (error) return <div>{error.message}</div>

  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-6 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/requests">Requests</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{slug}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h2 className="text-2xl font-bold tracking-tight">{slug}</h2>
        </div>
        {haveAdminOrIT(session?.role) &&
          data?.status !== Status.Approved &&
          data?.status !== Status.Rejected &&
          data?.status !== Status.Deleted && (
            <AdminITActionsButton
              handleApprove={handleApprove}
              handleReject={handleReject}
              approveMutation={approveMutation}
              rejectMutation={rejectMutation}
              feedback={feedback}
            />
          )}
        {data?.status === Status.Approved &&
          showDestroyButtonAfterCreation(data) && (
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <AlertDialogTrigger
                      className={buttonVariants({ variant: "destructive" })}
                    >
                      {rejectMutation.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogTrigger>
                  </span>
                </TooltipTrigger>
                {/* <TooltipContent>
                <p>Not available</p>
              </TooltipContent> */}
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will delete the resource
                    group associated with this request.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className={buttonVariants({ variant: "destructive" })}
                    onClick={() => handleDelete()}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
      </div>
      <div className="flex flex-col gap-8">
        {/* {showApprovePopup && (
          <StatusChangePopup
            showPopup={showApprovePopup}
            setShowPopup={setShowApprovePopup}
            title="Request Approved"
            description="The request has been successfully approved."
          />
        )} */}
        {showRejectPopup && (
          <StatusChangePopup
            showPopup={showRejectPopup}
            setShowPopup={setShowRejectPopup}
            title="Request Rejected"
            description="The request has been successfully rejected."
          />
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left side - Resource details */}
          <div className="lg:col-span-2 space-y-6">
            <ResourceGroupCard data={data} />
          </div>

          {/* Right side - Organization info */}
          <div className="flex flex-col space-y-6">
            <OrganizationCard data={data} />
            <DescriptionCard data={data} />
          </div>
          {/* Feedback + Deployment */}
          {data?.status === Status.Approved && (
            <div className="col-span-3 space-y-6">
              {data?.feedback !== "" && <FeedbackCard data={data} />}

              <Card>
                <CardContent className="space-y-4">
                  {hostedUrl && (
                    <div className="relative rounded-lg border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-green-600 rounded-full">
                          <Rocket className="h-4 w-4 text-white" />
                        </div>
                        <Label className="text-base font-semibold text-green-900 dark:text-green-100">
                          Application Deployed
                        </Label>
                        <Badge
                          variant="outline"
                          className="ml-auto border-green-600 text-green-700 dark:text-green-400"
                        >
                          Live
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={hostedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-2 text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium break-all transition-colors flex-1"
                        >
                          <ExternalLink className="h-4 w-4 shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="underline-offset-2 group-hover:underline">
                            {hostedUrl}
                          </span>
                        </a>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0 h-8 w-8"
                          onClick={() => {
                            navigator.clipboard.writeText(hostedUrl)
                            setCopied(true)
                            setTimeout(() => setCopied(false), 2000)
                          }}
                        >
                          {copied ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <Accordion
                    type="single"
                    collapsible
                    value={deploymentOpen ? "deployment" : ""}
                    onValueChange={(value) => {
                      const isOpen = value === "deployment"
                      setDeploymentOpen(isOpen)
                      setDeployResult(undefined)

                      if (isOpen) {
                        // Pre-fill form if deployment info exists
                        if (deploymentInfo) {
                          setSelectedClusterId(deploymentInfo.clusterId)
                          setDeploymentPort("3000")
                        }
                      }
                    }}
                  >
                    <AccordionItem value="deployment" className="border-none">
                      <AccordionTrigger className="text-xl font-bold tracking-tight hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          <span>Deployment Configuration</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-6 pt-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground pb-3 border-b">
                            <Cloud className="h-4 w-4" />
                            <span className="font-medium">
                              Infrastructure Settings
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                              <Label className="flex items-center gap-1.5">
                                <Cloud className="h-3.5 w-3.5" />
                                Provider
                              </Label>
                              <div className="flex items-center gap-2 h-10 px-3 py-2 border rounded-md bg-white">
                                <Image
                                  src="/icon/aws.svg"
                                  width={16}
                                  height={16}
                                  alt="AWS Icon"
                                />
                                <span className="text-sm">AWS</span>
                              </div>
                            </div>

                            <div className="grid gap-2">
                              <Label
                                htmlFor="deployment-port"
                                className="flex items-center gap-1.5"
                              >
                                <Server className="h-3.5 w-3.5" />
                                Port
                              </Label>
                              <Input
                                id="deployment-port"
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={65535}
                                placeholder="80"
                                value={deploymentPort}
                                onChange={(e) =>
                                  setDeploymentPort(e.target.value)
                                }
                                disabled={!!hostedUrl}
                                className="h-10"
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label
                                htmlFor="repo-private"
                                className="flex items-center gap-1.5"
                              >
                                Private repository
                              </Label>
                              <div className="flex items-center justify-between rounded-md border px-3 h-10">
                                <span className="text-sm text-muted-foreground">
                                  Private repository
                                </span>
                                <Switch
                                  id="repo-private"
                                  checked={repoPrivate}
                                  onCheckedChange={(checked) =>
                                    setRepoPrivate(checked)
                                  }
                                  disabled={!!hostedUrl}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <Label className="flex items-center gap-1.5">
                              <Server className="h-3.5 w-3.5" />
                              Target Cluster
                            </Label>
                            <Select
                              value={selectedClusterId}
                              onValueChange={setSelectedClusterId}
                              disabled={!!hostedUrl}
                            >
                              <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Select cluster" />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredClusters.map((cluster) => (
                                  <SelectItem
                                    key={cluster.id}
                                    value={cluster.id}
                                  >
                                    {cluster.name} ({cluster.region})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground pb-3 border-b">
                            <Settings className="h-4 w-4" />
                            <span className="font-medium">
                              Environment Variables
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              Optional
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                              <Label
                                htmlFor="vm-env"
                                className="flex items-center gap-1.5"
                              >
                                <Server className="h-3.5 w-3.5" />
                                VM Environment
                              </Label>
                              <Input
                                id="vm-env"
                                placeholder="e.g. KEY=value"
                                value={vmEnv}
                                onChange={(e) => setVmEnv(e.target.value)}
                                disabled={!!hostedUrl}
                                className="h-10"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label
                                htmlFor="storage-env"
                                className="flex items-center gap-1.5"
                              >
                                <HardDrive className="h-3.5 w-3.5" />
                                Storage Environment
                              </Label>
                              <Input
                                id="storage-env"
                                placeholder="e.g. KEY=value"
                                value={storageEnv}
                                onChange={(e) => setStorageEnv(e.target.value)}
                                disabled={!!hostedUrl}
                                className="h-10"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label
                                htmlFor="db-env"
                                className="flex items-center gap-1.5"
                              >
                                <Database className="h-3.5 w-3.5" />
                                Database Environment
                              </Label>
                              <Input
                                id="db-env"
                                placeholder="e.g. KEY=value"
                                value={dbEnv}
                                onChange={(e) => setDbEnv(e.target.value)}
                                disabled={!!hostedUrl}
                                className="h-10"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pt-4 border-t">
                            <Button
                              size="lg"
                              className="gap-2"
                              onClick={() => {
                                if (!data) return
                                setDeployResult(undefined)

                                if (!isPortValid) {
                                  setDeployResult({
                                    type: "error",
                                    message:
                                      "Please enter a valid port (1-65535).",
                                  })
                                  return
                                }

                                const deploymentPayload = {
                                  clusterId: selectedClusterId,
                                  provider: CloudProvider.AWS,
                                  repositoryId: data.repositoryId,
                                  port: portNumber,
                                  usePrivateRegistry: repoPrivate,
                                  vmEnv: vmEnv.trim() || undefined,
                                  storageEnv: storageEnv.trim() || undefined,
                                  dbEnv: dbEnv.trim() || undefined,
                                }

                                console.log(
                                  "Deploying with payload:",
                                  deploymentPayload
                                )

                                deployMutation.mutate(deploymentPayload)
                              }}
                              disabled={
                                !selectedClusterId ||
                                deployMutation.isPending ||
                                !isPortValid
                              }
                            >
                              {deployMutation.isPending ? (
                                <>
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  Deploying...
                                </>
                              ) : (
                                <>
                                  <Rocket className="h-4 w-4" />
                                  Deploy Application
                                </>
                              )}
                            </Button>
                            {deployResult && (
                              <div
                                className={
                                  deployResult.type === "success"
                                    ? "flex items-center gap-2 text-sm text-green-700 dark:text-green-400 font-medium"
                                    : "flex items-center gap-2 text-sm text-destructive font-medium"
                                }
                              >
                                {deployResult.type === "success" ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  <AlertCircle className="h-4 w-4" />
                                )}
                                {deployResult.message}
                              </div>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          )}
          {data?.status === Status.Pending &&
            (session?.role === Role.Admin || session?.role === Role.IT) && (
              <div className="grid gap-2 col-span-3">
                <Label className="flex items-center gap-1 font-bold tracking-tight text-xl">
                  <MessageSquareText />
                  Feedback *
                </Label>
                <Textarea
                  required
                  className="h-40"
                  placeholder="Leave your feedback here..."
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
            )}
          {/* {data?.status === Status.Approved && (
            <div className="col-span-3">
              <AirflowLogs
                dagId="AZURE_Resource_Group"
                dagRunId="manual__2025-09-15T04:04:17.884443+00:00"
              />
            </div>
          )} */}
        </div>
      </div>
    </div>
  )
}

function StatusChangePopup({
  showPopup,
  setShowPopup,
  title,
  description,
}: {
  showPopup: boolean
  setShowPopup: (open: boolean) => void
  title: string
  description: string
}) {
  return (
    <AlertDialog open={showPopup} onOpenChange={setShowPopup}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowPopup(false)}>
            Done
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function AdminITActionsButton({
  handleApprove,
  handleReject,
  approveMutation,
  rejectMutation,
  feedback,
}: {
  handleApprove: () => void
  handleReject: () => void
  approveMutation: UseMutationResult<
    RequestStatusResponse,
    Error,
    {
      requestId: string
    },
    unknown
  >
  rejectMutation: UseMutationResult<
    RequestStatusResponse,
    Error,
    {
      requestId: string
    },
    unknown
  >
  feedback: string
}) {
  const isFeedbackEmpty = !feedback.trim()

  return (
    <div className="flex gap-4 ml-auto">
      <AlertDialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <AlertDialogTrigger
                className={buttonVariants({ variant: "destructive" })}
                disabled={isFeedbackEmpty || rejectMutation.isPending}
                title={isFeedbackEmpty ? "Please provide feedback" : ""}
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject"}
              </AlertDialogTrigger>
            </span>
          </TooltipTrigger>
          {isFeedbackEmpty && (
            <TooltipContent>
              <p>Please provide feedback</p>
            </TooltipContent>
          )}
        </Tooltip>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will reject the request and
              notify the requester.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={() => handleReject()}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <AlertDialogTrigger
                className={buttonVariants({ variant: "default" })}
                disabled={isFeedbackEmpty || approveMutation.isPending}
              >
                {approveMutation.isPending ? "Approving..." : "Approve"}
              </AlertDialogTrigger>
            </span>
          </TooltipTrigger>
          {isFeedbackEmpty && (
            <TooltipContent>
              <p>Please provide feedback</p>
            </TooltipContent>
          )}
        </Tooltip>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will approve the request and
              notify the requester.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleApprove()}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}