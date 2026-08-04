import { z } from 'zod';

const lineItemSchema = z.object({
  productId: z.string().min(1),
  imeiOrSerial: z.string().optional(),
  description: z.string().min(1),
  qty: z.number().min(1).default(1),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).default(0),
});

export const createSaleSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  customerAddress: z.string().optional(),
  customerId: z.string().optional(),
  items: z.array(lineItemSchema).min(1, 'At least one item required'),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  paymentBreakdown: z.object({
    cash: z.number().min(0).default(0),
    bkash: z.number().min(0).default(0),
    rocket: z.number().min(0).default(0),
    nagad: z.number().min(0).default(0),
    bank: z.number().min(0).default(0),
    dueAmount: z.number().min(0).default(0),
  }).default({ cash: 0, bkash: 0, rocket: 0, nagad: 0, bank: 0, dueAmount: 0 }),
});

export const updateSaleSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  customerAddress: z.string().optional(),
  customerId: z.string().optional(),
  saleType: z.enum(['RETAIL', 'WHOLESALE']).optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    imeiOrSerial: z.string().optional(),
    description: z.string().min(1),
    qty: z.number().min(1).default(1),
    unitPrice: z.number().min(0),
    unitCost: z.number().min(0).default(0),
  })).min(1, 'At least one item required').optional(),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  paymentBreakdown: z.object({
    cash: z.number().min(0).default(0),
    bkash: z.number().min(0).default(0),
    rocket: z.number().min(0).default(0),
    nagad: z.number().min(0).default(0),
    bank: z.number().min(0).default(0),
    dueAmount: z.number().min(0).default(0),
  }).optional(),
});

export const returnSaleSchema = z.object({
  items: z.array(z.object({
    lineItemId: z.string().optional(),
    productId: z.string().optional(),
    imeiOrSerial: z.string().optional(),
    quantity: z.number().min(1).default(1),
    reason: z.enum(['defective', 'wrong_item', 'change_of_mind', 'other']).default('other'),
    notes: z.string().optional(),
  })).min(1),
});
