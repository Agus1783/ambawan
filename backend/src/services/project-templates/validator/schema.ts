import { z } from 'zod';

export const CreateProjectTemplateSchema = z.object({
  name: z
    .string({ error: 'Nama template wajib diisi' })
    .min(1, 'Nama template wajib diisi')
    .max(150, 'Nama template maksimal 150 karakter'),
  description: z
    .string({ error: 'Deskripsi harus berupa teks' })
    .max(2000, 'Deskripsi maksimal 2000 karakter')
    .optional(),
  industry_id: z
    .string({ error: 'industry_id wajib diisi' })
    .min(1, 'industry_id wajib diisi')
    .optional(),
});

export const UpdateProjectTemplateSchema = z
  .object({
    name: z
      .string({ error: 'Nama template wajib diisi' })
      .min(1, 'Nama template wajib diisi')
      .max(150, 'Nama template maksimal 150 karakter')
      .optional(),
    description: z
      .string({ error: 'Deskripsi harus berupa teks' })
      .max(2000, 'Deskripsi maksimal 2000 karakter')
      .optional(),
    industry_id: z
      .string({ error: 'industry_id wajib diisi' })
      .min(1, 'industry_id wajib diisi')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi',
  });

export const TaskTemplatePrioritySchema = z.enum(['P1', 'P2', 'P3'], {
  error: 'Priority harus P1, P2, atau P3',
});

export const CreateTaskTemplateSchema = z.object({
  title: z
    .string({ error: 'Judul tugas wajib diisi' })
    .min(1, 'Judul tugas wajib diisi')
    .max(200, 'Judul tugas maksimal 200 karakter'),
  description: z
    .string({ error: 'Deskripsi harus berupa teks' })
    .max(2000, 'Deskripsi maksimal 2000 karakter')
    .optional(),
  priority: TaskTemplatePrioritySchema.default('P3'),
  parent_template_id: z
    .string({ error: 'parent_template_id wajib diisi' })
    .min(1, 'parent_template_id wajib diisi')
    .optional(),
  sort_order: z
    .number({ error: 'sort_order harus angka' })
    .int('sort_order harus bilangan bulat')
    .default(0),
});

export const UpdateTaskTemplateSchema = z
  .object({
    title: z
      .string({ error: 'Judul tugas wajib diisi' })
      .min(1, 'Judul tugas wajib diisi')
      .max(200, 'Judul tugas maksimal 200 karakter')
      .optional(),
    description: z
      .string({ error: 'Deskripsi harus berupa teks' })
      .max(2000, 'Deskripsi maksimal 2000 karakter')
      .optional(),
    priority: TaskTemplatePrioritySchema.optional(),
    parent_template_id: z
      .string({ error: 'parent_template_id wajib diisi' })
      .min(1, 'parent_template_id wajib diisi')
      .optional(),
    sort_order: z
      .number({ error: 'sort_order harus angka' })
      .int('sort_order harus bilangan bulat')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi',
  });

export type CreateProjectTemplateInput = z.infer<
  typeof CreateProjectTemplateSchema
>;
export type UpdateProjectTemplateInput = z.infer<
  typeof UpdateProjectTemplateSchema
>;
export type CreateTaskTemplateInput = z.infer<typeof CreateTaskTemplateSchema>;
export type UpdateTaskTemplateInput = z.infer<typeof UpdateTaskTemplateSchema>;
