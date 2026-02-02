// Import built-in matchers from @testing-library/jest-native
import '@testing-library/jest-native/extend-expect';

// Mock expo-sqlite with better-sqlite3 for testing
jest.mock('expo-sqlite', () => {
  const Database = require('better-sqlite3');

  return {
    openDatabaseAsync: jest.fn().mockImplementation(() => {
      // Create in-memory SQLite database for testing
      const db = new Database(':memory:');

      return Promise.resolve({
        execAsync: async (sql) => {
          db.exec(sql);
        },
        execSync: (sql) => {
          db.exec(sql);
        },
        runAsync: async (sql, params = []) => {
          const stmt = db.prepare(sql);
          const result = stmt.run(...params);
          return { lastInsertRowId: result.lastInsertRowid, changes: result.changes };
        },
        getFirstAsync: async (sql, params = []) => {
          const stmt = db.prepare(sql);
          return stmt.get(...params) || null;
        },
        getFirstSync: (sql, params = []) => {
          const stmt = db.prepare(sql);
          return stmt.get(...params) || null;
        },
        getAllAsync: async (sql, params = []) => {
          const stmt = db.prepare(sql);
          return stmt.all(...params);
        },
        closeAsync: async () => {
          db.close();
        },
        prepareAsync: async (sql) => {
          const stmt = db.prepare(sql);
          return {
            executeAsync: async (...params) => {
              const result = stmt.run(...params);
              return { lastInsertRowId: result.lastInsertRowid, changes: result.changes };
            },
            finalizeAsync: async () => {
              // No-op for better-sqlite3
            },
          };
        },
      });
    }),
    openDatabaseSync: jest.fn(),
  };
});

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/document/directory/',
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
}));

// Mock expo-file-system/next - disabled for now due to Jest async generator issues
jest.mock('expo-file-system/next', () => {
  return {
    File: class File {
      constructor(filePath) {
        this.filePath = filePath;
      }
      async text() {
        return '';
      }
    },
    Directory: class Directory {
      constructor(directoryPath) {
        this.directoryPath = directoryPath;
      }
      [Symbol.asyncIterator]() {
        return {
          next: () => Promise.resolve({ done: true, value: undefined }),
        };
      }
    },
  };
});

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));
