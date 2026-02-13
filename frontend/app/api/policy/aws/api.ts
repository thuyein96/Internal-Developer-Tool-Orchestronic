// import { fetcher } from "@/lib/fetcher"
// import {
//   AwsVmSizeDto,
//   DatabaseAwsPolicyDto,
//   StorageAwsPolicyDto,
// } from "@/types/request"

// export async function createPolicyAws() {
//   return fetcher(
//     `${process.env.NEXT_PUBLIC_API_URL}/aws/policy/virtual_machine`,
//     {
//       method: "POST",
//       credentials: "include",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({}),
//     }
//   )
// }

// // export async function getPolicyVMAws() {
// //   return fetcher(
// //     `${process.env.NEXT_PUBLIC_API_URL}/aws/policy/virtual_machine`,
// //     {
// //       headers: {
// //         "Content-Type": "application/json",
// //       },
// //     }
// //   )
// // }

// export async function getPolicyVMAws() {
//   return fetcher(
//     `${process.env.NEXT_PUBLIC_API_URL}/aws/policy/virtual_machine`,
//     {
//       method: "GET",
//       credentials: "include",
//       headers: {
//         "Content-Type": "application/json",
//       },
//     }
//   )
// }

// export async function getPolicyDBAws(): Promise<DatabaseAwsPolicyDto> {
//   return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/aws/policy/database`, {
//     method: "GET",
//     credentials: "include",
//     headers: {
//       "Content-Type": "application/json",
//     },
//   })
// }

// export async function getPolicySTAws(): Promise<StorageAwsPolicyDto> {
//   return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/aws/policy/storage`, {
//     method: "GET",
//     credentials: "include",
//     headers: {
//       "Content-Type": "application/json",
//     },
//   })
// }

// export async function updatePolicyVMAws({
//   name,
//   numberOfCores,
//   memoryInMB,
// }: updatePolicyVMAws) {
//   return fetcher(
//     `${process.env.NEXT_PUBLIC_API_URL}/aws/policy/virtual_machine`,
//     {
//       method: "PATCH",
//       credentials: "include",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         name,
//         numberOfCores,
//         memoryInMB,
//       }),
//     }
//   )
// }

// // export async function fetchAwsVmSizes(
// //   value: string,
// //   page: number,
// //   limit: number,
// //   usePolicyFilter: boolean
// // ): Promise<AwsVmSizeDto[]> {
// //   let maxCores = ""
// //   let maxMemory = ""

// //   if (usePolicyFilter) {
// //     const policyVM = await getPolicyVMAws()
// //     maxCores = policyVM.numberOfCores.toString()
// //     maxMemory = policyVM.memoryInMB.toString()
// //   }

// //   const params = new URLSearchParams({
// //     page: page.toString(),
// //     limit: limit.toString(),
// //     search: value,
// //   })

// //   if (maxCores) params.append("maxCores", maxCores)
// //   if (maxMemory) params.append("maxMemory", maxMemory)

// //   const response = await fetcher(
// //     `${process.env.NEXT_PUBLIC_API_URL}/cloud-providers/aws?${params.toString()}`,
// //     {
// //       method: "GET",
// //       credentials: "include",
// //       headers: {
// //         "Content-Type": "application/json",
// //       },
// //     }
// //   )
// //   return response.data
// // }

// export async function fetchAwsVmSizes(
//   value: string,
//   page: number,
//   limit: number,
//   usePolicyFilter: boolean
// ): Promise<AwsVmSizeDto[]> {
//   let maxCores = ""
//   let maxMemory = ""

//   if (usePolicyFilter) {
//     const policyVM = await getPolicyVMAws()
//     console.log("🔍 Policy VM:", policyVM)
//     maxCores = policyVM.numberOfCores.toString()
//     maxMemory = policyVM.memoryInMB.toString()
//     console.log("🔍 Max Cores:", maxCores, "Max Memory:", maxMemory)
//   }

//   const params = new URLSearchParams({
//     page: page.toString(),
//     limit: limit.toString(),
//     search: value,
//   })

//   if (maxCores) params.append("maxCores", maxCores)
//   if (maxMemory) params.append("maxMemory", maxMemory)

//   const response = await fetcher(
//     `${process.env.NEXT_PUBLIC_API_URL}/cloud-providers/aws?${params.toString()}`,
//     {
//       method: "GET",
//       credentials: "include",
//       headers: {
//         "Content-Type": "application/json",
//       },
//     }
//   )

//   return response.data || response
// }

// // export async function fetchAwsVmSizes() {
// //   return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/azure/policy/cluster`, {
// //     headers: {
// //       "Content-Type": "application/json",
// //     },
// //   })
// // }

// export async function updatePolicyDBAws({ maxStorage }: updatePolicyDBAws) {
//   return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/aws/policy/database`, {
//     method: "PATCH",
//     credentials: "include",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ maxStorage }),
//   })
// }

// export async function updatePolicySTAws({ maxStorage }: updatePolicySTAws) {
//   return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/aws/policy/storage`, {
//     method: "PATCH",
//     credentials: "include",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ maxStorage }),
//   })
// }

// interface updatePolicyDBAws {
//   maxStorage: number
// }

// interface updatePolicySTAws {
//   maxStorage: number
// }

// interface updatePolicyVMAws {
//   name: string
//   numberOfCores: number
//   memoryInMB: number
// }

import { fetcher } from "@/lib/fetcher"
import {
  AwsVmSizeDto,
  DatabaseAwsPolicyDto,
  StorageAwsPolicyDto,
} from "@/types/request"

export async function getPolicyVMAws() {
  try {
    return await fetcher(
      `${process.env.NEXT_PUBLIC_API_URL}/aws/policy/virtual_machine`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  } catch (error) {
    console.error("❌ Error fetching AWS VM policy:", error)
    throw error
  }
}

export async function fetchAwsVmSizes(
  value: string,
  page: number,
  limit: number,
  usePolicyFilter: boolean
): Promise<AwsVmSizeDto[]> {
  let maxCores = ""
  let maxMemory = ""

  console.log("🔵 fetchAwsVmSizes called", {
    value,
    page,
    limit,
    usePolicyFilter,
  })

  // Fetch policy filters if needed
  if (usePolicyFilter) {
    try {
      const policyVM = await getPolicyVMAws()
      console.log("✅ Policy VM fetched:", policyVM)

      if (policyVM?.numberOfCores && policyVM?.memoryInMB) {
        maxCores = policyVM.numberOfCores.toString()
        maxMemory = policyVM.memoryInMB.toString()
        console.log("✅ Policy limits applied:", { maxCores, maxMemory })
      } else {
        console.warn("⚠️ Policy VM missing required fields:", policyVM)
      }
    } catch (error) {
      console.error("❌ Failed to fetch policy VM:", error)
      // Continue without policy filter instead of failing completely
      console.log("⚠️ Continuing without policy filter")
    }
  }

  // Build query parameters
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search: value,
  })

  if (maxCores) params.append("maxCores", maxCores)
  if (maxMemory) params.append("maxMemory", maxMemory)

  const url = `${process.env.NEXT_PUBLIC_API_URL}/cloud-providers/aws?${params.toString()}`
  console.log("🔵 Fetching from URL:", url)

  try {
    const response = await fetcher(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })

    console.log("✅ Raw response:", response)

    // Handle different response formats
    const data = response?.data || response

    if (!Array.isArray(data)) {
      console.error("❌ Response is not an array:", data)
      return []
    }

    console.log(`✅ Returning ${data.length} VM sizes`)
    return data
  } catch (error) {
    console.error("❌ Error fetching AWS VM sizes:", error)
    throw error
  }
}

export async function getPolicyDBAws(): Promise<DatabaseAwsPolicyDto> {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/aws/policy/database`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
}

export async function getPolicySTAws(): Promise<StorageAwsPolicyDto> {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/aws/policy/storage`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
}

export async function createPolicyAws() {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/aws/policy/virtual_machine`,
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

export async function updatePolicyVMAws({
  name,
  numberOfCores,
  memoryInMB,
}: updatePolicyVMAws) {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/aws/policy/virtual_machine`,
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

export async function updatePolicyDBAws({ maxStorage }: updatePolicyDBAws) {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/aws/policy/database`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ maxStorage }),
  })
}

export async function updatePolicySTAws({ maxStorage }: updatePolicySTAws) {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/aws/policy/storage`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ maxStorage }),
  })
}

interface updatePolicyDBAws {
  maxStorage: number
}

interface updatePolicySTAws {
  maxStorage: number
}

interface updatePolicyVMAws {
  name: string
  numberOfCores: number
  memoryInMB: number
}
