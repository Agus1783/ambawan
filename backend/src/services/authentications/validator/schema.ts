import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z
    .string({ error: 'Nama wajib diisi' })
    .min(1, 'Nama wajib diisi')
    .max(100, 'Nama maksimal 100 karakter'),
  email: z
    .string({ error: 'Email wajib diisi' })
    .email('Email tidak valid')
    .max(255, 'Email maksimal 255 karakter'),
  password: z
    .string({ error: 'Password wajib diisi' })
    .min(8, 'Password minimal 8 karakter')
    .max(255, 'Password maksimal 255 karakter'),
});

export const LoginSchema = z.object({
  email: z
    .string({ error: 'Email wajib diisi' })
    .email('Email tidak valid')
    .max(255, 'Email maksimal 255 karakter'),
  password: z.string({ error: 'Password wajib diisi' }).min(1, 'Password wajib diisi'),
});

export const GoogleSchema = z.object({
  id_token: z.string({ error: 'id_token wajib diisi' }).min(1, 'id_token wajib diisi'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type GoogleInput = z.infer<typeof GoogleSchema>;
