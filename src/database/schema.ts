// SQLite database schema definitions

export const SCHEMA_VERSION = 2;

export const CREATE_TABLES = {
  guides: `
    CREATE TABLE IF NOT EXISTS guides (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      format TEXT NOT NULL CHECK(format IN ('txt', 'html', 'md', 'pdf')),
      file_path TEXT NOT NULL,
      game_id TEXT,
      last_read_position INTEGER,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL
    );
  `,

  games: `
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      ra_game_id TEXT UNIQUE,
      platform TEXT,
      completion_percentage REAL DEFAULT 0 CHECK(completion_percentage >= 0 AND completion_percentage <= 100),
      status TEXT NOT NULL DEFAULT 'not_started' CHECK(status IN ('in_progress', 'completed', 'not_started')),
      artwork_url TEXT,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `,

  bookmarks: `
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      guide_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      name TEXT,
      page_reference TEXT,
      is_last_read INTEGER NOT NULL DEFAULT 0 CHECK(is_last_read IN (0, 1)),
      created_at INTEGER NOT NULL,
      FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE
    );
  `,

  notes: `
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      guide_id TEXT NOT NULL,
      position INTEGER,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE
    );
  `,

  achievements: `
    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      ra_achievement_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      points INTEGER,
      badge_url TEXT,
      is_pinned INTEGER NOT NULL DEFAULT 0 CHECK(is_pinned IN (0, 1)),
      is_unlocked INTEGER NOT NULL DEFAULT 0 CHECK(is_unlocked IN (0, 1)),
      unlock_time INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      UNIQUE(ra_achievement_id, game_id)
    );
  `,

  // Version tracking table
  schema_version: `
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );
  `,
};

export const CREATE_INDEXES = {
  guides_game_id: 'CREATE INDEX IF NOT EXISTS idx_guides_game_id ON guides(game_id);',
  guides_created_at: 'CREATE INDEX IF NOT EXISTS idx_guides_created_at ON guides(created_at);',
  games_ra_game_id: 'CREATE INDEX IF NOT EXISTS idx_games_ra_game_id ON games(ra_game_id);',
  games_status: 'CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);',
  bookmarks_guide_id:
    'CREATE INDEX IF NOT EXISTS idx_bookmarks_guide_id ON bookmarks(guide_id);',
  bookmarks_is_last_read:
    'CREATE INDEX IF NOT EXISTS idx_bookmarks_is_last_read ON bookmarks(guide_id, is_last_read);',
  notes_guide_id: 'CREATE INDEX IF NOT EXISTS idx_notes_guide_id ON notes(guide_id);',
  achievements_game_id:
    'CREATE INDEX IF NOT EXISTS idx_achievements_game_id ON achievements(game_id);',
  achievements_is_pinned:
    'CREATE INDEX IF NOT EXISTS idx_achievements_is_pinned ON achievements(game_id, is_pinned);',
};

export const FULL_TEXT_SEARCH = {
  // Create FTS5 virtual table for guide content search
  guides_fts: `
    CREATE VIRTUAL TABLE IF NOT EXISTS guides_fts USING fts5(
      guide_id UNINDEXED,
      title,
      content,
      tokenize = 'porter unicode61'
    );
  `,

  // Trigger to keep FTS table in sync with guides table
  guides_fts_insert: `
    CREATE TRIGGER IF NOT EXISTS guides_fts_insert AFTER INSERT ON guides
    BEGIN
      INSERT INTO guides_fts(guide_id, title, content)
      VALUES (new.id, new.title, new.content);
    END;
  `,

  guides_fts_update: `
    CREATE TRIGGER IF NOT EXISTS guides_fts_update AFTER UPDATE ON guides
    BEGIN
      UPDATE guides_fts SET title = new.title, content = new.content
      WHERE guide_id = new.id;
    END;
  `,

  guides_fts_delete: `
    CREATE TRIGGER IF NOT EXISTS guides_fts_delete AFTER DELETE ON guides
    BEGIN
      DELETE FROM guides_fts WHERE guide_id = old.id;
    END;
  `,
};
