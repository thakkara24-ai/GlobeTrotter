import { z } from 'zod';

export const createTripSchema = z
  .object({
    title: z.string().min(2, 'Trip title is required').max(120),
    description: z.string().max(1000).optional().default(''),
    startDate: z.string().or(z.date()).transform((val) => new Date(val)),
    endDate: z.string().or(z.date()).transform((val) => new Date(val)),
    budget: z.number().min(0, 'Budget cannot be negative').default(0),
    coverImage: z.string().optional().default(''),
    isPublic: z.boolean().optional().default(false),
    status: z.enum(['PLANNING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional().default('PLANNING'),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date cannot be before start date',
    path: ['endDate'],
  });

export const updateTripSchema = z
  .object({
    title: z.string().min(2).max(120).optional(),
    description: z.string().max(1000).optional(),
    startDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    endDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    budget: z.number().min(0).optional(),
    coverImage: z.string().optional(),
    isPublic: z.boolean().optional(),
    status: z.enum(['PLANNING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date cannot be before start date',
      path: ['endDate'],
    }
  );
