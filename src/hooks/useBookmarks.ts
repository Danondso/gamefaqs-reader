/**
 * useBookmarks - Custom hook for bookmark management
 *
 * Uses TanStack Query for API-first bookmark management with offline support.
 */

import { useCallback } from 'react';
import { useBookmarksQuery } from './queries/useBookmarks';
import { useCreateBookmark, useDeleteBookmark } from './mutations/useBookmarkMutations';
import type { Bookmark } from '../types';

export function useBookmarks(guideId: string | undefined) {
  // Load bookmarks via API
  const { data: bookmarksResponse, isLoading: loading, refetch } = useBookmarksQuery(guideId);

  // Filter out internal last-read bookmark (is_last_read = true)
  const bookmarks: Bookmark[] = (bookmarksResponse?.data ?? []).filter((b) => !b.is_last_read);

  // Mutations
  const createBookmarkMutation = useCreateBookmark();
  const deleteBookmarkMutation = useDeleteBookmark();

  const createBookmark = useCallback(
    async (name: string, position: number, pageReference?: string) => {
      if (!guideId) return;

      return createBookmarkMutation.mutateAsync({
        guideId,
        data: {
          position: Math.round(position), // Always use integer position
          name,
          page_reference: pageReference ?? null,
          is_last_read: false,
        },
      });
    },
    [guideId, createBookmarkMutation]
  );

  const deleteBookmark = useCallback(
    async (bookmarkId: string) => {
      if (!guideId) return;

      return deleteBookmarkMutation.mutateAsync({
        guideId,
        bookmarkId,
      });
    },
    [guideId, deleteBookmarkMutation]
  );

  return {
    bookmarks,
    loading,
    createBookmark,
    deleteBookmark,
    reload: refetch,
  };
}
