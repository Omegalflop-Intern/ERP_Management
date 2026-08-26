import { z } from 'zod';

const lineItemSchema = z.object({
  productId: z.union([z.string(), z.number()]).optional(),
  name: z.string().optional(),
  productName: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  qty: z.number().min(1),
  unitCost: z.number().min(0),
  sellingPrice: z.number().min(0).optional(),
  wholesalePrice: z.number().min(0).optional().nullable(),
  imeis: z.array(z.string()).optional(),
  imeiList: z.array(z.string()).optional(),
  imeiOrSerials: z.array(z.string()).optional(),
  receivedQty: z.number().optional(),
});

const paymentBreakdownSchema = z.object({
  cash: z.number().min(0).default(0),
  bkash: z.number().min(0).default(0),
  nagad: z.number().min(0).default(0),
  rocket: z.number().min(0).default(0),
  bank: z.number().min(0).default(0),
}).optional();

export const createPurchaseOrderSchema = z.object({
  supplierId: z.union([z.string(), z.number()]).optional(),
  supplierName: z.string().optional(),
  supplierPhone: z.string().optional(),
  supplierCompany: z.string().optional(),
  branchId: z.union([z.string(), z.number()]).optional().nullable(),
  lineItems: z.array(lineItemSchema).min(1),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  paymentMethod: z.enum(['CASH', 'BANK', 'BKASH', 'ROCKET', 'NAGAD', 'CREDIT', 'SPLIT']).default('CREDIT'),
  paidAmount: z.number().min(0).default(0),
  paymentBreakdown: paymentBreakdownSchema,
  expectedDeliveryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updatePurchaseOrderSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'RECEIVED', 'PARTIALLY_RECEIVED', 'CANCELLED']).optional(),
  discount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  paidAmount: z.number().min(0).optional(),
  paymentMethod: z.enum(['CASH', 'BANK', 'BKASH', 'ROCKET', 'NAGAD', 'CREDIT']).optional(),
  expectedDeliveryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const grnItemSchema = z.object({
  imeiOrSerial: z.string().min(1),
  productId: z.union([z.string(), z.number()]),
  purchasePrice: z.number().min(0),
  sellingPrice: z.number().min(0).optional(),
  warrantyMonths: z.number().min(0).default(12),
});

export const receiveGoodsSchema = z.object({
  grnEntries: z.array(grnItemSchema).min(1),
});

export const returnToSupplierSchema = z.object({
  items: z.array(z.object({
    productId: z.union([z.string(), z.number()]).optional(),
    qty: z.number().min(1).optional(),
    refundAmount: z.number().min(0).optional(),
    unitCost: z.number().min(0).optional(),
    imeiOrSerial: z.string().optional(),
    description: z.string().optional(),
    reason: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
  imeiOrSerials: z.array(z.string()).optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});
