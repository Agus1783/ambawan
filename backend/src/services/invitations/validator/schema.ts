import { z } from 'zod';

export const CreateInvitationSchema = z.object({
  email: z
    .string({ error: 'Email wajib diisi' })
    .email('Email tidak valid')
    .max(255, 'Email maksimal 255 karakter'),
  role_id: z
    .string({ error: 'role_id wajib diisi' })
    .min(1, 'role_id wajib diisi'),
  project_id: z
    .string({ error: 'project_id wajib diisi' })
    .min(1, 'project_id wajib diisi')
    .optional(),
});

export type CreateInvitationInput = z.infer<typeof CreateInvitationSchema>;
