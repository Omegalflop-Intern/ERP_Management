import { z } from 'zod';

export const createLoanSchema = z.object({
  type: z.enum(['LOAN_TAKEN', 'LOAN_GIVEN']).optional(),
  providerName: z.string().min(1).trim(),
  accountNumber: z.string().optional(),
  phone: z.string().optional(),
  loanAmount: z.number().positive('Loan amount must be greater than 0'),
  interestRate: z.number().min(0).max(100).optional(),
  installmentCount: z.number().int().min(1).optional(),
  dueDate: z.string().optional(),
  borrowedDate: z.string().optional(),
  notes: z.string().optional(),
});

export const repayLoanSchema = z.object({
  amount: z.number().positive('Repayment amount must be greater than 0'),
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});
