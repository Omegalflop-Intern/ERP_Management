import { z } from 'zod';

export const checkInSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  notes: z.string().optional(),
});

export const checkOutSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

export const updateAttendanceSchema = z.object({
  status: z.enum(['present', 'absent', 'late', 'half-day']).optional(),
  notes: z.string().optional(),
});
