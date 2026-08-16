import { z } from 'zod';

export const createInvestorSchema = z.object({
  name: z.string().min(1).trim(),
  phone: z.string().min(1).trim(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  address: z.string().optional().nullable(),
  sharePercentage: z.coerce.number().min(0).max(100).optional().default(0),
  initialCapital: z.coerce.number().min(0).optional().default(0),
  paymentMethod: z.string().optional(),
  notes: z.string().optional().nullable(),
  status: z.string().optional(),
});

export const updateInvestorSchema = z.object({
  name: z.string().min(1).trim().optional(),
  phone: z.string().min(1).trim().optional(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  address: z.string().optional().nullable(),
  sharePercentage: z.coerce.number().min(0).max(100).optional(),
  status: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export const addTransactionSchema = z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'PROFIT_SHARE', 'PROFIT_PAYOUT', 'PROFIT_REINVESTMENT']),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  paymentMethod: z.string().optional(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
