import { z } from 'zod';

export const saveVaultFileSchema = z.object({
  path: z.string().min(1, 'La ruta canónica del archivo es requerida'),
  content: z.string(),
  description: z.string().optional(),
});

export const createVaultFileSchema = z.object({
  path: z.string().min(1, 'La ruta canónica del archivo es requerida'),
  content: z.string(),
  category: z.enum(['manifest', 'documentation', 'database', 'skills', 'context', 'templates', 'rules', 'archetypes']),
  description: z.string().optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN', 'SUPERADMIN'], {
    message: 'El rol debe ser USER, ADMIN o SUPERADMIN',
  }),
});

export const queryAuditLogsSchema = z.object({
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0),
  entity: z.string().optional(),
});

export type SaveVaultFileDto = z.infer<typeof saveVaultFileSchema>;
export type CreateVaultFileDto = z.infer<typeof createVaultFileSchema>;
export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>;
export type QueryAuditLogsDto = z.infer<typeof queryAuditLogsSchema>;
