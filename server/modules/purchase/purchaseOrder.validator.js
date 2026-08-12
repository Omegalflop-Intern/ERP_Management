import { z } from 'zod';

const lineItemSchema = z.object({
  productId: z.string().min(1),
  description: z.string().min(1),
  qty: z.number().int().min(1),
  unitCost: z.number().min(0),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1),
  branchId: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  paymentMethod: z.enum(['CASH', 'BANK', 'BKASH', 'ROCKET', 'NAGAD', 'CREDIT']).default('CREDIT'),
  paidAmount: z.number().min(0).default(0),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePurchaseOrderSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'CANCELLED']).optional(),
  discount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  paidAmount: z.number().min(0).optional(),
  paymentMethod: z.enum(['CASH', 'BANK', 'BKASH', 'ROCKET', 'NAGAD', 'CREDIT']).optional(),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
});

const grnItemSchema = z.object({
  imeiOrSerial: z.string().min(1),
  productId: z.string().min(1),
  purchasePrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  warrantyMonths: z.number().min(0).default(12),
});

export const receiveGoodsSchema = z.object({
  grnEntries: z.array(grnItemSchema).min(1),
});
