import { z } from 'zod';

export const DashboardSummaryQuerySchema = z.object({
  workspace_id: z
    .string({ error: 'workspace_id wajib diisi' })
    .min(1, 'workspace_id wajib diisi'),
});

export const DashboardTasksQuerySchema = z.object({
  workspace_id: z
    .string({ error: 'workspace_id wajib diisi' })
    .min(1, 'workspace_id wajib diisi'),
  project_id: z
    .string({ error: 'project_id wajib diisi' })
    .min(1, 'project_id wajib diisi')
    .optional(),
  division_id: z
    .string({ error: 'division_id wajib diisi' })
    .min(1, 'division_id wajib diisi')
    .optional(),
});

export type DashboardSummaryQuery = z.infer<
  typeof DashboardSummaryQuerySchema
>;
export type DashboardTasksQuery = z.infer<
  typeof DashboardTasksQuerySchema
>;
