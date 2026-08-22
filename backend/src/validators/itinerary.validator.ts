import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

export const createStopSchema = z
  .object({
    cityId: z
      .string({ required_error: 'City ID is required' })
      .regex(objectIdRegex, 'Invalid city ID format'),
    startDate: z
      .string({ required_error: 'Start date is required' })
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date' }),
    endDate: z
      .string({ required_error: 'End date is required' })
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date' }),
    order: z.number().int().positive('Order must be a positive integer').optional(),
  })
  .refine(
    (data) => new Date(data.startDate) <= new Date(data.endDate),
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

export const updateStopSchema = z
  .object({
    cityId: z.string().regex(objectIdRegex, 'Invalid city ID format').optional(),
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date' })
      .optional(),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date' })
      .optional(),
    order: z.number().int().positive('Order must be a positive integer').optional(),
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

export const reorderStopsSchema = z.object({
  stopIds: z
    .array(z.string().regex(objectIdRegex, 'Invalid stop ID format'), {
      required_error: 'stopIds array is required',
    })
    .min(1, 'stopIds must contain at least one stop ID'),
});

export const createSectionSchema = z
  .object({
    type: z
      .enum(['ACTIVITY', 'MEAL', 'TRANSPORT', 'OTHER'], {
        errorMap: () => ({ message: 'Type must be ACTIVITY, MEAL, TRANSPORT, or OTHER' }),
      })
      .optional()
      .default('ACTIVITY'),
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
    date: z
      .string({ required_error: 'Date is required' })
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
    startTime: z
      .string()
      .regex(timeRegex, 'Start time must be in HH:MM format (e.g. 14:30)')
      .optional()
      .nullable(),
    endTime: z
      .string()
      .regex(timeRegex, 'End time must be in HH:MM format (e.g. 16:30)')
      .optional()
      .nullable(),
    estimatedCost: z
      .number({ invalid_type_error: 'Estimated cost must be a number' })
      .min(0, 'Estimated cost cannot be negative')
      .optional()
      .default(0),
    activityId: z
      .string()
      .regex(objectIdRegex, 'Invalid activity ID format')
      .optional()
      .nullable(),
    order: z.number().int().positive('Order must be a positive integer').optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.startTime <= data.endTime;
      }
      return true;
    },
    {
      message: 'Start time cannot be after end time',
      path: ['endTime'],
    }
  );

export const updateSectionSchema = z
  .object({
    type: z
      .enum(['ACTIVITY', 'MEAL', 'TRANSPORT', 'OTHER'], {
        errorMap: () => ({ message: 'Type must be ACTIVITY, MEAL, TRANSPORT, or OTHER' }),
      })
      .optional(),
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
    date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' })
      .optional(),
    startTime: z
      .string()
      .regex(timeRegex, 'Start time must be in HH:MM format (e.g. 14:30)')
      .optional()
      .nullable(),
    endTime: z
      .string()
      .regex(timeRegex, 'End time must be in HH:MM format (e.g. 16:30)')
      .optional()
      .nullable(),
    estimatedCost: z
      .number({ invalid_type_error: 'Estimated cost must be a number' })
      .min(0, 'Estimated cost cannot be negative')
      .optional(),
    activityId: z
      .string()
      .regex(objectIdRegex, 'Invalid activity ID format')
      .optional()
      .nullable(),
    order: z.number().int().positive('Order must be a positive integer').optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.startTime <= data.endTime;
      }
      return true;
    },
    {
      message: 'Start time cannot be after end time',
      path: ['endTime'],
    }
  );

export const reorderSectionsSchema = z.object({
  sectionIds: z
    .array(z.string().regex(objectIdRegex, 'Invalid section ID format'), {
      required_error: 'sectionIds array is required',
    })
    .min(1, 'sectionIds must contain at least one section ID'),
});

export const dateRangeQuerySchema = z
  .object({
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid startDate format' })
      .optional(),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid endDate format' })
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
      message: 'Start date cannot be after end date',
      path: ['endDate'],
    }
  );

export type CreateStopInput = z.infer<typeof createStopSchema>;
export type UpdateStopInput = z.infer<typeof updateStopSchema>;
export type ReorderStopsInput = z.infer<typeof reorderStopsSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type ReorderSectionsInput = z.infer<typeof reorderSectionsSchema>;
export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;

