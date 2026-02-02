import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gamesApi } from '@/api/endpoints/games';
import { queryKeys } from '@/api/queryKeys';

interface UpdateCompletionVariables {
  gameId: string;
  percentage: number;
}

export function useUpdateCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, percentage }: UpdateCompletionVariables) =>
      gamesApi.updateCompletion(gameId, percentage),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.games.detail(gameId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.games.lists(),
      });
    },
  });
}
