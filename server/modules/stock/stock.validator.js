import { z } from 'zod';

export const createTransferSchema = z.object({
  fromBranchId: z.union([z.string(), z.number()]).transform(String),
  toBranchId: z.union([z.string(), z.number()]).transform(String),
  productId: z.union([z.string(), z.number()]).transform(String).optional(),
  imeiOrSerial: z.string().optional(),
  quantity: z.number().min(1).default(1).optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.union([z.string(), z.number()]).transform(String),
    imeiOrSerial: z.string().optional(),
    quantity: z.number().min(1).default(1),
  })).optional(),
});

export const updateTransferStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']),
});
