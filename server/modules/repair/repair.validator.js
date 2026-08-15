import { z } from 'zod';

const numberOrString = z.preprocess((val) => {
  if (val === '' || val === undefined || val === null) return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}, z.number().min(0));

export const createRepairSchema = z.object({
  customerName: z.string().min(1).trim(),
  customerPhone: z.string().min(1).trim(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  deviceModel: z.string().min(1).trim(),
  imeiOrSerial: z.string().optional().nullable(),
  issueDescription: z.string().min(1).trim(),
  estimatedCost: numberOrString.default(0),
  advancePaid: numberOrString.default(0),
  technicianName: z.string().optional().nullable(),
  partsUsed: z.array(z.object({
    partName: z.string(),
    cost: numberOrString,
  })).optional(),
  status: z.enum(['RECEIVED', 'INSPECTING', 'AWAITING_PARTS', 'REPAIRED', 'DELIVERED', 'CANCELLED']).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['RECEIVED', 'INSPECTING', 'AWAITING_PARTS', 'REPAIRED', 'DELIVERED', 'CANCELLED']),
});

export const updateRepairSchema = z.object({
  customerName: z.string().min(1).trim().optional(),
  customerPhone: z.string().min(1).trim().optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  deviceModel: z.string().min(1).trim().optional(),
  imeiOrSerial: z.string().optional().nullable(),
  issueDescription: z.string().min(1).trim().optional(),
  estimatedCost: numberOrString.optional(),
  advancePaid: numberOrString.optional(),
  technicianName: z.string().optional().nullable(),
  partsUsed: z.array(z.object({
    partName: z.string(),
    cost: numberOrString,
  })).optional(),
  status: z.enum(['RECEIVED', 'INSPECTING', 'AWAITING_PARTS', 'REPAIRED', 'DELIVERED', 'CANCELLED']).optional(),
});
