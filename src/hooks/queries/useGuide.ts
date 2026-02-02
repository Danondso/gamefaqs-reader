import { useQuery } from '@tanstack/react-query';
import { guidesApi } from '@/api/endpoints/guides';
import { queryKeys } from '@/api/queryKeys';
import { offlineCache } from '@/database/offlineCache';
import { useNetworkStatus } from '@/providers/NetworkProvider';
import type { Guide } from '@/types';

export function useGuide(id: string | undefined) {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: queryKeys.guides.detail(id!),
    queryFn: async (): Promise<{ data: Guide }> => {
      // Try API first if online
      if (isOnline) {
        try {
          return await guidesApi.getById(id!);
        } catch (error) {
          // Fall back to offline cache on network error
          const cached = await offlineCache.getGuide(id!);
          if (cached) return { data: cached };
          throw error;
        }
      }

      // Offline: use cache only
      const cached = await offlineCache.getGuide(id!);
      if (cached) return { data: cached };
      throw new Error('Guide not available offline');
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
