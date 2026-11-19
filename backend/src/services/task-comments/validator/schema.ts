import { z } from 'zod';

export const CreateCommentSchema = z.object({
  content: z
    .string({ error: 'Komentar wajib diisi' })
    .min(1, 'Komentar wajib diisi')
    .max(5000, 'Komentar maksimal 5000 karakter'),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
