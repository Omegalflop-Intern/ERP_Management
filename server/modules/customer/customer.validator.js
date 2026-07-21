import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1).trim(),
  phone: z.string().min(1).trim(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  customerType: z.enum(['INDIVIDUAL', 'B2B']).optional(),
  companyName: z.string().optional(),
  binOrTaxId: z.string().optional(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).trim().optional(),
  phone: z.string().min(1).trim().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  customerType: z.enum(['INDIVIDUAL', 'B2B']).optional(),
  companyName: z.string().optional(),
  binOrTaxId: z.string().optional(),
  notes: z.string().optional(),
});

export const collectDueSchema = z.object({
  amount: z.number().min(0.01),
  paymentMethod: z.enum(['cash', 'bkash', 'rocket', 'nagad', 'bank']),
});
