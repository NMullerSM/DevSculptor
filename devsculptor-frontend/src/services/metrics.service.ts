import { apiRequest } from './apiClient';
import { ProjectMetrics } from '@/types/metrics.types';

export const metricsService = {
  async getProjectMetrics(projectId: string): Promise<ProjectMetrics> {
    const res = await apiRequest<ProjectMetrics>(
      'get',
      `/projects/${projectId}/metrics`
    );
    return res.data;
  },
};
