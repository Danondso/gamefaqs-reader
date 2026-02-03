import type { GuideFilters } from './types';

export const queryKeys = {
  guides: {
    all: ['guides'] as const,
    lists: () => [...queryKeys.guides.all, 'list'] as const,
    list: (page: number, limit: number) =>
      [...queryKeys.guides.lists(), { page, limit }] as const,
    filteredLists: (filters?: GuideFilters) =>
      filters ? [...queryKeys.guides.lists(), { filters }] as const : queryKeys.guides.lists(),
    filters: () => [...queryKeys.guides.all, 'filters'] as const,
    details: () => [...queryKeys.guides.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.guides.details(), id] as const,
    search: (query: string, limit?: number) =>
      [...queryKeys.guides.all, 'search', { query, limit }] as const,
  },
  games: {
    all: ['games'] as const,
    lists: () => [...queryKeys.games.all, 'list'] as const,
    list: (page: number, limit: number) =>
      [...queryKeys.games.lists(), { page, limit }] as const,
    details: () => [...queryKeys.games.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.games.details(), id] as const,
    withGuides: () => [...queryKeys.games.all, 'with-guides'] as const,
    search: (query: string) =>
      [...queryKeys.games.all, 'search', { query }] as const,
    guides: (id: string) => [...queryKeys.games.detail(id), 'guides'] as const,
  },
  bookmarks: {
    all: ['bookmarks'] as const,
    byGuide: (guideId: string) =>
      [...queryKeys.bookmarks.all, 'guide', guideId] as const,
  },
  notes: {
    all: ['notes'] as const,
    byGuide: (guideId: string) =>
      [...queryKeys.notes.all, 'guide', guideId] as const,
  },
  health: {
    all: ['health'] as const,
    status: () => [...queryKeys.health.all, 'status'] as const,
  },
  downloads: {
    all: ['downloads'] as const,
    list: () => [...queryKeys.downloads.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.downloads.all, 'detail', id] as const,
  },
};
