import { apiClient } from '../client';
import type { Note } from '@/types';
import type {
  NoteResponse,
  SuccessResponse,
  CreateNoteInput,
  UpdateNoteInput,
} from '../types';

export const notesApi = {
  getByGuide: (guideId: string) =>
    apiClient<{ data: Note[] }>(`/guides/${guideId}/notes`),

  create: (guideId: string, data: CreateNoteInput) =>
    apiClient<NoteResponse>(`/guides/${guideId}/notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (guideId: string, noteId: string, data: UpdateNoteInput) =>
    apiClient<NoteResponse>(`/guides/${guideId}/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (guideId: string, noteId: string) =>
    apiClient<SuccessResponse>(`/guides/${guideId}/notes/${noteId}`, {
      method: 'DELETE',
    }),
};
