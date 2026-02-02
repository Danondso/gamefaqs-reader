# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GameFAQs RetroAchievements Reader - A cross-platform React Native (Expo) mobile app for reading GameFAQs text guides offline with RetroAchievements integration. Built with TypeScript, using expo-sqlite for local storage and expo-file-system for guide import.

## Development Commands

### Running the App
```bash
npm start              # Start Expo development server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run web            # Run in web browser
```

### Testing
```bash
npm test               # Run all tests with Jest
npm run test:watch     # Run tests in watch mode
```

### Code Quality
```bash
npx tsc                # Type check with TypeScript
npx eslint .           # Lint code (TypeScript files)
```

### Running Single Test Files
```bash
npx jest src/__tests__/DatabaseService.test.ts
npx jest src/__tests__/GuideParser.test.ts
npx jest src/__tests__/GuideImport.test.ts
```

## Architecture

### Core Flow
1. **App Initialization** ([App.tsx](App.tsx)) - Initializes DatabaseService singleton before rendering
2. **Database Setup** ([DatabaseService.ts](src/services/DatabaseService.ts)) - Runs migrations, sets up SQLite with FTS5 for full-text search
3. **Navigation** ([RootNavigator.tsx](src/navigation/RootNavigator.tsx)) - Bottom tab navigation (Library, Search, Reader, Settings)
4. **Guide Import** ([GuideImportService.ts](src/services/GuideImportService.ts)) - Bulk import from directories, parses multiple formats
5. **Guide Parsing** ([GuideParserService.ts](src/services/GuideParserService.ts)) - Handles txt/html/md formats, extracts metadata, generates auto-tags

### Database Architecture
- **SQLite with expo-sqlite** - Single database: `gamefaqs_reader.db`
- **FTS5 Full-Text Search** - Virtual table `guides_fts` automatically synced via triggers
- **Schema version tracking** - Migrations managed in [migrations.ts](src/database/migrations.ts)
- **Singleton pattern** - DatabaseService must be initialized before use (happens in App.tsx)

### Data Model
See [schema.ts](src/database/schema.ts) for complete schema.

Key tables:
- `guides` - Guide content, title, format (txt/html/md/pdf), file path, game reference
- `games` - Game metadata, RetroAchievements ID, completion status, artwork
- `bookmarks` - Position markers within guides, tracks last-read position
- `notes` - User annotations, can be position-specific or guide-level
- `achievements` - RetroAchievements data, pinning support

Foreign key constraints enabled. Cascading deletes for bookmarks/notes/achievements.

### Models (Active Record Pattern)
Models in [src/models/](src/models/) provide CRUD operations:
- `GuideModel` - Guide management, search integration
- `GameModel` - Game tracking, RA integration
- `BookmarkModel`, `NoteModel`, `AchievementModel` - Supporting features

All models use `nanoid()` for ID generation and auto-manage timestamps.

### Services
- **DatabaseService** - Generic query methods, transaction support, FTS5 search
- **GuideImportService** - Bulk directory scanning, progress callbacks, auto-indexing
- **GuideParserService** - Multi-format parsing, metadata extraction, auto-tagging

### Guide Parsing
- **Local import formats**: `.txt`, `.html`, `.htm`, `.md`, `.markdown` (PDF import requires server)
- **Filename parsing**: Extracts game ID and name from format `id-game-name-faqs-*.txt`
- **Auto-tagging**: Rule-based tags from content (guide type, genre, completeness)
- **Metadata extraction**: Author, version, platform detection from guide content
- **HTML parsing**: Strips tags, preserves text, decodes entities
- **ASCII art preservation**: Text format maintains original formatting

## Path Aliases

The project uses TypeScript path aliases:
- `@/*` maps to `src/*` (configured in [tsconfig.json](tsconfig.json) and [jest.config.js](jest.config.js))

## Important Implementation Notes

### Database Initialization
- DatabaseService.initialize() MUST be called before any database operations
- App.tsx handles this during startup with loading state
- Tests should initialize database in beforeAll/beforeEach hooks

### Guide Import Flow
1. User selects directory via `expo-document-picker`
2. GuideImportService scans recursively for supported file types
3. GuideParserService parses each file based on extension
4. Metadata extraction attempts to find author, version, platform
5. Auto-tagging generates categorization tags
6. Game matching via filename structure (id-game-name format)
7. Database insertion with FTS5 auto-indexing via triggers

### Search Implementation
- Full-text search uses SQLite FTS5 with porter stemming and unicode61 tokenizer
- Triggers auto-maintain guides_fts table on insert/update/delete
- Search returns snippets with match highlighting (`<mark>` tags)
- Ranked by relevance (FTS5 rank)

### Transaction Handling
- Use DatabaseService.transaction() for multi-step operations
- Automatically handles BEGIN/COMMIT/ROLLBACK
- Critical for bulk imports and cascading updates

## Testing Strategy

- **Jest with jest-expo preset** - React Native component testing
- **@testing-library/react-native** - Component interaction testing
- Tests located in `src/__tests__/`
- Path aliases work in tests via jest.config.js moduleNameMapper

## Project Structure

```
src/
├── __tests__/           # Test files
├── components/          # React components (GuideContent, etc.)
├── database/            # Schema definitions, migrations
├── models/              # Data models (Active Record pattern)
├── navigation/          # React Navigation setup
├── screens/             # Screen components (Library, Reader, etc.)
├── services/            # Business logic services
└── types/               # TypeScript type definitions
```

## Known Limitations

- PDF files must be imported via server (local PDF import not supported)
- RetroAchievements integration partially implemented (data model ready, API integration pending)
- No cloud sync (offline-first architecture)
- Single-user local storage only
