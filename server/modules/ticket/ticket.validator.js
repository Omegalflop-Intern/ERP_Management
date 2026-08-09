import { z } from 'zod';

export const createTicketSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(255),
  category: z.enum(['General', 'Technical', 'Billing', 'Hardware', 'Software']).optional().default('General'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email('Invalid email address').optional().nullable(),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  resolutionNotes: z.string().optional().nullable(),
});
