import { z } from 'zod';

export const createTransferSchema = z.object({
  fromBranchId: z.string().min(1),
  toBranchId: z.string().min(1),
  productId: z.string().min(1),
  imeiOrSerial: z.string().optional(),
  quantity: z.number().min(1).default(1),
  notes: z.string().optional(),
});

export const updateTransferStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']),
});
