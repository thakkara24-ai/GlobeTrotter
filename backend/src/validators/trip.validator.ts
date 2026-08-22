import { z } from 'zod';

export const createTripSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(1, 'Title must be at least 1 character')
      .max(300, 'Title must be at most 300 characters'),
    description: z
      .string()
      .trim()
      .max(2000, 'Description must be at most 2000 characters')
      .optional()
      .default(''),
    startDate: z
      .string({ required_error: 'Start date is required' })
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date' }),
    endDate: z
      .string({ required_error: 'End date is required' })
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date' }),
    coverImage: z.string().url('Cover image must be a valid URL').optional(),
    cities: z.array(z.string()).optional().default([]),
    activities: z.array(z.string()).optional().default([]),
    status: z
      .enum(['PLANNING', 'UPCOMING', 'ONGOING', 'COMPLETED'])
      .optional()
      .default('PLANNING'),
    travelers: z
      .number()
      .int('Travelers must be an integer')
      .min(1, 'Travelers must be at least 1')
      .optional()
      .default(1),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start <= end;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

export const updateTripSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title must be at least 1 character')
      .max(300, 'Title must be at most 300 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(2000, 'Description must be at most 2000 characters')
      .optional(),
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date' })
      .optional(),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date' })
      .optional(),
    coverImage: z.string().url('Cover image must be a valid URL').optional().nullable(),
    cities: z.array(z.string()).optional(),
    activities: z.array(z.string()).optional(),
    status: z.enum(['PLANNING', 'UPCOMING', 'ONGOING', 'COMPLETED']).optional(),
    travelers: z
      .number()
      .int('Travelers must be an integer')
      .min(1, 'Travelers must be at least 1')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
