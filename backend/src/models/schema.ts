import { z } from 'zod';

export const insertUserSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string().optional(),
  name: z.string().optional(),
  fullName: z.string().optional(),
  role: z.string().optional(),
  supabaseUid: z.string().optional(),
  firebaseUid: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  activePlan: z.string().optional()
});

export const insertProjectSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  userId: z.number().optional(),
  status: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
}); 