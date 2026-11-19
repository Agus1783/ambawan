import { z } from 'zod';

export const CreateIndustrySchema = z.object({
  name: z
    .string({ error: 'Nama bidang usaha wajib diisi' })
    .min(1, 'Nama bidang usaha wajib diisi')
    .max(100, 'Nama bidang usaha maksimal 100 karakter'),
  description: z
    .string()
    .max(500, 'Deskripsi maksimal 500 karakter')
    .optional(),
});

export type CreateIndustryInput = z.infer<typeof CreateIndustrySchema>;
