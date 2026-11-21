import { z } from 'zod';
import { PERMISSION_SET } from '../../../utils/permissions';

const permissionsSchema = z
  .array(z.string())
  .refine((perms) => perms.every((p) => PERMISSION_SET.has(p)), {
    message: 'Ada izin di luar katalog',
  });

export const CreateRoleSchema = z.object({
  name: z
    .string({ error: 'Nama role wajib diisi' })
    .min(1, 'Nama role wajib diisi')
    .max(100, 'Nama role maksimal 100 karakter'),
  description: z
    .string()
    .max(500, 'Deskripsi maksimal 500 karakter')
    .optional(),
  permissions: permissionsSchema,
});

export const UpdateRoleSchema = z
  .object({
    name: z
      .string({ error: 'Nama role wajib diisi' })
      .min(1, 'Nama role wajib diisi')
      .max(100, 'Nama role maksimal 100 karakter')
      .optional(),
    description: z
      .string()
      .max(500, 'Deskripsi maksimal 500 karakter')
      .optional(),
    permissions: permissionsSchema.optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.permissions !== undefined,
    { message: 'Minimal satu field harus diisi' },
  );

export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
