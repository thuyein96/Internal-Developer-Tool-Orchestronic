"use client"

import { awsRequestFormSchema } from "@/components/requests/form-schema/aws"
import { azureRequestFormSchema } from "@/components/requests/form-schema/azure"
import { fetcher } from "@/lib/fetcher"
import { Status } from "@/types/api"
import { AzureRetailPriceResponse, DeploymentDto } from "@/types/request"
import z from "zod"

export async function getRequests() {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/request`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  })
}

export async function getRequestsStatus(status: Status) {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/request/status?status=${status as string}`,
    {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}

export async function createRequestAzure(
  data: z.infer<typeof azureRequestFormSchema>
) {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/request/azure`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}

export async function createRequestAws(
  data: z.infer<typeof awsRequestFormSchema>
) {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/request/aws`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}

export async function getRequestBySlug(slug: string) {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/request/displayCode?displayCode=${slug}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}

export interface RequestStatusResponse {
  id: string
  displayCode: string
  status: Status
  description: string
  ownerId: string
  repositoryId: string
  resourcesId: string
  createdAt: string
  updatedAt: string
}

export async function changeRequestStatus(
  requestId: string,
  status: Status
): Promise<RequestStatusResponse> {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/request/${requestId}/status`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    }
  )
}

export async function deleteRequest(requestId: string) {
  console.log("Deleting request with ID:", requestId)
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/infrastructure/${requestId}/infra-destroy`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}

export async function updateRequestFeedback(
  requestId: string,
  feedback: string
) {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/request/${requestId}/feedback`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ feedback }),
    }
  )
}

export async function getPriceOfVM(
  vmSize: string,
  region: string
): Promise<AzureRetailPriceResponse> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/resource/vm-price?vmSize=${vmSize}&region=${region}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch price: ${response.statusText}`)
  }

  return response.json()
}

// This is for cluster APIs

export interface CreateClusterRequest {
  resources: {
    name: string
    cloudProvider: string
    region: string
    resourceConfig: {
      cluster: Array<{
        clusterName: string
        nodeCount: number
        nodeSize: string
      }>
    }
  }
}

export interface ClusterConfig {
  clusterName: string
  nodeCount: number
  nodeSize: string
}

export interface CreateClusterResponse {
  id: string
  ownerId: string
  resourceId: string
  status: string
  createdAt: string
  updatedAt: string
}

export async function createCluster(
  data: CreateClusterRequest
): Promise<CreateClusterResponse> {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/project/azure`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}

// export interface ClusterResource {
//   id: string
//   name: string
//   region: string
//   resourceConfigId: string
//   cloudProvider: "AZURE" | "AWS"
// }

// export interface ClusterDetail {
//   id: string
//   clusterName: string
//   nodeCount: number
//   nodeSize: string
//   kubeConfig: string | null
//   clusterFqdn: string | null
//   terraformState: string | null
//   resourceConfigId: string
//   createdAt: string
//   updatedAt: string
// }

// export async function getUserClusters(): Promise<ClusterResource[]> {
//   return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/project/me/cluster`, {
//     method: "GET",
//     credentials: "include",
//     headers: {
//       "Content-Type": "application/json",
//     },
//   })
// }

// export async function getClusterResources(
//   clusterId: string
// ): Promise<ClusterDetail[]> {
//   return fetcher(
//     `${process.env.NEXT_PUBLIC_API_URL}/project/resource-config/${clusterId}`,
//     {
//       method: "GET",
//       credentials: "include",
//       headers: {
//         "Content-Type": "application/json",
//       },
//     }
//   )
// }

export interface ClusterResource {
  clusterRequestId?: string
  id: string
  name: string
  region: string
  resourceConfigId: string
  cloudProvider: "AZURE" | "AWS"
}

export interface ClusterDetail {
  id: string
  clusterName: string
  nodeCount: number
  nodeSize: string
  kubeConfig: string | null
  clusterFqdn: string | null
  terraformState: string | null
  resourceConfigId: string
  createdAt: string
  updatedAt: string
}

export async function getUserClusters(): Promise<ClusterResource[]> {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/project/me/cluster`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
}

export async function getClusterResources(
  clusterId: string
): Promise<ClusterDetail[]> {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/project/resource-config/${clusterId}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}

export async function getClusterById(
  clusterId: string
): Promise<ClusterResource | null> {
  try {
    const clusters = await getUserClusters()
    return clusters.find((c) => c.id === clusterId) || null
  } catch (error) {
    console.error("Error fetching cluster:", error)
    return null
  }
}

export async function getPendingClusters(): Promise<ClusterResource[]> {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/project/pending-clusters`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}

export async function getApprovedClusters(): Promise<ClusterResource[]> {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/project/approved-clusters`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}

export async function getUserAllApprovedClusters(): Promise<ClusterResource[]> {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/project/me/approved-clusters`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}

export interface UpdateClusterStatusRequest {
  clusterRequestId: string
  status: "Pending" | "Approved" | "Rejected"
}

export async function updateClusterStatus(
  data: UpdateClusterStatusRequest
): Promise<void> {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/project`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
}

export async function getClustersByStatus(
  status: Status
): Promise<ClusterResource[]> {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/project/clusters/${status}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}

export async function getUserClustersByStatus(
  status: Status
): Promise<ClusterResource[]> {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/project/me/cluster/${status}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}

export async function deploy(deploymentDto: DeploymentDto): Promise<void> {
  console.log("Sending deploy request with body:", deploymentDto)
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/project/deploy`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(deploymentDto),
  })
}

export async function getAddressOfRepository(
  repositoryId: string
): Promise<ProjectDeploymentResponse> {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/project/deployments/${repositoryId}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}

export interface ProjectDeploymentResponse {
  id: string
  repositoryId: string
  AwsK8sClusterId?: string
  AzureK8sClusterId?: string
  imageUrl: string
  hostedUrl: string
  DeploymentStatus: "Pending" | "Deployed"
}