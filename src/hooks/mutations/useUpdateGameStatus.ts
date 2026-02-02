import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gamesApi } from '@/api/endpoints/games';
import { queryKeys } from '@/api/queryKeys';

interface UpdateStatusVariables {
  gameId: string;
  status: 'in_progress' | 'completed' | 'not_started';
}

export function useUpdateGameStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, status }: UpdateStatusVariables) =>
      gamesApi.updateStatus(gameId, status),
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
