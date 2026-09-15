import { apiRequest } from './apiClient';
import {
  CanvasEntity,
  CreateCanvasEntityPayload,
  UpdateCanvasEntityPayload,
  AuditLogEntry,
} from '@/types/canvas.types';

export const canvasService = {
  async getAllByProject(projectId: string): Promise<CanvasEntity[]> {
    const res = await apiRequest<CanvasEntity[]>(
      'get',
      `/projects/${projectId}/canvas`
    );
    return res.data;
  },

  async getById(projectId: string, canvasId: string): Promise<CanvasEntity> {
    const res = await apiRequest<CanvasEntity>(
      'get',
      `/projects/${projectId}/canvas/${canvasId}`
    );
    return res.data;
  },

  async createEntity(
    projectId: string,
    payload: CreateCanvasEntityPayload
  ): Promise<CanvasEntity> {
    const res = await apiRequest<CanvasEntity>(
      'post',
      `/projects/${projectId}/canvas`,
      payload
    );
    return res.data;
  },

  async updateEntity(
    projectId: string,
    canvasId: string,
    payload: UpdateCanvasEntityPayload
  ): Promise<CanvasEntity> {
    const res = await apiRequest<CanvasEntity>(
      'put',
      `/projects/${projectId}/canvas/${canvasId}`,
      payload
    );
    return res.data;
  },

  async deleteEntity(projectId: string, canvasId: string): Promise<void> {
    await apiRequest<void>(
      'delete',
      `/projects/${projectId}/canvas/${canvasId}`
    );
  },

  async getAuditLogs(projectId: string): Promise<AuditLogEntry[]> {
    const res = await apiRequest<AuditLogEntry[]>(
      'get',
      `/projects/${projectId}/audit-logs`
    );
    return res.data;
  },
};
