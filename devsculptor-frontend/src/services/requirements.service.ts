import { apiRequest } from './apiClient';
import {
  Requirement,
  CreateRequirementPayload,
  UpdateRequirementPayload,
  RequirementType,
} from '@/types/requirement.types';

export const requirementsService = {
  async getAllByProject(projectId: string, type?: RequirementType): Promise<Requirement[]> {
    const params = type ? { type } : undefined;
    const res = await apiRequest<Requirement[]>(
      'get',
      `/projects/${projectId}/requirements`,
      undefined,
      params
    );
    return res.data;
  },

  async getById(projectId: string, requirementId: string): Promise<Requirement> {
    const res = await apiRequest<Requirement>(
      'get',
      `/projects/${projectId}/requirements/${requirementId}`
    );
    return res.data;
  },

  async create(projectId: string, payload: CreateRequirementPayload): Promise<Requirement> {
    const res = await apiRequest<Requirement>(
      'post',
      `/projects/${projectId}/requirements`,
      payload
    );
    return res.data;
  },

  async update(
    projectId: string,
    requirementId: string,
    payload: UpdateRequirementPayload
  ): Promise<Requirement> {
    const res = await apiRequest<Requirement>(
      'put',
      `/projects/${projectId}/requirements/${requirementId}`,
      payload
    );
    return res.data;
  },

  async delete(projectId: string, requirementId: string): Promise<void> {
    await apiRequest<void>(
      'delete',
      `/projects/${projectId}/requirements/${requirementId}`
    );
  },
};
