import { z } from 'zod';

export const CreateWorkspaceSchema = z.object({
  name: z
    .string({ error: 'Nama workspace wajib diisi' })
    .min(1, 'Nama workspace wajib diisi')
    .max(150, 'Nama workspace maksimal 150 karakter'),
  industry_id: z
    .string({ error: 'industry_id wajib diisi' })
    .min(1, 'industry_id wajib diisi'),
});

export const UpdateWorkspaceSchema = z
  .object({
    name: z
      .string({ error: 'Nama workspace wajib diisi' })
      .min(1, 'Nama workspace wajib diisi')
      .max(150, 'Nama workspace maksimal 150 karakter')
      .optional(),
    industry_id: z
      .string({ error: 'industry_id wajib diisi' })
      .min(1, 'industry_id wajib diisi')
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.industry_id !== undefined, {
    message: 'Minimal satu field harus diisi',
  });

export const UpdateMemberRoleSchema = z.object({
  role_id: z
    .string({ error: 'role_id wajib diisi' })
    .min(1, 'role_id wajib diisi'),
});

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceSchema>;
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;
