import type { SQLiteDatabase } from 'expo-sqlite';
import {
  CREATE_TABLES,
  CREATE_INDEXES,
  FULL_TEXT_SEARCH,
  SCHEMA_VERSION,
} from './schema';

export interface Migration {
  version: number;
  up: (db: SQLiteDatabase) => void;
  down?: (db: SQLiteDatabase) => void;
}

// Migration v1: Initial schema
const migration_v1: Migration = {
  version: 1,
  up: (db: SQLiteDatabase) => {
    // Create all tables
    Object.values(CREATE_TABLES).forEach(sql => {
      db.execSync(sql);
    });

    // Create indexes
    Object.values(CREATE_INDEXES).forEach(sql => {
      db.execSync(sql);
    });

    // Create FTS5 virtual table and triggers
    db.execSync(FULL_TEXT_SEARCH.guides_fts);
    db.execSync(FULL_TEXT_SEARCH.guides_fts_insert);
    db.execSync(FULL_TEXT_SEARCH.guides_fts_update);
    db.execSync(FULL_TEXT_SEARCH.guides_fts_delete);

    // Record schema version
    db.execSync(`INSERT INTO schema_version (version, applied_at) VALUES (${SCHEMA_VERSION}, ${Date.now()})`);
  },
  down: (db: SQLiteDatabase) => {
    // Drop triggers first
    db.execSync('DROP TRIGGER IF EXISTS guides_fts_delete');
    db.execSync('DROP TRIGGER IF EXISTS guides_fts_update');
    db.execSync('DROP TRIGGER IF EXISTS guides_fts_insert');

    // Drop FTS table
    db.execSync('DROP TABLE IF EXISTS guides_fts');

    // Drop tables in reverse order (respecting foreign keys)
    db.execSync('DROP TABLE IF EXISTS achievements');
    db.execSync('DROP TABLE IF EXISTS notes');
    db.execSync('DROP TABLE IF EXISTS bookmarks');
    db.execSync('DROP TABLE IF EXISTS guides');
    db.execSync('DROP TABLE IF EXISTS games');
    db.execSync('DROP TABLE IF EXISTS schema_version');
  },
};

// All migrations in order
export const migrations: Migration[] = [migration_v1];

// Get current schema version from database
export function getCurrentVersion(db: SQLiteDatabase): number {
  try {
    const result = db.getFirstSync<{ version: number }>(
      'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
    );
    return result?.version ?? 0;
  } catch (error) {
    // Table doesn't exist yet
    return 0;
  }
}

// Run all pending migrations
export function runMigrations(db: SQLiteDatabase): void {
  const currentVersion = getCurrentVersion(db);

  if (__DEV__) {
    console.log(`Current database version: ${currentVersion}`);
    console.log(`Target database version: ${SCHEMA_VERSION}`);
  }

  if (currentVersion === SCHEMA_VERSION) {
    if (__DEV__) console.log('Database is up to date');
    return;
  }

  if (currentVersion > SCHEMA_VERSION) {
    throw new Error(
      `Database version (${currentVersion}) is higher than app version (${SCHEMA_VERSION}). Please update the app.`
    );
  }

  // Run migrations
  const pendingMigrations = migrations.filter(m => m.version > currentVersion);

  if (__DEV__) console.log(`Running ${pendingMigrations.length} migration(s)...`);

  pendingMigrations.forEach(migration => {
    if (__DEV__) console.log(`Applying migration v${migration.version}...`);
    try {
      migration.up(db);
      if (__DEV__) console.log(`Migration v${migration.version} applied successfully`);
    } catch (error) {
      if (__DEV__) console.error(`Failed to apply migration v${migration.version}:`, error);
      throw error;
    }
  });

  if (__DEV__) console.log('All migrations completed successfully');
}

// Rollback to a specific version (for development/testing)
export function rollbackTo(db: SQLiteDatabase, targetVersion: number): void {
  const currentVersion = getCurrentVersion(db);

  if (targetVersion >= currentVersion) {
    if (__DEV__) console.log('Nothing to rollback');
    return;
  }

  const migrationsToRollback = migrations
    .filter(m => m.version > targetVersion && m.version <= currentVersion)
    .reverse();

  if (__DEV__) console.log(`Rolling back ${migrationsToRollback.length} migration(s)...`);

  migrationsToRollback.forEach(migration => {
    if (!migration.down) {
      throw new Error(`Migration v${migration.version} does not have a rollback function`);
    }
    if (__DEV__) console.log(`Rolling back migration v${migration.version}...`);
    migration.down(db);
  });

  // Update version
  db.execSync(`DELETE FROM schema_version WHERE version > ${targetVersion}`);

  if (__DEV__) console.log(`Rolled back to version ${targetVersion}`);
}
