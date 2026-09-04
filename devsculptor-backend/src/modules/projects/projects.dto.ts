import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'El nombre del proyecto es requerido').max(255),
  description: z.string().optional(),
  architecture_style: z.string().max(100).optional(),
});

export const updateProjectSchema = z
  .object({
    name: z.string().min(1, 'El nombre no puede estar vacío').max(255).optional(),
    description: z.string().optional(),
    architecture_style: z.string().max(100).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'Debe proveer al menos un campo para actualizar'
  );

export const projectIdParamSchema = z.object({
  projectId: z.string().uuid('ID de proyecto inválido (debe ser UUID)'),
});

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export type CreateProjectDto = z.infer<typeof createProjectSchema>;
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
