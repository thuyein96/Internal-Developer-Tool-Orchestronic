import { Engine } from "@/types/resource"
import z from "zod"

const vmSchema = z.object({
  name: z
    .string()
    .nonempty({ message: "VM name is required" })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: "VM name must not contain special characters",
    }),
  os: z.string().nonempty({
    message: "Operating system is required",
  }),
  sizeId: z.string().nonempty({
    message: "VM size is required",
  }),
})

const dbSchema = z
  .object({
    name: z.string().nonempty({
      message: "Database name is required",
    }),
    engine: z.string().nonempty({
      message: "Database engine is required",
    }),
    storageGB: z.number().optional(),
    skuName: z.string().nonempty({
      message: "SKU name is required",
    }),
    username: z
      .string()
      .nonempty({ message: "Username is required" })
      .refine((val) => val.toLowerCase() !== "root", {
        message: "Username cannot be root",
      }),
    password: z.string().superRefine((val, ctx) => {
      if (val.length < 8) {
        ctx.addIssue({
          code: "too_small",
          minimum: 8,
          type: "string",
          inclusive: true,
          message: "Password must be at least 8 characters",
        })
      }

      let count = 0
      if (/[A-Z]/.test(val)) count++
      if (/[a-z]/.test(val)) count++
      if (/[0-9]/.test(val)) count++
      if (/[^A-Za-z0-9]/.test(val)) count++

      if (count < 3) {
        ctx.addIssue({
          code: "custom",
          message:
            "Password must contain characters from at least three categories: uppercase, lowercase, numbers, special characters",
        })
      }
    }),
  })
  .superRefine((data, ctx) => {
    if (
      data.engine === Engine.PostgreSQL &&
      (data.storageGB === undefined || data.storageGB === null)
    ) {
      ctx.addIssue({
        path: ["storageGB"],
        code: z.ZodIssueCode.custom,
        message: "required for PostgreSQL databases",
      })
    }
  })

const storageSchema = z.object({
  accessTier: z.string().nonempty({
    message: "Access tier is required",
  }),
  name: z
    .string()
    .regex(/^[a-z0-9]+$/, {
      message: "Name can only contain lowercase letters and numbers",
    })
    .min(3, { message: "Name must be at least 3 characters" })
    .max(16, { message: "Name must be at most 16 characters" }),
  kind: z.string().nonempty({
    message: "Kind is required",
  }),
  sku: z.string().nonempty({
    message: "SKU name is required",
  }),
})

export const azureResourceSchema = z.object({
  name: z.string().nonempty({
    message: "Please provide a name for your resources",
  }),
  cloudProvider: z.string().nonempty({
    message: "Please select a cloud provider",
  }),
  region: z.string().nonempty({
    message: "Please select a region",
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

export const azureRequestFormSchema = z.object({
  resources: azureResourceSchema,
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
