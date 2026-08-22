import { z } from 'zod';

export const updateLocationSchema = z.object({
  latitude: z
    .number({
      required_error: 'Latitude is required',
      invalid_type_error: 'Latitude must be a number',
    })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number({
      required_error: 'Longitude is required',
      invalid_type_error: 'Longitude must be a number',
    })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
});

export const nearbyQuerySchema = z.object({
  latitude: z
    .string({ required_error: 'latitude query parameter is required' })
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= -90 && val <= 90, {
      message: 'latitude must be a valid number between -90 and 90',
    }),
  longitude: z
    .string({ required_error: 'longitude query parameter is required' })
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= -180 && val <= 180, {
      message: 'longitude must be a valid number between -180 and 180',
    }),
  radius: z
    .string()
    .optional()
    .default('50000')
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val > 0 && val <= 10000000, {
      message: 'radius must be a positive number up to 10,000,000 meters',
    }),
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

export const distanceQuerySchema = z.object({
  fromLatitude: z
    .string({ required_error: 'fromLatitude is required' })
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= -90 && val <= 90, {
      message: 'fromLatitude must be a valid number between -90 and 90',
    }),
  fromLongitude: z
    .string({ required_error: 'fromLongitude is required' })
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= -180 && val <= 180, {
      message: 'fromLongitude must be a valid number between -180 and 180',
    }),
  toLatitude: z
    .string({ required_error: 'toLatitude is required' })
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= -90 && val <= 90, {
      message: 'toLatitude must be a valid number between -90 and 90',
    }),
  toLongitude: z
    .string({ required_error: 'toLongitude is required' })
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= -180 && val <= 180, {
      message: 'toLongitude must be a valid number between -180 and 180',
    }),
});

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;
export type DistanceQuery = z.infer<typeof distanceQuerySchema>;
