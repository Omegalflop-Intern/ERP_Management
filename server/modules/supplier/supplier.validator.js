import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1).trim(),
  phone: z.string().min(1).trim(),
  email: z.string().email().optional().or(z.literal('')),
  company: z.string().optional(),
  address: z.string().optional(),
  dueBalance: z.number().min(0).default(0),
  paymentTerms: z.enum(['CASH', 'NET15', 'NET30', 'NET60']).default('CASH'),
  notes: z.string().optional(),
});

export const updateSupplierSchema = z.object({
  name: z.string().min(1).trim().optional(),
  phone: z.string().min(1).trim().optional(),
  email: z.string().email().optional().or(z.literal('')),
  company: z.string().optional(),
  address: z.string().optional(),
  dueBalance: z.number().min(0).optional(),
  paymentTerms: z.enum(['CASH', 'NET15', 'NET30', 'NET60']).optional(),
  notes: z.string().optional(),
});
