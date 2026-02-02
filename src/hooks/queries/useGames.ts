import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { gamesApi } from '@/api/endpoints/games';
import { queryKeys } from '@/api/queryKeys';
import type { GamesResponse } from '@/api/types';
import type { Game } from '@/types';

export function useGames(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.games.list(page, limit),
    queryFn: () => gamesApi.getAll(page, limit),
  });
}

export function useGamesInfinite(limit = 20) {
  return useInfiniteQuery<GamesResponse, Error>({
    queryKey: queryKeys.games.lists(),
    queryFn: ({ pageParam }) =>
      gamesApi.getAll(pageParam as number, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}

export function useGamesWithGuides() {
  return useQuery({
    queryKey: queryKeys.games.withGuides(),
    queryFn: () => gamesApi.getWithGuides(),
  });
}

export function useGamesSearch(query: string) {
  return useQuery<{ data: Game[] }, Error>({
    queryKey: queryKeys.games.search(query),
    queryFn: () => gamesApi.search(query),
    enabled: query.length >= 2,
    staleTime: 60 * 1000,
  });
}

export function useGameGuides(gameId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.games.guides(gameId!),
    queryFn: () => gamesApi.getGuides(gameId!),
    enabled: !!gameId,
  });
}
