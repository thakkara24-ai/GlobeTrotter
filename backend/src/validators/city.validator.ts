import { z } from 'zod';

export const cityQuerySchema = z.object({
  search: z.string().trim().optional(),
  country: z.string().trim().optional(),
  tags: z.string().trim().optional(), // comma-separated
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

export type CityQuery = z.infer<typeof cityQuerySchema>;
