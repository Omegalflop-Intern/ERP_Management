import { z } from 'zod';

export const createCatalogItemSchema = z.object({
  name: z.string().min(1).trim(),
  type: z.enum(['CATEGORY', 'BRAND']),
});

export const updateCatalogItemSchema = z.object({
  name: z.string().min(1).trim(),
});

export const bulkCreateCatalogSchema = z.object({
  items: z.array(z.object({
    name: z.string().min(1).trim(),
    type: z.enum(['CATEGORY', 'BRAND']),
  })),
});
