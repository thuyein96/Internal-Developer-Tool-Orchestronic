import { CloudProvider } from "@/types/resource"
import { z } from "zod"

export const azureResourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  cloudProvider: z.nativeEnum(CloudProvider),
  region: z.string(),
  resourceConfigId: z.string().uuid(),
  resourceConfig: z.object({
    id: z.string().uuid(),
    vms: z.array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        numberOfCores: z.number(),
        memory: z.number(),
        os: z.string(),
        resourceConfigId: z.string().uuid(),
      })
    ),
    dbs: z.array(
      z.object({
        id: z.string().uuid(),
        engine: z.string(), // You can restrict this with z.enum([...]) if needed
        storageGB: z.number(),
        resourceConfigId: z.string().uuid(),
      })
    ),
    sts: z.array(
      z.object({
        id: z.string().uuid(),
        type: z.string(), // You can also use z.enum(["SSD", "HDD"]) if only limited values
        capacityGB: z.number(),
        resourceConfigId: z.string().uuid(),
      })
    ),
  }),
  repository: z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    resourcesId: z.string().uuid(),
    status: z.enum(["Pending", "Approved", "Rejected"]),
  }),
  request: z.object({
    id: z.string().uuid(),
    displayCode: z.string(),
    status: z.enum(["Pending", "Approved", "Rejected"]),
    description: z.string(),
    ownerId: z.string().uuid(),
    repositoryId: z.string().uuid(),
    resourcesId: z.string().uuid(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
})

export type Resource = z.infer<typeof azureResourceSchema>
