import { z } from 'zod';

export const requirementCodeRegex = /^(RF|RNF)-\d{2,3}$/;

export const createRequirementSchema = z.object({
  code: z
    .string()
    .regex(
      requirementCodeRegex,
      'El código debe seguir el formato RF-XX o RNF-XX (ej. RF-01, RNF-100)'
    ),
  title: z.string().min(1, 'El título es requerido').max(255),
  description: z.string().optional(),
  type: z.enum(['RF', 'RNF'], {
    errorMap: () => ({ message: "El tipo debe ser 'RF' o 'RNF'" }),
  }),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
});

export const updateRequirementSchema = z
  .object({
    code: z
      .string()
      .regex(
        requirementCodeRegex,
        'El código debe seguir el formato RF-XX o RNF-XX (ej. RF-01, RNF-100)'
      )
      .optional(),
    title: z.string().min(1, 'El título no puede estar vacío').max(255).optional(),
    description: z.string().optional(),
    type: z.enum(['RF', 'RNF']).optional(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'Debe proveer al menos un campo para actualizar'
  );

export const projectAndRequirementParamsSchema = z.object({
  projectId: z.string().uuid('ID de proyecto inválido'),
  requirementId: z.string().uuid('ID de requisito inválido'),
});

export const listRequirementsQuerySchema = z.object({
  type: z.enum(['RF', 'RNF']).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export type CreateRequirementDto = z.infer<typeof createRequirementSchema>;
export type UpdateRequirementDto = z.infer<typeof updateRequirementSchema>;
export type ProjectAndRequirementParams = z.infer<typeof projectAndRequirementParamsSchema>;
export type ListRequirementsQuery = z.infer<typeof listRequirementsQuerySchema>;
