import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookmarksApi } from '@/api/endpoints/bookmarks';
import { queryKeys } from '@/api/queryKeys';
import { SyncManager } from '@/services/SyncManager';
import { useNetworkStatus } from '@/providers/NetworkProvider';
import type { CreateBookmarkInput } from '@/api/types';
import type { Bookmark } from '@/types';

interface CreateBookmarkVariables {
  guideId: string;
  data: CreateBookmarkInput;
}

interface DeleteBookmarkVariables {
  guideId: string;
  bookmarkId: string;
}

export function useCreateBookmark() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  return useMutation({
    mutationFn: async ({ guideId, data }: CreateBookmarkVariables) => {
      if (isOnline) {
        return bookmarksApi.create(guideId, data);
      }
      // Queue for later sync
      await SyncManager.queueChange({
        type: 'bookmark',
        action: 'create',
        payload: { guideId, ...data },
      });
      // Return optimistic bookmark
      const optimisticBookmark: Bookmark = {
        id: `temp_${Date.now()}`,
        guide_id: guideId,
        position: data.position,
        name: data.name ?? null,
        page_reference: data.page_reference ?? null,
        is_last_read: data.is_last_read ?? false,
        created_at: Date.now(),
      };
      return { data: optimisticBookmark };
    },
    onSuccess: (_, { guideId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookmarks.byGuide(guideId),
      });
    },
  });
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  return useMutation({
    mutationFn: async ({ guideId, bookmarkId }: DeleteBookmarkVariables) => {
      if (isOnline) {
        return bookmarksApi.delete(guideId, bookmarkId);
      }
      // Queue for later sync
      await SyncManager.queueChange({
        type: 'bookmark',
        action: 'delete',
        payload: { guideId, bookmarkId },
      });
      return { success: true };
    },
    onSuccess: (_, { guideId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookmarks.byGuide(guideId),
      });
    },
  });
}
