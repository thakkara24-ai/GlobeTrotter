import { z } from 'zod';

export const createPostSchema = z.object({
  content: z
    .string({ required_error: 'Content is required' })
    .trim()
    .min(1, 'Content cannot be empty')
    .max(3000, 'Content must be at most 3000 characters'),
  images: z.array(z.string().url('Image must be a valid URL')).optional(),
  tripId: z.string().optional(),
  cityId: z.string().optional(),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(50)
        .toLowerCase()
    )
    .optional(),
});

export const updatePostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Content cannot be empty')
    .max(3000, 'Content must be at most 3000 characters')
    .optional(),
  images: z.array(z.string().url('Image must be a valid URL')).optional(),
  tripId: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(50)
        .toLowerCase()
    )
    .optional(),
});

export const createCommentSchema = z.object({
  content: z
    .string({ required_error: 'Comment content is required' })
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be at most 1000 characters'),
});

export const updateCommentSchema = z.object({
  content: z
    .string({ required_error: 'Comment content is required' })
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be at most 1000 characters'),
});

export const communityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  city: z.string().optional(),
  cityId: z.string().optional(),
  tag: z.string().optional(),
  author: z.string().optional(),
  authorId: z.string().optional(),
  search: z.string().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CommunityQueryInput = z.infer<typeof communityQuerySchema>;
