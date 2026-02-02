import { apiClient } from '../client';
import type { Game } from '@/types';
import type {
  GamesResponse,
  GameResponse,
  SuccessResponse,
  GuideSummary,
} from '../types';

export const gamesApi = {
  getAll: (page = 1, limit = 20) =>
    apiClient<GamesResponse>(`/games?page=${page}&limit=${limit}`),

  getById: (id: string) => apiClient<GameResponse>(`/games/${id}`),

  getWithGuides: () =>
    apiClient<{ data: Array<Game & { guide_count: number }> }>(
      '/games/with-guides'
    ),

  search: (query: string) =>
    apiClient<{ data: Game[] }>(
      `/games/search?q=${encodeURIComponent(query)}`
    ),

  getGuides: (id: string) =>
    apiClient<{ data: GuideSummary[] }>(`/games/${id}/guides`),

  updateStatus: (
    id: string,
    status: 'in_progress' | 'completed' | 'not_started'
  ) =>
    apiClient<SuccessResponse>(`/games/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  updateCompletion: (id: string, percentage: number) =>
    apiClient<SuccessResponse>(`/games/${id}/completion`, {
      method: 'PUT',
      body: JSON.stringify({ percentage }),
    }),
};
