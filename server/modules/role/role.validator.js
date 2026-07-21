import { z } from 'zod';
import { ALL_PERMISSIONS } from './role.model.js';

export const createRoleSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  displayName: z.string().min(1).max(100).trim(),
  description: z.string().optional(),
  permissions: z.array(z.enum(ALL_PERMISSIONS)).default([]),
});

export const updateRoleSchema = z.object({
  displayName: z.string().min(1).max(100).trim().optional(),
  description: z.string().optional(),
  permissions: z.array(z.enum(ALL_PERMISSIONS)).optional(),
});
