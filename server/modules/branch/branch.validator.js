import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().min(1).trim(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  manager: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateBranchSchema = z.object({
  name: z.string().min(1).trim().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  manager: z.string().optional(),
  isActive: z.boolean().optional(),
});
