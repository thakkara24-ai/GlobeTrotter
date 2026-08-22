import { z } from 'zod';

export const activityQuerySchema = z.object({
  city: z.string().trim().optional(),
  category: z
    .enum([
      'sightseeing',
      'food',
      'adventure',
      'culture',
      'shopping',
      'nature',
      'entertainment',
      'other',
    ])
    .optional(),
  search: z.string().trim().optional(),
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => Math.max(1, parseInt(val, 10) || 1)),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => Math.min(100, Math.max(1, parseInt(val, 10) || 20))),
});

export type ActivityQuery = z.infer<typeof activityQuerySchema>;
