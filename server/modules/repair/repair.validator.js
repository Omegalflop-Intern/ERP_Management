import { z } from 'zod';

export const createRepairSchema = z.object({
  customerName: z.string().min(1).trim(),
  customerPhone: z.string().min(1).trim(),
  deviceModel: z.string().min(1).trim(),
  imeiOrSerial: z.string().optional(),
  issueDescription: z.string().min(1).trim(),
  estimatedCost: z.number().min(0),
  advancePaid: z.number().min(0).default(0),
  technicianName: z.string().optional(),
  partsUsed: z.array(z.object({
    partName: z.string(),
    cost: z.number().min(0),
  })).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['RECEIVED', 'INSPECTING', 'AWAITING_PARTS', 'REPAIRED', 'DELIVERED', 'CANCELLED']),
});

export const updateRepairSchema = z.object({
  customerName: z.string().min(1).trim().optional(),
  customerPhone: z.string().min(1).trim().optional(),
  deviceModel: z.string().min(1).trim().optional(),
  imeiOrSerial: z.string().optional(),
  issueDescription: z.string().min(1).trim().optional(),
  estimatedCost: z.number().min(0).optional(),
  advancePaid: z.number().min(0).optional(),
  technicianName: z.string().optional(),
  partsUsed: z.array(z.object({
    partName: z.string(),
    cost: z.number().min(0),
  })).optional(),
  status: z.enum(['RECEIVED', 'INSPECTING', 'AWAITING_PARTS', 'REPAIRED', 'DELIVERED', 'CANCELLED']).optional(),
});
