import { useQuery } from '@tanstack/react-query';
import { gamesApi } from '@/api/endpoints/games';
import { queryKeys } from '@/api/queryKeys';

export function useGame(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.games.detail(id!),
    queryFn: () => gamesApi.getById(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
