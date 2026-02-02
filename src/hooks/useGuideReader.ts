/**
 * useGuideReader - Custom hook for guide loading and scroll position
 *
 * Uses TanStack Query for API-first data fetching with offline support.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGuide } from './queries/useGuide';
import { useUpdatePosition } from './mutations/useUpdatePosition';
import { useBookmarksQuery } from './queries/useBookmarks';
import { useCreateBookmark } from './mutations/useBookmarkMutations';
import { aiApi } from '@/api/endpoints/ai';
import { queryKeys } from '@/api/queryKeys';

export function useGuideReader(guideId: string | undefined) {
  const queryClient = useQueryClient();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [lastSavedPosition, setLastSavedPosition] = useState(0);
  const lastSavedPositionRef = useRef(lastSavedPosition);

  // Keep ref in sync
  useEffect(() => {
    lastSavedPositionRef.current = lastSavedPosition;
  }, [lastSavedPosition]);

  // Load guide via API
  const {
    data: guideResponse,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useGuide(guideId);

  const guide = guideResponse?.data ?? null;
  const error = queryError?.message ?? null;

  // Load bookmarks to get last read position
  const { data: bookmarksResponse } = useBookmarksQuery(guideId);

  // Position update mutation
  const updatePositionMutation = useUpdatePosition();
  const createBookmarkMutation = useCreateBookmark();

  // Set initial scroll position from last_read bookmark
  useEffect(() => {
    if (bookmarksResponse?.data) {
      const lastRead = bookmarksResponse.data.find((b) => b.is_last_read);
      if (lastRead && lastRead.position) {
        setScrollPosition(lastRead.position);
        setLastSavedPosition(lastRead.position);
      }
    }
  }, [bookmarksResponse]);

  // Save scroll position - use ref to avoid recreating callback
  const { mutate: updatePosition } = updatePositionMutation;
  const saveScrollPosition = useCallback(
    async (position: number) => {
      const roundedPosition = Math.round(position);
      if (!guideId || roundedPosition === lastSavedPositionRef.current) return;

      try {
        updatePosition(
          { guideId, position: roundedPosition },
          {
            onSuccess: () => {
              setLastSavedPosition(roundedPosition);
              lastSavedPositionRef.current = roundedPosition;
            },
          }
        );
      } catch (error) {
        if (__DEV__) console.error('Failed to save scroll position:', error);
      }
    },
    [guideId, updatePosition]
  );

  // Update metadata via AI save endpoint
  const updateMetadata = useCallback(
    async (updates: { title?: string; author?: string; platform?: string; tags?: string }) => {
      if (!guideId) return;

      // Convert tags string to array if provided
      const fields: Record<string, unknown> = {};
      if (updates.title) fields.gameName = updates.title;
      if (updates.author) fields.author = updates.author;
      if (updates.platform) fields.platform = updates.platform;
      if (updates.tags) {
        fields.tags = updates.tags.split(',').map((t) => t.trim()).filter(Boolean);
      }

      await aiApi.saveAnalysis(guideId, fields);

      // Invalidate the guide detail query to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.guides.detail(guideId) });

      // Update the guide in the list cache without refetching (preserves list order)
      queryClient.setQueriesData(
        { queryKey: queryKeys.guides.lists() },
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data.map((g: any) => {
                if (g.id !== guideId) return g;
                // Update the metadata for this guide
                const existingMetadata = g.metadata ? JSON.parse(g.metadata) : {};
                const newMetadata = {
                  ...existingMetadata,
                  ...(updates.author && { author: updates.author }),
                  ...(updates.platform && { platform: updates.platform }),
                  ...(updates.tags && { tags: updates.tags.split(',').map((t: string) => t.trim()).filter(Boolean) }),
                };
                return {
                  ...g,
                  title: updates.title || g.title,
                  metadata: JSON.stringify(newMetadata),
                };
              }),
            })),
          };
        }
      );
    },
    [guideId, queryClient]
  );

  return {
    guide,
    loading,
    error,
    scrollPosition,
    setScrollPosition,
    saveScrollPosition,
    updateMetadata,
    reload: refetch,
  };
}
