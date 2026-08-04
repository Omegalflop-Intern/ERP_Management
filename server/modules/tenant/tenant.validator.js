import { z } from 'zod';

export const createTenantSchema = z.object({
  shopName: z.string().min(2).max(100).trim(),
  ownerName: z.string().min(2).max(100).trim(),
  email: z.string().trim().toLowerCase().email('Please provide a valid email address'),
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

export const updateTenantSchema = z.object({
  shopName: z.string().min(2).max(100).trim().optional(),
  ownerName: z.string().min(2).max(100).trim().optional(),
  phone: z.string().min(6).max(20).trim().optional(),
  plan: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']).optional(),
  maxBranches: z.number().int().min(1).max(50).optional(),
  maxUsers: z.number().int().min(1).max(500).optional(),
  expiresAt: z.string().datetime({ offset: true }).or(z.null()).optional(),
  notes: z.string().max(500).optional(),
});

export const updateTenantStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'PENDING_KYC', 'DELETED']),
  rejectionReason: z.string().optional(),
});

export const verifyKycSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});
