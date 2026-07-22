import { z } from 'zod';

export const createWarrantyClaimSchema = z.object({
  imei: z.string().min(1),
  customer: z.string().min(1),
  invoiceRef: z.string().optional(),
  claimType: z.enum(['repair', 'replacement', 'refund']),
  description: z.string().min(1).trim(),
  notes: z.string().optional(),
});

export const updateWarrantyClaimSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'completed']),
  resolution: z.string().optional(),
  notes: z.string().optional(),
});
