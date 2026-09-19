import { apiRequest } from './apiClient';
import {
  PlatformStats,
  GlobalVaultFile,
  SaveVaultFilePayload,
  CreateVaultFilePayload,
  AuditLogEntry,
  AdminUserItem,
} from '@/types/admin.types';

export const adminService = {
  /**
   * Obtiene métricas agregadas de la plataforma (proyectos, usuarios, entidades, requerimientos, madurez)
   */
  async getPlatformStats(): Promise<PlatformStats> {
    const res = await apiRequest<PlatformStats>('get', '/admin/stats');
    return res.data;
  },

  /**
   * Lista todos los archivos de plantillas, skills y reglas en _global/
   */
  async listGlobalVaultFiles(): Promise<GlobalVaultFile[]> {
    const res = await apiRequest<GlobalVaultFile[]>('get', '/admin/vault/global');
    return res.data;
  },

  /**
   * Lee el contenido completo de un archivo de la bóveda global
   */
  async getVaultFile(path: string): Promise<GlobalVaultFile> {
    const res = await apiRequest<GlobalVaultFile>('get', '/admin/vault/file', undefined, { path });
    return res.data;
  },

  /**
   * Guarda las modificaciones in-situ de una plantilla o regla global
   */
  async saveVaultFile(payload: SaveVaultFilePayload): Promise<GlobalVaultFile> {
    const res = await apiRequest<GlobalVaultFile>('put', '/admin/vault/file', payload);
    return res.data;
  },

  /**
   * Registra y sube un nuevo artefacto o plantilla canónica
   */
  async createVaultFile(payload: CreateVaultFilePayload): Promise<GlobalVaultFile> {
    const res = await apiRequest<GlobalVaultFile>('post', '/admin/vault/file', payload);
    return res.data;
  },

  /**
   * Elimina un artefacto de la bóveda global
   */
  async deleteVaultFile(path: string): Promise<{ deleted: boolean; path: string }> {
    const res = await apiRequest<{ deleted: boolean; path: string }>('delete', '/admin/vault/file', undefined, { path });
    return res.data;
  },

  /**
   * Consulta el registro de auditoría relacional transversal
   */
  async getAuditLogs(params?: { limit?: number; offset?: number; entity?: string }): Promise<AuditLogEntry[]> {
    const res = await apiRequest<AuditLogEntry[]>('get', '/admin/audit-logs', undefined, params);
    return res.data;
  },

  /**
   * Lista los usuarios registrados para gestión de accesos y roles
   */
  async listUsers(): Promise<AdminUserItem[]> {
    const res = await apiRequest<AdminUserItem[]>('get', '/admin/users');
    return res.data;
  },

  /**
   * Actualiza el rol de un usuario (USER, ADMIN, SUPERADMIN)
   */
  async updateUserRole(userId: string, role: 'USER' | 'ADMIN' | 'SUPERADMIN'): Promise<AdminUserItem> {
    const res = await apiRequest<AdminUserItem>('patch', `/admin/users/${userId}/role`, { role });
    return res.data;
  },
};
