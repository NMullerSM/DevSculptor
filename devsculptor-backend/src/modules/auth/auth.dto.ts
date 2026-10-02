import { z } from 'zod';

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]).{8,}$/;
export const PASSWORD_REQUIREMENTS_MSG =
  'La contraseña debe tener al menos 8 caracteres, incluyendo mayúscula, minúscula, número y un carácter especial o punto.';

export const registerSchema = z.object({
  email: z.string().email('Formato de correo electrónico inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe contener al menos 8 caracteres')
    .regex(PASSWORD_REGEX, PASSWORD_REQUIREMENTS_MSG),
  full_name: z.string().min(2, 'El nombre completo debe contener al menos 2 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('Formato de correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Formato de correo electrónico inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16, 'Token de recuperación inválido'),
  new_password: z
    .string()
    .min(8, 'La contraseña debe contener al menos 8 caracteres')
    .regex(PASSWORD_REGEX, PASSWORD_REQUIREMENTS_MSG),
});

export const mfaEnableSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'El código 2FA debe tener exactamente 6 dígitos'),
});

export const mfaVerifySchema = z.object({
  temp_token: z.string().min(10, 'Token temporal de sesión 2FA requerido'),
  code: z.string().regex(/^\d{6}$/, 'El código 2FA debe tener exactamente 6 dígitos'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type MfaEnableDto = z.infer<typeof mfaEnableSchema>;
export type MfaVerifyDto = z.infer<typeof mfaVerifySchema>;
