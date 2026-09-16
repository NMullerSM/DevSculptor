import { apiRequest } from './apiClient';
import {
  Decision,
  CreateDecisionPayload,
  UpdateDecisionPayload,
  DecisionStatus,
} from '@/types/decision.types';

export const decisionsService = {
  async getAllByProject(projectId: string, status?: DecisionStatus): Promise<Decision[]> {
    const params = status ? { status } : undefined;
    const res = await apiRequest<Decision[]>(
      'get',
      `/projects/${projectId}/decisions`,
      undefined,
      params
    );
    return res.data;
  },

  async getById(projectId: string, decisionId: string): Promise<Decision> {
    const res = await apiRequest<Decision>(
      'get',
      `/projects/${projectId}/decisions/${decisionId}`
    );
    return res.data;
  },

  async create(projectId: string, payload: CreateDecisionPayload): Promise<Decision> {
    const res = await apiRequest<Decision>(
      'post',
      `/projects/${projectId}/decisions`,
      payload
    );
    return res.data;
  },

  async update(
    projectId: string,
    decisionId: string,
    payload: UpdateDecisionPayload
  ): Promise<Decision> {
    const res = await apiRequest<Decision>(
      'put',
      `/projects/${projectId}/decisions/${decisionId}`,
      payload
    );
    return res.data;
  },

  async changeStatus(
    projectId: string,
    decisionId: string,
    status: DecisionStatus
  ): Promise<Decision> {
    const res = await apiRequest<Decision>(
      'patch',
      `/projects/${projectId}/decisions/${decisionId}/status`,
      { status }
    );
    return res.data;
  },

  async delete(projectId: string, decisionId: string): Promise<void> {
    await apiRequest<void>(
      'delete',
      `/projects/${projectId}/decisions/${decisionId}`
    );
  },
};
