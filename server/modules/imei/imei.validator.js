import { z } from 'zod';

export const addInventoryUnitSchema = z.object({
  imeiOrSerial: z.string().min(1).trim(),
  productId: z.string().min(1),
  supplierId: z.string().optional(),
  branchId: z.string().optional(),
  purchasePrice: z.number().min(0),
  currentSellingPrice: z.number().min(0),
  warrantyMonths: z.number().min(0).default(12),
});

export const updateImeiStatusSchema = z.object({
  status: z.enum(['Available', 'Reserved', 'Sold', 'Returned', 'Returned to Supplier', 'Defective', 'Sent for Repair', 'Display Unit']),
});

export const priceDropSchema = z.object({
  productName: z.string().min(1),
  newSellingPrice: z.number().min(0),
});
