import { z } from 'zod';

export const createAccountSchema = z.object({
  code: z.string().min(1).trim().toUpperCase(),
  name: z.string().min(1).trim(),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  subType: z.enum([
    'CURRENT_ASSET', 'FIXED_ASSET',
    'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY',
    'OWNERS_EQUITY', 'RETAINED_EARNINGS',
    'SALES_REVENUE', 'OTHER_REVENUE',
    'COST_OF_GOODS', 'OPERATING_EXPENSE', 'OTHER_EXPENSE',
  ]),
  parentId: z.string().optional().nullable(),
  description: z.string().optional(),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1).trim().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

const journalLineSchema = z.object({
  accountId: z.string().min(1),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  description: z.string().optional(),
});

export const createJournalEntrySchema = z.object({
  date: z.string().optional(),
  description: z.string().min(1),
  reference: z.string().optional(),
  lines: z.array(journalLineSchema).min(2),
});

export const postJournalEntrySchema = z.object({
  postedBy: z.string().optional(),
});
