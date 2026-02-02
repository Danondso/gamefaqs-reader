import * as SQLite from 'expo-sqlite';
import type { Guide } from '@/types';

const DB_NAME = 'offline_cache.db';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeSchema();
  }
  return db;
}

async function initializeSchema(): Promise<void> {
  const database = db!;

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS downloaded_guides (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      format TEXT NOT NULL,
      file_path TEXT NOT NULL,
      game_id TEXT,
      last_read_position INTEGER,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      downloaded_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_downloaded_guides_downloaded_at
    ON downloaded_guides(downloaded_at);

    CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at
    ON sync_queue(created_at);
  `);
}

export const offlineCache = {
  async initialize(): Promise<void> {
    await getDb();
  },

  async saveGuide(guide: Guide): Promise<void> {
    const database = await getDb();
    const now = Date.now();

    await database.runAsync(
      `INSERT OR REPLACE INTO downloaded_guides
       (id, title, content, format, file_path, game_id, last_read_position, metadata, created_at, updated_at, downloaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        guide.id,
        guide.title,
        guide.content,
        guide.format,
        guide.file_path,
        guide.game_id ?? null,
        guide.last_read_position ?? null,
        guide.metadata ?? null,
        guide.created_at,
        guide.updated_at,
        now,
      ]
    );
  },

  async getGuide(id: string): Promise<Guide | null> {
    const database = await getDb();
    const result = await database.getFirstAsync<Guide & { downloaded_at: number }>(
      'SELECT * FROM downloaded_guides WHERE id = ?',
      [id]
    );
    if (!result) return null;

    // Remove downloaded_at from result
    const { downloaded_at, ...guide } = result;
    return guide;
  },

  async getAllDownloadedGuides(): Promise<Array<Guide & { downloaded_at: number }>> {
    const database = await getDb();
    return database.getAllAsync<Guide & { downloaded_at: number }>(
      'SELECT * FROM downloaded_guides ORDER BY downloaded_at DESC'
    );
  },

  async getDownloadedGuideIds(): Promise<string[]> {
    const database = await getDb();
    const results = await database.getAllAsync<{ id: string }>(
      'SELECT id FROM downloaded_guides'
    );
    return results.map((r) => r.id);
  },

  async deleteGuide(id: string): Promise<void> {
    const database = await getDb();
    await database.runAsync('DELETE FROM downloaded_guides WHERE id = ?', [id]);
  },

  async deleteAllGuides(): Promise<void> {
    const database = await getDb();
    await database.runAsync('DELETE FROM downloaded_guides');
  },

  async isGuideDownloaded(id: string): Promise<boolean> {
    const database = await getDb();
    const result = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM downloaded_guides WHERE id = ?',
      [id]
    );
    return (result?.count ?? 0) > 0;
  },

  async getDownloadedCount(): Promise<number> {
    const database = await getDb();
    const result = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM downloaded_guides'
    );
    return result?.count ?? 0;
  },

  // Sync queue operations
  async addToSyncQueue(
    type: string,
    action: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const database = await getDb();
    await database.runAsync(
      'INSERT INTO sync_queue (type, action, payload, created_at) VALUES (?, ?, ?, ?)',
      [type, action, JSON.stringify(payload), Date.now()]
    );
  },

  async getSyncQueue(): Promise<
    Array<{
      id: number;
      type: string;
      action: string;
      payload: Record<string, unknown>;
      created_at: number;
    }>
  > {
    const database = await getDb();
    const results = await database.getAllAsync<{
      id: number;
      type: string;
      action: string;
      payload: string;
      created_at: number;
    }>('SELECT * FROM sync_queue ORDER BY created_at ASC');

    return results.map((r) => ({
      ...r,
      payload: JSON.parse(r.payload),
    }));
  },

  async removeSyncQueueItem(id: number): Promise<void> {
    const database = await getDb();
    await database.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
  },

  async clearSyncQueue(): Promise<void> {
    const database = await getDb();
    await database.runAsync('DELETE FROM sync_queue');
  },

  async getSyncQueueCount(): Promise<number> {
    const database = await getDb();
    const result = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_queue'
    );
    return result?.count ?? 0;
  },
};
