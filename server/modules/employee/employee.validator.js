import { z } from 'zod';

export const createEmployeeSchema = z.object({
  userId: z.string().min(1),
  employeeId: z.string().min(1).trim(),
  name: z.string().min(1).trim(),
  phone: z.string().min(1).trim(),
  email: z.string().email().optional().or(z.literal('')),
  designation: z.string().min(1).trim(),
  department: z.string().min(1).trim(),
  salary: z.number().min(0),
  joiningDate: z.string().min(1),
  emergencyContact: z.string().optional(),
  address: z.string().optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']).default(''),
  nidNumber: z.string().optional(),
});

export const updateEmployeeSchema = z.object({
  userId: z.string().optional(),
  employeeId: z.string().min(1).trim().optional(),
  name: z.string().min(1).trim().optional(),
  phone: z.string().min(1).trim().optional(),
  email: z.string().email().optional().or(z.literal('')),
  designation: z.string().min(1).trim().optional(),
  department: z.string().min(1).trim().optional(),
  salary: z.number().min(0).optional(),
  joiningDate: z.string().optional(),
  emergencyContact: z.string().optional(),
  address: z.string().optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']).optional(),
  nidNumber: z.string().optional(),
  isActive: z.boolean().optional(),
});
