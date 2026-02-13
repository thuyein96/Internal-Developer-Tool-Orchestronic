import z from "zod"
import { Engine } from "@/types/resource"

const vmSchema = z.object({
  instanceName: z
    .string()
    .nonempty({ message: "Instance name is required" })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: "Instance name must not contain special characters",
    }),
  os: z.string().nonempty({
    message: "Operating system is required",
  }),
  awsInstanceTypeId: z.string().nonempty({
    message: "Instance type is required",
  }),
  sgName: z.string().nonempty({
    message: "Security group name is required",
  }),
  keyName: z.string().nonempty({
    message: "Key pair name is required",
  }),
})

const dbSchema = z.object({
  dbName: z.string().nonempty({
    message: "Database name is required",
  }),
  engine: z.nativeEnum(Engine),
  dbUsername: z.string().nonempty({
    message: "Username is required",
  }),
  dbPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .nonempty({ message: "Password is required" }),
  awsDatabaseTypeId: z.string().nonempty({
    message: "DB instance class is required",
  }),
  dbAllocatedStorage: z.number().min(20, {
    message: "Storage must be at least 20 GB",
  }),
})

const storageSchema = z.object({
  bucketName: z.string().regex(/^[a-z0-9]+$/, {
    message: "Repository name can only contain lowercase letters and numbers",
  }),
})

export const awsResourceSchema = z.object({
  name: z.string().nonempty({
    message: "Please provide a name for your resources",
  }),
  cloudProvider: z.string().nonempty({
    message: "Please select a cloud provider",
  }),
  region: z.string().nonempty({
    message: "Region is required",
  }),
  resourceConfig: z
    .object({
      vms: z.array(vmSchema).optional(),
      dbs: z.array(dbSchema).optional(),
      sts: z.array(storageSchema).optional(),
    })
    .refine(
      (data) => {
        const hasVM = data.vms && data.vms.length > 0
        const hasDB = data.dbs && data.dbs.length > 0
        const hasStorage = data.sts && data.sts.length > 0
        return hasVM || hasDB || hasStorage
      },
      {
        message: "At least one resource (VM, Database, or Storage) is required",
        path: [],
      }
    ),
})

export const awsRequestFormSchema = z.object({
  resources: awsResourceSchema,
  repository: z.object({
    name: z
      .string()
      .regex(/^[a-z0-9._-]+$/, {
        message:
          "Repository name can only contain lowercase letters and numbers",
      })
      .min(3, { message: "Repository name must be at least 3 characters" })
      .max(24, { message: "Repository name must be at most 24 characters" }),
    description: z.string().optional(),
    collaborators: z
      .array(
        z.object({
          userId: z.string().nonempty({
            message: "Collaborator ID is required",
          }),
        })
      )
      .optional(),
  }),
  description: z.string().nonempty({
    message: "Please provide a description for your request",
  }),
})
