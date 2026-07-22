import { z } from 'zod';

export const createLeaveSchema = z.object({
  employee: z.string().min(1),
  type: z.enum(['sick', 'casual', 'annual', 'maternity', 'paternity', 'unpaid', 'other']),
  fromDate: z.string().min(1),
  toDate: z.string().min(1),
  days: z.number().min(1),
  reason: z.string().min(1).trim(),
});

export const updateLeaveStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional(),
});
