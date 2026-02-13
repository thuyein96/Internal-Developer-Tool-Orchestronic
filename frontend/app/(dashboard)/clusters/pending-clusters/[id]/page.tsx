"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Server,
  Cloud,
  MapPin,
  Info,
  Calendar,
  CheckCircle2,
  Clock,
  HardDrive,
} from "lucide-react"
import { format } from "date-fns"
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
import {
  ClusterDetail,
  ClusterResource,
  getClusterResources,
  getPendingClusters,
  getApprovedClusters,
  updateClusterStatus,
} from "@/app/api/requests/api"

export default function PendingClusterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params.id as string

  // Fetch both pending and approved clusters
  const { data: pendingClusters, isLoading: isLoadingPending } = useQuery({
    queryKey: ["pending-clusters"],
    queryFn: getPendingClusters,
  })

  const { data: approvedClusters, isLoading: isLoadingApproved } = useQuery({
    queryKey: ["approved-clusters"],
    queryFn: getApprovedClusters,
  })

  const { data: resources, isLoading: isLoadingResources } = useQuery({
    queryKey: ["cluster-resources", id],
    queryFn: () => getClusterResources(id),
    enabled: !!id,
  })

  const approveMutation = useMutation({
    mutationFn: (clusterRequestId: string) =>
      updateClusterStatus({
        clusterRequestId,
        status: "Approved",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-clusters"] })
      queryClient.invalidateQueries({ queryKey: ["approved-clusters"] })
      queryClient.invalidateQueries({ queryKey: ["clusters"] })
      router.push("/requests")
    },
    onError: (error: Error) => {
      console.error("Error approving cluster:", error)
      alert("Failed to approve cluster. Please try again.")
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (clusterRequestId: string) =>
      updateClusterStatus({
        clusterRequestId,
        status: "Rejected",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-clusters"] })
      queryClient.invalidateQueries({ queryKey: ["approved-clusters"] })
      queryClient.invalidateQueries({ queryKey: ["clusters"] })
      router.push("/requests")
    },
    onError: (error: Error) => {
      console.error("Error rejecting cluster:", error)
      alert("Failed to reject cluster. Please try again.")
    },
  })

  // Combine both pending and approved clusters to find the right one
  const allClusters = [...(pendingClusters || []), ...(approvedClusters || [])]

  const cluster = allClusters.find((c) => c.id === id)
  const isPending = pendingClusters?.some((c) => c.id === id)

  const isLoading = isLoadingPending || isLoadingApproved || isLoadingResources

  if (isLoading) {
    return (
      <div className="hidden h-full flex-1 flex-col space-y-8 p-6 md:flex">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-20 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-40 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-40 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!cluster) {
    return (
      <div className="hidden h-full flex-1 flex-col space-y-8 p-6 md:flex">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/requests">
              <IconArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Cluster not found
            </h2>
            <p className="text-muted-foreground">
              The cluster you&apos;re looking for doesn&apos;t exist or has
              already been processed.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const handleApprove = () => {
    if (cluster && cluster.clusterRequestId) {
      approveMutation.mutate(cluster.clusterRequestId)
    }
  }

  const handleReject = () => {
    if (cluster && cluster.clusterRequestId) {
      rejectMutation.mutate(cluster.clusterRequestId)
    }
  }

  const isProcessing = approveMutation.isPending || rejectMutation.isPending

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
                <BreadcrumbLink href="/requests">
                  {isPending ? "Pending" : "Approved"} Clusters
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{cluster.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3 mt-2">
            <h2 className="text-2xl font-bold tracking-tight">
              {cluster.name}
            </h2>
            <Badge
              variant={
                cluster.cloudProvider === "AZURE" ? "default" : "secondary"
              }
            >
              {cluster.cloudProvider}
            </Badge>
            {!isPending && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                Approved
              </Badge>
            )}
          </div>
        </div>
        {/* Only show approve/reject buttons for pending clusters */}
        {isPending && (
          <div className="flex gap-4 ml-auto">
            <AlertDialog>
              <AlertDialogTrigger
                className={buttonVariants({ variant: "destructive" })}
                disabled={isProcessing}
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject"}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will reject the cluster request and notify the
                    requester.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isProcessing}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className={buttonVariants({ variant: "destructive" })}
                    onClick={handleReject}
                    disabled={isProcessing}
                  >
                    {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger
                className={buttonVariants({ variant: "default" })}
                disabled={isProcessing}
              >
                {approveMutation.isPending ? "Approving..." : "Approve"}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will approve the cluster request and start the
                    provisioning process.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isProcessing}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleApprove}
                    disabled={isProcessing}
                  >
                    {approveMutation.isPending ? "Approving..." : "Continue"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left side - Resource details */}
          <div className="lg:col-span-2 space-y-6">
            {resources && resources.length > 0 ? (
              resources.map((resource) => (
                <ClusterResourceCard key={resource.id} resource={resource} />
              ))
            ) : (
              <div className="text-center p-8 border rounded-lg">
                <p className="text-muted-foreground">
                  No resources found for this cluster.
                </p>
              </div>
            )}
          </div>

          {/* Right side - Cluster info */}
          <div className="flex flex-col space-y-6">
            <ClusterInfoCard cluster={cluster} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Inline Components
function ClusterResourceCard({ resource }: { resource: ClusterDetail }) {
  const isConfigured = resource.kubeConfig !== null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            {resource.clusterName}
          </CardTitle>
          <Badge variant={isConfigured ? "default" : "secondary"}>
            {isConfigured ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Configured
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Pending
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Node Count
              </p>
              <p className="text-lg font-semibold">{resource.nodeCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Node Size
              </p>
              <p className="text-sm font-mono break-all">{resource.nodeSize}</p>
            </div>
          </div>

          {resource.clusterFqdn && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Cluster FQDN
              </p>
              <p className="text-sm font-mono break-all">
                {resource.clusterFqdn}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created At
              </p>
              <p className="text-sm">
                {format(new Date(resource.createdAt), "MMM dd, yyyy HH:mm")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Updated At
              </p>
              <p className="text-sm">
                {format(new Date(resource.updatedAt), "MMM dd, yyyy HH:mm")}
              </p>
            </div>
          </div>

          {resource.kubeConfig && (
            <div className="space-y-1 pt-2 border-t">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                Configuration
              </p>
              <Badge variant="outline" className="text-xs">
                KubeConfig Available
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ClusterInfoCard({ cluster }: { cluster: ClusterResource }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Cluster Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Cloud className="h-3 w-3" />
              Cloud Provider
            </p>
            <Badge
              variant={
                cluster.cloudProvider === "AZURE" ? "default" : "secondary"
              }
            >
              {cluster.cloudProvider}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Region
            </p>
            <p className="text-lg font-semibold">{cluster.region}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Resource Config ID
            </p>
            <p className="text-xs font-mono break-all text-muted-foreground">
              {cluster.resourceConfigId}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
