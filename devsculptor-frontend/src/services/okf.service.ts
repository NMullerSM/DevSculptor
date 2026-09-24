import { apiRequest } from './apiClient';
import {
  OkfDocumentRecord,
  VaultStats,
  SyncVaultItemPayload,
  SyncVaultResponse,
  ConvertDocumentPayload,
  AiConvertDocumentPayload,
  ConvertedOkfResponse,
} from '@/types/okf.types';

export const okfService = {
  /**
   * Sincroniza en lote la bóveda documental completa en PostgreSQL / Supabase.
   */
  async syncVault(
    projectId: string,
    documents: SyncVaultItemPayload[]
  ): Promise<SyncVaultResponse> {
    const res = await apiRequest<SyncVaultResponse>(
      'post',
      `/projects/${projectId}/okf/sync`,
      { documents }
    );
    return res.data;
  },

  /**
   * Conversión mecánica de documentos externos a formato canónico OKF.
   */
  async convertMechanically(
    projectId: string,
    payload: ConvertDocumentPayload
  ): Promise<ConvertedOkfResponse> {
    const res = await apiRequest<ConvertedOkfResponse>(
      'post',
      `/projects/${projectId}/okf/convert`,
      payload
    );
    return res.data;
  },

  /**
   * Conversión inteligente asistida por IA con extracción ontológica de tags.
   */
  async convertWithAi(
    projectId: string,
    payload: AiConvertDocumentPayload
  ): Promise<ConvertedOkfResponse> {
    const res = await apiRequest<ConvertedOkfResponse>(
      'post',
      `/projects/${projectId}/okf/ai-convert`,
      payload
    );
    return res.data;
  },

  /**
   * Obtiene la lista de documentos persistidos en la base de datos para el proyecto.
   */
  async getDocuments(
    projectId: string,
    filters?: {
      documentType?: string;
      freshnessStatus?: string;
      tag?: string;
      search?: string;
    }
  ): Promise<OkfDocumentRecord[]> {
    const res = await apiRequest<OkfDocumentRecord[]>(
      'get',
      `/projects/${projectId}/okf`,
      undefined,
      filters as Record<string, unknown>
    );
    return res.data;
  },

  /**
   * Obtiene las estadísticas de frescura y vigencia de la bóveda.
   */
  async getStats(projectId: string): Promise<VaultStats> {
    const res = await apiRequest<VaultStats>('get', `/projects/${projectId}/okf/stats`);
    return res.data;
  },

  /**
   * Ratifica o actualiza el estado de un documento por el arquitecto.
   */
  async verifyDocument(
    projectId: string,
    canonicalPath: string,
    verifiedBy: string,
    freshnessStatus: 'FRESH' | 'STALE' | 'DRIFT_DETECTED' = 'FRESH'
  ): Promise<OkfDocumentRecord> {
    const res = await apiRequest<OkfDocumentRecord>(
      'patch',
      `/projects/${projectId}/okf/verify`,
      { canonicalPath, verifiedBy, freshnessStatus }
    );
    return res.data;
  },
};
