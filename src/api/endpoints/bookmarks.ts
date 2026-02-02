import { apiClient } from '../client';
import type { Bookmark } from '@/types';
import type {
  BookmarkResponse,
  SuccessResponse,
  CreateBookmarkInput,
} from '../types';

export const bookmarksApi = {
  getByGuide: (guideId: string) =>
    apiClient<{ data: Bookmark[] }>(`/guides/${guideId}/bookmarks`),

  create: (guideId: string, data: CreateBookmarkInput) =>
    apiClient<BookmarkResponse>(`/guides/${guideId}/bookmarks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (guideId: string, bookmarkId: string) =>
    apiClient<SuccessResponse>(`/guides/${guideId}/bookmarks/${bookmarkId}`, {
      method: 'DELETE',
    }),
};
