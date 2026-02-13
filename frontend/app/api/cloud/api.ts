import { awsFormSchema } from "@/app/(dashboard)/settings/components/aws-drawer"
import { fetcher } from "@/lib/fetcher"
import z from "zod"

export async function updateCloudConfig(
  values: z.infer<typeof awsFormSchema>,
  id: string
) {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/cloud/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...values }),
  })
}

export async function createCloudConfig(values: z.infer<typeof awsFormSchema>) {
  return fetcher(`${process.env.NEXT_PUBLIC_API_URL}/cloud/secret`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...values }),
  })
}

export interface CloudProviderSecret {
  id: string
  clientId: string
  clientSecret: string
  subscriptionId: string
  tenantId?: string
  userId: string
  cloudProvider: "AZURE" | "AWS"
}

export async function getCloudConfig(
  cloudProvider: "AZURE" | "AWS"
): Promise<CloudProviderSecret> {
  return fetcher(
    `${process.env.NEXT_PUBLIC_API_URL}/cloud?cloudProvider=${cloudProvider}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}
