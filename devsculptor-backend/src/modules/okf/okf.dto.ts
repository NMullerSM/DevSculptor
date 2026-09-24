import { z } from 'zod';

export const okfDocumentTypeSchema = z.enum([
  'PROJECT_CONTEXT',
  'REQUIREMENT_SPEC',
  'DECISION_ADR',
  'DATABASE_SCHEMA',
  'AGENT_SKILL',
  'KNOWLEDGE_BASE',
  'ARCHITECTURE_PATTERN',
  'DOCUMENT_TEMPLATE',
]);

export const freshnessStatusSchema = z.enum(['FRESH', 'STALE', 'DRIFT_DETECTED']);

export const syncVaultDocumentItemSchema = z.object({
  documentId: z.string().min(1, 'El documentId es requerido').max(100),
  documentType: okfDocumentTypeSchema,
  canonicalPath: z.string().min(1, 'El canonicalPath es requerido').max(255),
  title: z.string().min(1, 'El título es requerido').max(255),
  tags: z.array(z.string().min(1)).default([]),
  contentPreview: z.string().optional().nullable(),
  stateHash: z.string().min(1, 'El stateHash es requerido').max(64),
  freshnessStatus: freshnessStatusSchema.default('FRESH'),
  storagePath: z.string().max(255).optional().nullable(),
  verifiedBy: z.string().max(150).optional().nullable(),
});

export const syncVaultSchema = z.object({
  documents: z
    .array(syncVaultDocumentItemSchema)
    .min(1, 'Debe enviar al menos un documento para sincronizar'),
});

export const convertDocumentSchema = z.object({
  rawContent: z.string().min(1, 'El contenido no puede estar vacío'),
  title: z.string().max(255).optional(),
  documentType: okfDocumentTypeSchema.default('KNOWLEDGE_BASE'),
  targetCategory: z.enum(['knowledge-base', 'patterns', 'templates']).default('knowledge-base'),
  tags: z.array(z.string().min(1)).default([]),
  author: z.string().max(150).optional(),
});

export const aiConvertDocumentSchema = z.object({
  rawContent: z.string().min(1, 'El contenido no puede estar vacío'),
  contextHint: z.string().max(500).optional(),
  targetCategory: z.enum(['knowledge-base', 'patterns', 'templates']).default('knowledge-base'),
  suggestedTags: z.array(z.string().min(1)).optional(),
});

export const queryOkfDocsSchema = z.object({
  documentType: okfDocumentTypeSchema.optional(),
  freshnessStatus: freshnessStatusSchema.optional(),
  tag: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
});

export const verifyDocumentSchema = z.object({
  canonicalPath: z.string().min(1, 'canonicalPath es requerido').max(255),
  verifiedBy: z.string().min(1, 'verifiedBy es requerido').max(150),
  freshnessStatus: freshnessStatusSchema.default('FRESH'),
});

export const okfProjectParamsSchema = z.object({
  projectId: z.string().uuid('ID de proyecto inválido'),
});

export type OkfDocumentType = z.infer<typeof okfDocumentTypeSchema>;
export type FreshnessStatus = z.infer<typeof freshnessStatusSchema>;
export type SyncVaultDocumentItem = z.infer<typeof syncVaultDocumentItemSchema>;
export type SyncVaultDto = z.infer<typeof syncVaultSchema>;
export type ConvertDocumentDto = z.infer<typeof convertDocumentSchema>;
export type AiConvertDocumentDto = z.infer<typeof aiConvertDocumentSchema>;
export type QueryOkfDocsDto = z.infer<typeof queryOkfDocsSchema>;
export type VerifyDocumentDto = z.infer<typeof verifyDocumentSchema>;
export type OkfProjectParams = z.infer<typeof okfProjectParamsSchema>;
