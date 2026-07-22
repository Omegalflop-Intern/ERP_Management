import { z } from 'zod';

export const processPayrollSchema = z.object({
  employeeIds: z.array(z.string().min(1)).min(1),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  allowances: z.object({
    housing: z.number().min(0).default(0),
    transport: z.number().min(0).default(0),
    medical: z.number().min(0).default(0),
    food: z.number().min(0).default(0),
    other: z.number().min(0).default(0),
  }).optional(),
  deductions: z.object({
    advance: z.number().min(0).default(0),
    loan: z.number().min(0).default(0),
    tax: z.number().min(0).default(0),
    absentDeduction: z.number().min(0).default(0),
    other: z.number().min(0).default(0),
  }).optional(),
});

export const updatePayrollSchema = z.object({
  status: z.enum(['pending', 'paid']),
  notes: z.string().optional(),
});
