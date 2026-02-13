"use client"
import { fetcher } from "@/lib/fetcher"
import {
  DatabaseAzurePolicyDto,
  StorageAzurePolicyDto,
  VmSizeDto,
} from "@/types/request"

export interface updatePolicyVM {
  name: string
  numberOfCores: number
  memoryInMB: number
}

export interface updatePolicyDB {
  maxStorage: number
}

export interface updatePolicyST {
  maxStorage: number
}

export async function updatePolicyVMAzure({
  name,
  numberOfCores,
  memoryInMB,
}: updatePolicyVM) {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/azure/policy/virtual_machine`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        numberOfCores,
        memoryInMB,
      }),
    }
  )
}

export async function updatePolicyDBAzure({ maxStorage }: updatePolicyDB) {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/azure/policy/database`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ maxStorage }),
  })
}

export async function updatePolicySTAzure({ maxStorage }: updatePolicyST) {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/azure/policy/storage`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ maxStorage }),
  })
}

export async function createPolicyAzure() {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/azure/policy/virtual_machine`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }
  )
}

export async function getPolicyVMAzure() {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/azure/policy/virtual_machine`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}

export async function getPolicyClusterAzure() {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/azure/policy/cluster`, {
    headers: {
      "Content-Type": "application/json",
    },
  })
}

export async function getPolicyDBAzure(): Promise<DatabaseAzurePolicyDto> {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/azure/policy/database`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
}

export async function getPolicySTAzure(): Promise<StorageAzurePolicyDto> {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/azure/policy/storage`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
}

export async function getVmSizes(params: URLSearchParams) {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/cloud-providers/azure?${params.toString()}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}

export async function fetchVmSizes(
  value: string,
  page: number,
  limit: number,
  usePolicyFilter: boolean
): Promise<VmSizeDto[]> {
  let maxCores = ""
  let maxMemory = ""

  if (usePolicyFilter) {
    const policyVM = await getPolicyVMAzure()
    maxCores = policyVM.numberOfCores.toString()
    maxMemory = policyVM.memoryInMB.toString()
  }

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search: value,
  })

  if (maxCores) params.append("maxCores", maxCores)
  if (maxMemory) params.append("maxMemory", maxMemory)

  const response = await getVmSizes(params)

  return response.data
}

// export async function fetchClusterSizes(
//   value: string,
//   page: number,
//   limit: number,
//   usePolicyFilter: boolean
// ): Promise<VmSizeDto[]> {
//   if (usePolicyFilter) {
//     const policyCluster = await getPolicyClusterAzure()

//     const params = new URLSearchParams({
//       page: "1",
//       limit: "50",
//       search: policyCluster.name,
//     })

//     const response = await getVmSizes(params)
//     console.log("✅ Cluster policy search for:", policyCluster.name)
//     console.log(
//       "Results:",
//       response.data?.map((vm: VmSizeDto) => vm.name)
//     )

//     return response.data || []
//   }

//   // Normal search without policy filter
//   const params = new URLSearchParams({
//     page: page.toString(),
//     limit: limit.toString(),
//     search: value,
//   })

//   const response = await getVmSizes(params)
//   return response.data || []
// }

export async function fetchClusterSizes(
  value: string,
  page: number,
  limit: number,
  usePolicyFilter: boolean
): Promise<VmSizeDto[]> {
  let maxCores = ""
  let maxMemory = ""

  if (usePolicyFilter) {
    const policyVM = await getPolicyClusterAzure()
    maxCores = policyVM.numberOfCores.toString()
    maxMemory = policyVM.memoryInMB.toString()
  }

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search: value,
  })

  if (maxCores) params.append("maxCores", maxCores)
  if (maxMemory) params.append("maxMemory", maxMemory)

  const response = await getVmSizes(params)

  return response.data
}
