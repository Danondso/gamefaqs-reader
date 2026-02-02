import { useMutation, useQueryClient } from '@tanstack/react-query';
import { guidesApi } from '@/api/endpoints/guides';
import { queryKeys } from '@/api/queryKeys';
import { SyncManager } from '@/services/SyncManager';
import { useNetworkStatus } from '@/providers/NetworkProvider';

interface UpdatePositionVariables {
  guideId: string;
  position: number;
}

export function useUpdatePosition() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  return useMutation({
    mutationFn: async ({ guideId, position }: UpdatePositionVariables) => {
      if (isOnline) {
        return guidesApi.updatePosition(guideId, position);
      }
      // Queue for later sync
      await SyncManager.queueChange({
        type: 'position',
        action: 'update',
        payload: { guideId, position },
      });
      return { success: true };
    },
    onSuccess: (_, { guideId }) => {
      // Invalidate guide query to refresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.guides.detail(guideId),
      });
    },
  });
}
