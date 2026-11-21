import { z } from 'zod';

export const CreateDivisionSchema = z.object({
  workspace_id: z
    .string({ error: 'workspace_id wajib diisi' })
    .min(1, 'workspace_id wajib diisi'),
  name: z
    .string({ error: 'Nama division wajib diisi' })
    .min(1, 'Nama division wajib diisi')
    .max(100, 'Nama division maksimal 100 karakter'),
});

export const UpdateDivisionSchema = z.object({
  name: z
    .string({ error: 'Nama division wajib diisi' })
    .min(1, 'Nama division wajib diisi')
    .max(100, 'Nama division maksimal 100 karakter'),
});

export const SetDivisionLeaderSchema = z.object({
  user_id: z
    .string({ error: 'user_id wajib diisi' })
    .min(1, 'user_id wajib diisi'),
});

export type CreateDivisionInput = z.infer<typeof CreateDivisionSchema>;
export type UpdateDivisionInput = z.infer<typeof UpdateDivisionSchema>;
export type SetDivisionLeaderInput = z.infer<typeof SetDivisionLeaderSchema>;
