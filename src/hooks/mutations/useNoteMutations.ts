import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '@/api/endpoints/notes';
import { queryKeys } from '@/api/queryKeys';
import { SyncManager } from '@/services/SyncManager';
import { useNetworkStatus } from '@/providers/NetworkProvider';
import type { CreateNoteInput, UpdateNoteInput } from '@/api/types';
import type { Note } from '@/types';

interface CreateNoteVariables {
  guideId: string;
  data: CreateNoteInput;
}

interface UpdateNoteVariables {
  guideId: string;
  noteId: string;
  data: UpdateNoteInput;
}

interface DeleteNoteVariables {
  guideId: string;
  noteId: string;
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  return useMutation({
    mutationFn: async ({ guideId, data }: CreateNoteVariables) => {
      if (isOnline) {
        return notesApi.create(guideId, data);
      }
      // Queue for later sync
      await SyncManager.queueChange({
        type: 'note',
        action: 'create',
        payload: { guideId, ...data },
      });
      // Return optimistic note
      const now = Date.now();
      const optimisticNote: Note = {
        id: `temp_${now}`,
        guide_id: guideId,
        position: data.position ?? null,
        content: data.content,
        created_at: now,
        updated_at: now,
      };
      return { data: optimisticNote };
    },
    onSuccess: (_, { guideId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notes.byGuide(guideId),
      });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  return useMutation({
    mutationFn: async ({ guideId, noteId, data }: UpdateNoteVariables) => {
      if (isOnline) {
        return notesApi.update(guideId, noteId, data);
      }
      // Queue for later sync
      await SyncManager.queueChange({
        type: 'note',
        action: 'update',
        payload: { guideId, noteId, ...data },
      });
      // Return optimistic response (partial)
      return { data: { id: noteId, ...data } as Note };
    },
    onSuccess: (_, { guideId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notes.byGuide(guideId),
      });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  return useMutation({
    mutationFn: async ({ guideId, noteId }: DeleteNoteVariables) => {
      if (isOnline) {
        return notesApi.delete(guideId, noteId);
      }
      // Queue for later sync
      await SyncManager.queueChange({
        type: 'note',
        action: 'delete',
        payload: { guideId, noteId },
      });
      return { success: true };
    },
    onSuccess: (_, { guideId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notes.byGuide(guideId),
      });
    },
  });
}
