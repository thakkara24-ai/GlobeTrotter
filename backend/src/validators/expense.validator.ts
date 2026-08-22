import { z } from 'zod';

const currencyRegex = /^[A-Z]{3}$/;

export const expenseCategories = [
  'TRANSPORT',
  'ACCOMMODATION',
  'FOOD',
  'ACTIVITY',
  'SHOPPING',
  'ENTERTAINMENT',
  'OTHER',
] as const;

export const updateBudgetSchema = z.object({
  totalBudget: z
    .number({ required_error: 'totalBudget is required', invalid_type_error: 'totalBudget must be a number' })
    .min(0, 'Total budget cannot be negative'),
  currency: z
    .string({ required_error: 'currency is required' })
    .trim()
    .toUpperCase()
    .regex(currencyRegex, 'Currency must be a 3-letter uppercase code (e.g. USD, INR, EUR)'),
});

export const createExpenseSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title must be at least 1 character')
    .max(300, 'Title must be at most 300 characters'),
  amount: z
    .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(currencyRegex, 'Currency must be a 3-letter uppercase code (e.g. USD, INR, EUR)')
    .optional(),
  category: z.enum(expenseCategories, {
    errorMap: () => ({
      message: 'Category must be one of: TRANSPORT, ACCOMMODATION, FOOD, ACTIVITY, SHOPPING, ENTERTAINMENT, OTHER',
    }),
  }),
  date: z
    .string({ required_error: 'Date is required' })
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes must be at most 2000 characters')
    .optional()
    .default(''),
});

export const updateExpenseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title must be at least 1 character')
    .max(300, 'Title must be at most 300 characters')
    .optional(),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0')
    .optional(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(currencyRegex, 'Currency must be a 3-letter uppercase code (e.g. USD, INR, EUR)')
    .optional(),
  category: z
    .enum(expenseCategories, {
      errorMap: () => ({
        message: 'Category must be one of: TRANSPORT, ACCOMMODATION, FOOD, ACTIVITY, SHOPPING, ENTERTAINMENT, OTHER',
      }),
    })
    .optional(),
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' })
    .optional(),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes must be at most 2000 characters')
    .optional(),
});

export const expenseQuerySchema = z.object({
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
  category: z
    .enum(expenseCategories, {
      errorMap: () => ({ message: 'Invalid category filter' }),
    })
    .optional(),
  fromDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid fromDate' })
    .optional(),
  toDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid toDate' })
    .optional(),
});

export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQuery = z.infer<typeof expenseQuerySchema>;
