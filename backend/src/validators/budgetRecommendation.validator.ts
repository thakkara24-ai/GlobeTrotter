import { z } from 'zod';

export const budgetRecommendationQuerySchema = z.object({
  style: z
    .enum(['budget', 'standard', 'comfortable', 'premium'], {
      errorMap: () => ({
        message:
          "Invalid budget style. Allowed values are 'budget', 'standard', 'comfortable', 'premium'",
      }),
    })
    .default('standard'),
  travelers: z.coerce
    .number()
    .int('Travelers must be an integer')
    .min(1, 'Travelers must be at least 1')
    .max(100, 'Travelers cannot exceed 100')
    .optional(),
});

export type BudgetRecommendationQueryInput = z.infer<
  typeof budgetRecommendationQuerySchema
>;
