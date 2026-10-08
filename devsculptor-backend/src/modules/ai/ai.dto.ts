import { z } from 'zod';

export const chatMessageDtoSchema = z.object({
  role: z.enum(['user', 'model', 'assistant']),
  content: z
    .string()
    .min(1, 'El mensaje no puede estar vacío')
    .max(8000, 'El mensaje no puede exceder 8000 caracteres'),
});

export const chatRequestDtoSchema = z.object({
  messages: z
    .array(chatMessageDtoSchema)
    .min(1, 'Debe proporcionar al menos un mensaje')
    .max(40, 'No puede enviar más de 40 mensajes en el historial de conversación'),
  actionContext: z.enum(['general', 'requirements', 'canvas', 'decisions']).optional().default('general'),
  temperature: z.number().min(0).max(2).optional(),
});

export type ChatRequestDto = z.infer<typeof chatRequestDtoSchema>;

export const analyzeSchemaRequestDtoSchema = z.object({
  focus: z.enum(['all', 'normalization', 'rls', 'performance']).optional().default('all'),
});

export type AnalyzeSchemaRequestDto = z.infer<typeof analyzeSchemaRequestDtoSchema>;

export const suggestRequirementsRequestDtoSchema = z.object({
  prompt: z
    .string()
    .min(3, 'El planteamiento debe tener al menos 3 caracteres')
    .max(4000, 'El planteamiento no puede exceder 4000 caracteres'),
});

export type SuggestRequirementsRequestDto = z.infer<typeof suggestRequirementsRequestDtoSchema>;

export const userAiHeadersSchema = z.object({
  apiKey: z.string().min(1).max(512),
  provider: z.enum(['gemini', 'openrouter', 'deepseek', 'openai', 'groq', 'custom']).optional(),
  model: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[\w.\-:/]+$/, 'Nombre de modelo con formato inválido')
    .optional(),
  endpoint: z.string().max(255).optional(),
});

export type UserAiHeaders = z.infer<typeof userAiHeadersSchema>;
