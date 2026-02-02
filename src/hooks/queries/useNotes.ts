import { useQuery } from '@tanstack/react-query';
import { notesApi } from '@/api/endpoints/notes';
import { queryKeys } from '@/api/queryKeys';
import type { Note } from '@/types';

export function useNotesQuery(guideId: string | undefined) {
  return useQuery<{ data: Note[] }, Error>({
    queryKey: queryKeys.notes.byGuide(guideId!),
    queryFn: () => notesApi.getByGuide(guideId!),
    enabled: !!guideId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
