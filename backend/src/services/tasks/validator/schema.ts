import { z } from 'zod';

const isoDatetime = z
  .string({ error: 'Deadline harus format ISO 8601' })
  .datetime('Deadline harus format ISO 8601');

export const TaskPrioritySchema = z.enum(['P1', 'P2', 'P3'], {
  error: 'Priority harus P1, P2, atau P3',
});

export const CreateTaskSchema = z.object({
  workspace_id: z
    .string({ error: 'workspace_id wajib diisi' })
    .min(1, 'workspace_id wajib diisi'),
  project_id: z
    .string({ error: 'project_id wajib diisi' })
    .min(1, 'project_id wajib diisi'),
  parent_task_id: z
    .string({ error: 'parent_task_id wajib diisi' })
    .min(1, 'parent_task_id wajib diisi')
    .optional(),
  title: z
    .string({ error: 'Judul task wajib diisi' })
    .min(1, 'Judul task wajib diisi')
    .max(200, 'Judul task maksimal 200 karakter'),
  description: z
    .string({ error: 'Deskripsi harus berupa teks' })
    .max(2000, 'Deskripsi maksimal 2000 karakter')
    .optional(),
  priority: TaskPrioritySchema.default('P3'),
  deadline: isoDatetime.optional(),
  assignee_id: z
    .string({ error: 'assignee_id wajib diisi' })
    .min(1, 'assignee_id wajib diisi')
    .optional(),
  division_id: z
    .string({ error: 'division_id wajib diisi' })
    .min(1, 'division_id wajib diisi')
    .optional(),
});

export const UpdateTaskSchema = z
  .object({
    title: z
      .string({ error: 'Judul task wajib diisi' })
      .min(1, 'Judul task wajib diisi')
      .max(200, 'Judul task maksimal 200 karakter')
      .optional(),
    description: z
      .string({ error: 'Deskripsi harus berupa teks' })
      .max(2000, 'Deskripsi maksimal 2000 karakter')
      .optional(),
    priority: TaskPrioritySchema.optional(),
    deadline: isoDatetime.optional(),
    assignee_id: z
      .string({ error: 'assignee_id wajib diisi' })
      .min(1, 'assignee_id wajib diisi')
      .optional(),
    division_id: z
      .string({ error: 'division_id wajib diisi' })
      .min(1, 'division_id wajib diisi')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi',
  });

export const UpdateTaskStatusSchema = z.object({
  status: z
    .string({ error: 'Status wajib diisi' })
    .min(1, 'Status wajib diisi'),
});

export const DelegateTaskSchema = z.object({
  assignee_id: z
    .string({ error: 'assignee_id wajib diisi' })
    .min(1, 'assignee_id wajib diisi')
    .optional(),
  division_id: z
    .string({ error: 'division_id wajib diisi' })
    .min(1, 'division_id wajib diisi')
    .optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof UpdateTaskStatusSchema>;
export type DelegateTaskInput = z.infer<typeof DelegateTaskSchema>;
