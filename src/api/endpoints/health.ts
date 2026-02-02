import { apiClient } from '../client';
import type { HealthResponse } from '../types';

export const healthApi = {
  getStatus: () => apiClient<HealthResponse>('/health'),
  getReady: () => apiClient<{ status: string }>('/health/ready'),
  getLive: () => apiClient<{ status: string }>('/health/live'),
};
