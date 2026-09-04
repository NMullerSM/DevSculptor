import { z } from 'zod';

export const decisionStatusEnum = z.enum(['PROPOSED', 'ACCEPTED', 'REJECTED']);

export const createDecisionSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(255),
  context: z.string().optional(),
  decision: z.string().min(1, 'La decisión es requerida'),
  status: decisionStatusEnum.default('PROPOSED'),
});

export const updateDecisionSchema = z
  .object({
    title: z.string().min(1, 'El título no puede estar vacío').max(255).optional(),
    context: z.string().optional(),
    decision: z.string().min(1, 'La decisión no puede estar vacía').optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'Debe proveer al menos un campo para actualizar'
  );

export const updateDecisionStatusSchema = z.object({
  status: decisionStatusEnum,
});

export const projectAndDecisionParamsSchema = z.object({
  projectId: z.string().uuid('ID de proyecto inválido'),
  decisionId: z.string().uuid('ID de decisión inválido'),
});

export const listDecisionsQuerySchema = z.object({
  status: decisionStatusEnum.optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export type CreateDecisionDto = z.infer<typeof createDecisionSchema>;
export type UpdateDecisionDto = z.infer<typeof updateDecisionSchema>;
export type UpdateDecisionStatusDto = z.infer<typeof updateDecisionStatusSchema>;
export type ProjectAndDecisionParams = z.infer<typeof projectAndDecisionParamsSchema>;
export type ListDecisionsQuery = z.infer<typeof listDecisionsQuerySchema>;
export type DecisionStatus = z.infer<typeof decisionStatusEnum>;
