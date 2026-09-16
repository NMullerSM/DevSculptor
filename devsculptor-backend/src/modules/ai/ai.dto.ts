import { z } from 'zod';

export const chatMessageDtoSchema = z.object({
  role: z.enum(['user', 'model', 'assistant']),
  content: z.string().min(1, 'El mensaje no puede estar vacío'),
});

export const chatRequestDtoSchema = z.object({
  messages: z.array(chatMessageDtoSchema).min(1, 'Debe proporcionar al menos un mensaje'),
  actionContext: z.enum(['general', 'requirements', 'canvas', 'decisions']).optional().default('general'),
  temperature: z.number().min(0).max(2).optional(),
});

export type ChatRequestDto = z.infer<typeof chatRequestDtoSchema>;

export const analyzeSchemaRequestDtoSchema = z.object({
  focus: z.enum(['all', 'normalization', 'rls', 'performance']).optional().default('all'),
});

export type AnalyzeSchemaRequestDto = z.infer<typeof analyzeSchemaRequestDtoSchema>;

export const suggestRequirementsRequestDtoSchema = z.object({
  prompt: z.string().min(3, 'El planteamiento debe tener al menos 3 caracteres'),
});

export type SuggestRequirementsRequestDto = z.infer<typeof suggestRequirementsRequestDtoSchema>;
