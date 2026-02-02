import { apiClient } from '../client';
import type {
  GuidesResponse,
  GuideResponse,
  SearchResults,
  SuccessResponse,
} from '../types';

export const guidesApi = {
  getAll: (page = 1, limit = 20) =>
    apiClient<GuidesResponse>(`/guides?page=${page}&limit=${limit}`),

  getById: (id: string) => apiClient<GuideResponse>(`/guides/${id}`),

  search: (query: string, limit = 50) =>
    apiClient<SearchResults>(
      `/guides/search?q=${encodeURIComponent(query)}&limit=${limit}`
    ),

  updatePosition: (id: string, position: number) =>
    apiClient<SuccessResponse>(`/guides/${id}/position`, {
      method: 'PUT',
      body: JSON.stringify({ position }),
    }),
};
