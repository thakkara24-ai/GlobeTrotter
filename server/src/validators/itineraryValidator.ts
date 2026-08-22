import { z } from 'zod';

export const createStopSchema = z
  .object({
    cityId: z.string().min(1, 'City ID is required'),
    startDate: z.string().or(z.date()).transform((val) => new Date(val)),
    endDate: z.string().or(z.date()).transform((val) => new Date(val)),
    order: z.number().optional().default(0),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'Stop end date cannot be before start date',
    path: ['endDate'],
  });

export const updateStopSchema = z
  .object({
    cityId: z.string().optional(),
    startDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    endDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    order: z.number().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'Stop end date cannot be before start date',
      path: ['endDate'],
    }
  );

export const createSectionSchema = z.object({
  stopId: z.string().optional(),
  type: z.enum(['Travel', 'Hotel', 'Activity', 'Meals', 'Other']),
  title: z.string().min(1, 'Section title is required').max(200),
  description: z.string().optional().default(''),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  startTime: z.string().optional().default('09:00'),
  endTime: z.string().optional().default(''),
  estimatedCost: z.number().min(0, 'Estimated cost cannot be negative').default(0),
  activityId: z.string().optional(),
  order: z.number().optional().default(0),
});

export const updateSectionSchema = z.object({
  stopId: z.string().optional(),
  type: z.enum(['Travel', 'Hotel', 'Activity', 'Meals', 'Other']).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  date: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  estimatedCost: z.number().min(0).optional(),
  activityId: z.string().optional(),
  order: z.number().optional(),
});
