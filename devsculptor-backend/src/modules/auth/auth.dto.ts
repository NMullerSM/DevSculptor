import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Formato de correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe contener al menos 8 caracteres'),
  full_name: z.string().min(2, 'El nombre completo debe contener al menos 2 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('Formato de correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
