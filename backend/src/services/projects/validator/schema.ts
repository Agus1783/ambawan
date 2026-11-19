import { z } from 'zod';

const isoDatetime = z
  .string({ error: 'Deadline harus format ISO 8601' })
  .datetime('Deadline harus format ISO 8601');

export const CreateProjectSchema = z.object({
  workspace_id: z
    .string({ error: 'workspace_id wajib diisi' })
    .min(1, 'workspace_id wajib diisi'),
  name: z
    .string({ error: 'Nama project wajib diisi' })
    .min(1, 'Nama project wajib diisi')
    .max(150, 'Nama project maksimal 150 karakter'),
  description: z
    .string({ error: 'Deskripsi harus berupa teks' })
    .max(2000, 'Deskripsi maksimal 2000 karakter')
    .optional(),
  deadline: isoDatetime.optional(),
  industry_id: z
    .string({ error: 'industry_id wajib diisi' })
    .min(1, 'industry_id wajib diisi')
    .optional(),
  project_template_id: z
    .string({ error: 'project_template_id wajib diisi' })
    .min(1, 'project_template_id wajib diisi')
    .optional(),
  apply_task_template: z
    .boolean({ error: 'apply_task_template harus true/false' })
    .optional(),
});

export const UpdateProjectSchema = z
  .object({
    name: z
      .string({ error: 'Nama project wajib diisi' })
      .min(1, 'Nama project wajib diisi')
      .max(150, 'Nama project maksimal 150 karakter')
      .optional(),
    description: z
      .string({ error: 'Deskripsi harus berupa teks' })
      .max(2000, 'Deskripsi maksimal 2000 karakter')
      .optional(),
    deadline: isoDatetime.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi',
  });

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
