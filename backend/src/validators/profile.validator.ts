import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .optional(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain alphanumeric characters and underscores'
    )
    .optional(),
  avatar: z.string().url('Avatar must be a valid URL').optional().nullable(),
  bio: z
    .string()
    .trim()
    .max(500, 'Bio must be at most 500 characters')
    .optional(),
  location: z
    .string()
    .trim()
    .max(100, 'Location must be at most 100 characters')
    .optional(),
  country: z
    .string()
    .trim()
    .max(100, 'Country must be at most 100 characters')
    .optional(),
  travelInterests: z.array(z.string().trim().min(1)).optional(),
  preferredTravelStyle: z
    .string()
    .trim()
    .max(50, 'Travel style must be at most 50 characters')
    .optional(),
  languagePreference: z.string().trim().min(2).max(10).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
