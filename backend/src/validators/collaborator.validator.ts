import { z } from 'zod';
import { CollaboratorRole } from '../models/TripCollaborator';

export const addCollaboratorSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Invalid email address format')
      .optional(),
    userId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
      .optional(),
    role: z
      .nativeEnum(CollaboratorRole, {
        errorMap: () => ({
          message: 'Role must be either VIEWER or EDITOR',
        }),
      })
      .default(CollaboratorRole.VIEWER),
  })
  .refine((data) => data.email !== undefined || data.userId !== undefined, {
    message: 'Either email or userId must be provided to add a collaborator',
  });

export const updateCollaboratorRoleSchema = z.object({
  role: z.nativeEnum(CollaboratorRole, {
    errorMap: () => ({
      message: 'Role must be either VIEWER or EDITOR',
    }),
  }),
});

export type AddCollaboratorInput = z.infer<typeof addCollaboratorSchema>;
export type UpdateCollaboratorRoleInput = z.infer<
  typeof updateCollaboratorRoleSchema
>;
