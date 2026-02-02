// Database entity types

export interface Guide {
  id: string;
  title: string;
  content: string;
  format: 'txt' | 'html' | 'md' | 'pdf';
  file_path: string;
  game_id?: string | null;
  last_read_position?: number | null;
  metadata?: string | null; // JSON string for tags, platform, etc.
  created_at: number;
  updated_at: number;
}

export interface Game {
  id: string;
  title: string;
  ra_game_id?: string | null; // RetroAchievements game ID
  platform?: string | null;
  completion_percentage: number;
  status: 'in_progress' | 'completed' | 'not_started';
  artwork_url?: string | null;
  metadata?: string | null; // JSON string for additional data
  created_at: number;
  updated_at: number;
}

export interface Bookmark {
  id: string;
  guide_id: string;
  position: number; // Character position or line number
  name?: string | null; // Named bookmark (null for auto last-read position)
  page_reference?: string | null; // Preview of content at bookmark position
  is_last_read: boolean; // True for the auto-saved position
  created_at: number;
}

export interface Note {
  id: string;
  guide_id: string;
  position?: number | null; // Null means note is for entire guide
  content: string;
  created_at: number;
  updated_at: number;
}

export interface Achievement {
  id: string;
  ra_achievement_id: string; // RetroAchievements achievement ID
  game_id: string;
  title: string;
  description: string;
  points?: number | null;
  badge_url?: string | null;
  is_pinned: boolean;
  is_unlocked: boolean;
  unlock_time?: number | null;
  created_at: number;
  updated_at: number;
}

// Metadata types
export interface GuideMetadata {
  platform?: string;
  genre?: string;
  author?: string;
  version?: string;
  tags?: string[];
}

export interface GameMetadata {
  external_id?: string;
  genre?: string;
  release_year?: number;
  developer?: string;
  guide_count?: number;
}

// API types
export interface RetroAchievementsUser {
  username: string;
  points: number;
  rank: number;
}

export interface RetroAchievementsGameInfo {
  id: string;
  title: string;
  console: string;
  imageIcon: string;
  numAchievements: number;
  numAwardedToUser: number;
  userCompletion: string;
}
