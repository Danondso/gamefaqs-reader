import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { guidesApi } from '@/api/endpoints/guides';
import { queryKeys } from '@/api/queryKeys';
import type { GuidesResponse, SearchResults } from '@/api/types';

export function useGuides(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.guides.list(page, limit),
    queryFn: () => guidesApi.getAll(page, limit),
  });
}

export function useGuidesInfinite(limit = 20) {
  return useInfiniteQuery<GuidesResponse, Error>({
    queryKey: queryKeys.guides.lists(),
    queryFn: ({ pageParam }) =>
      guidesApi.getAll(pageParam as number, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}

export function useGuidesSearch(query: string, limit = 50) {
  return useQuery<SearchResults, Error>({
    queryKey: queryKeys.guides.search(query, limit),
    queryFn: () => guidesApi.search(query, limit),
    enabled: query.length >= 2,
    staleTime: 60 * 1000, // 1 minute for search results
  });
}
