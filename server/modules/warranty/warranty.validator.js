import { z } from 'zod';

export const createWarrantyClaimSchema = z.object({
  imei: z.string().optional().nullable(),
  customer: z.string().min(1),
  productName: z.string().optional().nullable(),
  invoiceRef: z.string().optional().nullable(),
  claimType: z.enum(['repair', 'replacement', 'refund']),
  description: z.string().min(1).trim(),
  notes: z.string().optional().nullable(),
});

export const updateWarrantyClaimSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'completed']),
  resolution: z.string().optional(),
  notes: z.string().optional(),
});
