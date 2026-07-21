import { z } from 'zod';

export const createWholesalePriceSchema = z.object({
  product: z.string().min(1),
  tier: z.string().min(1).trim(),
  minQty: z.number().int().min(1),
  maxQty: z.number().int().optional(),
  price: z.number().min(0),
});

export const updateWholesalePriceSchema = z.object({
  tier: z.string().min(1).trim().optional(),
  minQty: z.number().int().min(1).optional(),
  maxQty: z.number().int().optional(),
  price: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const createWholesaleOrderSchema = z.object({
  customer: z.string().min(1),
  items: z.array(z.object({
    product: z.string().min(1),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
  })).min(1),
  discount: z.number().min(0).default(0),
  paymentMethod: z.enum(['CASH', 'BKASH', 'ROCKET', 'NAGAD', 'BANK', 'CHEQUE']).default('CASH'),
  paidAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export const updateWholesaleOrderSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  paidAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
});
