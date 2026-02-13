import { z } from "zod"
import { requestSchema } from "../../requests/data/schema-request"

export const repositorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  resourcesId: z.string(),
  status: z.string(),

  resources: z.object({
    id: z.string(),
    name: z.string(),
    cloudProvider: z.string(),
    region: z.string(),
    resourceConfigId: z.string(),
  }),

  RepositoryCollaborator: z.array(
    z.object({
      userId: z.string(),
      repositoryId: z.string(),
      user: z.object({
        id: z.string(),
        email: z.string(),
        name: z.string(),
        role: z.string(),
      }),
      assignedAt: z.string(),
    })
  ),

  request: requestSchema,
})

export type Repository = z.infer<typeof repositorySchema>
