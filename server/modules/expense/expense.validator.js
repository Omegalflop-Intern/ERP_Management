import { z } from 'zod';

export const createExpenseSchema = z.object({
  title: z.string().min(1).trim(),
  category: z.string().optional(),
  amount: z.number().positive('Amount must be greater than 0'),
  paymentMethod: z.string().optional(),
  date: z.string().optional(),
  voucherNumber: z.string().optional(),
  notes: z.string().optional(),
  branchId: z.string().optional(),
});

export const updateExpenseSchema = z.object({
  title: z.string().min(1).trim().optional(),
  category: z.string().optional(),
  amount: z.number().positive('Amount must be greater than 0').optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});
