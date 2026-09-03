import { z } from 'zod';

const subdomainRegex = /^[a-z0-9-]+$/;

const cleanString = (val) => (typeof val === 'string' && val.trim() ? val.trim() : undefined);
const cleanLowerString = (val) => (typeof val === 'string' && val.trim() ? val.trim().toLowerCase() : undefined);
const cleanUpperString = (val) => (typeof val === 'string' && val.trim() ? val.trim().toUpperCase() : undefined);

export const createTenantSchema = z.object({
  shopName: z.string().min(2, 'Shop name must be at least 2 characters').max(100).trim(),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters').max(100).trim(),
  email: z.string().trim().toLowerCase().email('Please provide a valid email address'),
  phone: z.string().min(6, 'Phone number must be at least 6 characters').max(20).trim(),
  username: z
    .preprocess(
      cleanLowerString,
      z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores')
        .optional()
    ),
  plan: z
    .preprocess(
      cleanUpperString,
      z.enum(['FREE', 'STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE']).optional()
    )
    .default('STARTER'),
  selectedPlan: z
    .preprocess(
      cleanUpperString,
      z.enum(['FREE', 'STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE']).optional()
    ),
  billingCycle: z
    .preprocess(
      cleanLowerString,
      z.enum(['monthly', 'yearly']).optional()
    )
    .default('monthly'),
  durationDays: z
    .preprocess(
      (val) => (val !== undefined && val !== null && val !== '' ? Number(val) : undefined),
      z.number().int().min(1).optional()
    ),
  subdomain: z
    .preprocess(
      cleanLowerString,
      z
        .string()
        .min(3, 'Subdomain must be at least 3 characters')
        .max(63, 'Subdomain must be at most 63 characters')
        .regex(subdomainRegex, 'Only lowercase letters, numbers, and hyphens')
        .refine((v) => !v.startsWith('-') && !v.endsWith('-'), 'Cannot start or end with hyphen')
        .optional()
    ),
  customDomain: z.preprocess(cleanLowerString, z.string().optional()),
  password: z.preprocess(
    cleanString,
    z.string().min(6, 'Password must be at least 6 characters').optional()
  ),
  expiresAt: z.preprocess(
    cleanString,
    z.string().datetime({ offset: true }).or(z.null()).optional()
  ),
  address: z.preprocess(cleanString, z.string().optional()),
  platformAddress: z.preprocess(cleanString, z.string().optional()),
  maxUsers: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== '' ? Number(val) : undefined),
    z.number().int().min(1).max(9999).optional()
  ),
  notes: z.preprocess(cleanString, z.string().max(500).optional()),
});

export const updateTenantSchema = z.object({
  shopName: z.string().min(2, 'Shop name must be at least 2 characters').max(100).trim().optional(),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters').max(100).trim().optional(),
  email: z.string().trim().toLowerCase().email('Please provide a valid email address').optional(),
  username: z
    .preprocess(
      cleanLowerString,
      z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores')
        .optional()
    ),
  phone: z.string().min(6, 'Phone number must be at least 6 characters').max(20).trim().optional(),
  password: z.preprocess(
    cleanString,
    z.string().min(6, 'Password must be at least 6 characters').optional()
  ),
  plan: z
    .preprocess(
      cleanUpperString,
      z.enum(['FREE', 'STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE']).optional()
    ),
  subdomain: z
    .preprocess(
      cleanLowerString,
      z
        .string()
        .min(3, 'Subdomain must be at least 3 characters')
        .max(63, 'Subdomain must be at most 63 characters')
        .regex(subdomainRegex, 'Only lowercase letters, numbers, and hyphens')
        .refine((v) => !v.startsWith('-') && !v.endsWith('-'), 'Cannot start or end with hyphen')
        .optional()
    ),
  customDomain: z.preprocess(cleanLowerString, z.string().optional()),
  maxUsers: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== '' ? Number(val) : undefined),
    z.number().int().min(1).max(9999).optional()
  ),
  expiresAt: z.preprocess(
    cleanString,
    z.string().datetime({ offset: true }).or(z.null()).optional()
  ),
  notes: z.preprocess(cleanString, z.string().max(500).optional()),
});

export const updateTenantStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']),
  rejectionReason: z.string().optional(),
});

export const verifyKycSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});
