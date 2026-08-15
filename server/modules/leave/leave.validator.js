import { z } from 'zod';

export const createLeaveSchema = z.object({
  employee: z.union([z.string(), z.number()]).optional(),
  employeeId: z.union([z.string(), z.number()]).optional(),
  type: z.enum(['sick', 'casual', 'annual', 'maternity', 'paternity', 'unpaid', 'other']),
  fromDate: z.string().min(1),
  toDate: z.string().min(1),
  days: z.number().min(1).optional(),
  reason: z.string().min(1).trim(),
  branchId: z.union([z.string(), z.number()]).optional().nullable(),
});

export const updateLeaveStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional(),
});
