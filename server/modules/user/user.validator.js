import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(3).max(30).trim(),
  email: z.string().email(),
  phone: z.string().transform((val) => (!val || !val.trim() ? undefined : val.trim())).optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.string().min(1, 'Role is required'),
  fullName: z.string().transform((val) => (!val || !val.trim() ? undefined : val.trim())).optional(),
  commissionRate: z.preprocess((val) => (val === '' || val === undefined || val === null ? 0 : Number(val)), z.number().min(0).max(100)).default(0),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(30).trim().optional(),
  email: z.string().email().optional(),
  phone: z.string().transform((val) => (!val || !val.trim() ? undefined : val.trim())).optional(),
  role: z.string().optional(),
  fullName: z.string().transform((val) => (!val || !val.trim() ? undefined : val.trim())).optional(),
  isActive: z.boolean().optional(),
  commissionRate: z.preprocess((val) => (val === '' || val === undefined || val === null ? undefined : Number(val)), z.number().min(0).max(100).optional()),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});
