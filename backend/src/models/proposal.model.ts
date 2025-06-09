import { z } from 'zod';

export const proposalSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Proposal = z.infer<typeof proposalSchema>; 