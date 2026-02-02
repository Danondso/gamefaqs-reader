import { useQuery } from '@tanstack/react-query';
import { bookmarksApi } from '@/api/endpoints/bookmarks';
import { queryKeys } from '@/api/queryKeys';
import type { Bookmark } from '@/types';

export function useBookmarksQuery(guideId: string | undefined) {
  return useQuery<{ data: Bookmark[] }, Error>({
    queryKey: queryKeys.bookmarks.byGuide(guideId!),
    queryFn: () => bookmarksApi.getByGuide(guideId!),
    enabled: !!guideId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
