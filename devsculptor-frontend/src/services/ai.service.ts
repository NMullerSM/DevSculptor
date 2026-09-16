import { apiClient } from './apiClient';
import { ApiResponse } from '@/types/api.types';
import {
  AiChatResult,
  SendChatMessagePayload,
  SuggestRequirementsPayload,
} from '@/types/ai.types';

export const aiService = {
  /**
   * Envía la conversación al consultor de arquitectura IA (con contexto vivo inyectado por el backend).
   */
  async chat(projectId: string, payload: SendChatMessagePayload): Promise<AiChatResult> {
    const res = await apiClient.post<ApiResponse<AiChatResult>>(
      `/projects/${projectId}/ai/chat`,
      payload,
      { timeout: 60000 }
    );
    return res.data.data;
  },

  /**
   * Ejecuta una auditoría relacional con comprobación 3FN y mejores prácticas.
   */
  async analyzeSchema(projectId: string): Promise<AiChatResult> {
    const res = await apiClient.post<ApiResponse<AiChatResult>>(
      `/projects/${projectId}/ai/analyze-schema`,
      {},
      { timeout: 60000 }
    );
    return res.data.data;
  },

  /**
   * Sintetiza requisitos IEEE-830 a partir de una descripción en lenguaje natural.
   */
  async suggestRequirements(projectId: string, prompt: string): Promise<AiChatResult> {
    const payload: SuggestRequirementsPayload = { prompt };
    const res = await apiClient.post<ApiResponse<AiChatResult>>(
      `/projects/${projectId}/ai/suggest-requirements`,
      payload,
      { timeout: 60000 }
    );
    return res.data.data;
  },
};
