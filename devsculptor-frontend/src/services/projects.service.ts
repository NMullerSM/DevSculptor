import { apiRequest } from './apiClient';
import { Project, CreateProjectPayload, UpdateProjectPayload } from '@/types/project.types';
import { PaginationMeta } from '@/types/api.types';

export const projectsService = {
  async getAll(limit = 50, offset = 0): Promise<{ projects: Project[]; meta?: PaginationMeta }> {
    const res = await apiRequest<Project[]>('get', '/projects', undefined, { limit, offset });
    return { projects: res.data, meta: res.meta };
  },

  async getById(projectId: string): Promise<Project> {
    const res = await apiRequest<Project>('get', `/projects/${projectId}`);
    return res.data;
  },

  async create(payload: CreateProjectPayload): Promise<Project> {
    const res = await apiRequest<Project>('post', '/projects', payload);
    return res.data;
  },

  async update(projectId: string, payload: UpdateProjectPayload): Promise<Project> {
    const res = await apiRequest<Project>('put', `/projects/${projectId}`, payload);
    return res.data;
  },

  async delete(projectId: string): Promise<void> {
    await apiRequest<void>('delete', `/projects/${projectId}`);
  },
};
