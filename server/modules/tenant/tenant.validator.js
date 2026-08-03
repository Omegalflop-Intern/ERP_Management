import { z } from 'zod';

export const createTenantSchema = z.object({
  shopName: z.string().min(2).max(100).trim(),
  ownerName: z.string().min(2).max(100).trim(),
  email: z.string().email(),
  phone: z.string().min(6).max(20).trim(),
  username: z
    .string()
    .min(3)
    .max(30)
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores')
    .optional(),
  plan: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']).optional().default('STARTER'),
  nidNumber: z.string().optional(),
  tradeLicenseNumber: z.string().optional(),
  password: z.string().min(8).optional(), // If creating owner user simultaneously
});

export const updateTenantStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'PENDING_KYC', 'DELETED']),
  rejectionReason: z.string().optional(),
});

export const verifyKycSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});
