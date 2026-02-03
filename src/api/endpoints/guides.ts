import { apiClient } from '../client';
import type {
  GuidesResponse,
  GuideResponse,
  SearchResults,
  SuccessResponse,
  GuideFilters,
  GuidesFiltersResponse,
} from '../types';

export const guidesApi = {
  getAll: (page = 1, limit = 20, filters?: GuideFilters) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));

    if (filters?.platform) {
      params.set('platform', filters.platform);
    }
    if (filters?.tags && filters.tags.length > 0) {
      params.set('tags', filters.tags.join(','));
    }
    if (filters?.tagMatch) {
      params.set('tagMatch', filters.tagMatch);
    }

    return apiClient<GuidesResponse>(`/guides?${params.toString()}`);
  },

  getFilters: () => apiClient<GuidesFiltersResponse>('/guides/filters'),

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
