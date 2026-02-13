import { z } from "zod"

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  date: z.string(),
  resources: z.string(),
  repository: z.string(),
  // label: z.string(),
  // priority: z.string(),
})

export type Task = z.infer<typeof taskSchema>
