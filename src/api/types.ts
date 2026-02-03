import type { Guide, Game, Bookmark, Note } from '@/types';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SingleResponse<T> {
  data: T;
}

export interface SuccessResponse {
  success: boolean;
}

export interface SearchResults {
  guides: GuideSummary[];
  content: GuideSummary[];
  query: string;
  total: number;
}

export type GuideSummary = Omit<Guide, 'content'> & {
  content_length: number;
};

export type GuideResponse = SingleResponse<Guide>;
export type GuidesResponse = PaginatedResponse<GuideSummary>;
export type GameResponse = SingleResponse<Game>;
export type GamesResponse = PaginatedResponse<Game>;
export type BookmarksResponse = SingleResponse<Bookmark[]>;
export type BookmarkResponse = SingleResponse<Bookmark>;
export type NotesResponse = SingleResponse<Note[]>;
export type NoteResponse = SingleResponse<Note>;

export interface HealthResponse {
  status: string;
  initialized: boolean;
  initStage: string;
  uptime: number;
  timestamp: string;
}

export interface CreateBookmarkInput {
  position: number;
  name?: string | null;
  page_reference?: string | null;
  is_last_read?: boolean;
}

export interface CreateNoteInput {
  position?: number | null;
  content: string;
}

export interface UpdateNoteInput {
  position?: number | null;
  content?: string;
}

export interface GuideFilters {
  platform?: string;
  tags?: string[];
  tagMatch?: 'any' | 'all';
}

export interface GuidesFiltersResponse {
  platforms: string[];
  tags: string[];
}
