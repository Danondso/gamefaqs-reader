# Task List: GameFAQs RetroAchievements Reader

## Relevant Files

*Note: Files will be created as needed during implementation. This section will be updated with actual file paths as the project structure is established.*

### Project Structure & Configuration
- `package.json` - Project dependencies and scripts
- `app.json` / `expo.json` - React Native/Expo configuration (if using Expo)
- `ios/` - iOS-specific native code and configurations
- `tsconfig.json` - TypeScript configuration
- `.gitignore` - Git ignore rules

### Core Application
- `src/App.tsx` - Main application entry point
- `src/navigation/RootNavigator.tsx` - Root navigation structure with tab bar
- `src/types/index.ts` - TypeScript type definitions for data models

### Database & Storage
- `src/database/schema.ts` - Database schema definitions for SQLite
- `src/database/migrations.ts` - Database migration scripts
- `src/services/DatabaseService.ts` - Database operations wrapper
- `src/services/StorageService.ts` - Secure storage for API keys (iOS Keychain)

### Guide Management
- `src/services/GuideImportService.ts` - Handles bulk import of guides from archive
- `src/services/GuideParserService.ts` - Parses multiple guide formats (txt, html, pdf, md)
- `src/services/SearchIndexService.ts` - Full-text search indexing for guide content
- `src/models/Guide.ts` - Guide data model and database operations
- `src/screens/GuideReaderScreen.tsx` - Main guide reading interface
- `src/components/GuideContent.tsx` - Renders guide content with proper formatting

### RetroAchievements Integration
- `src/services/RetroAchievementsAPI.ts` - API client for RetroAchievements
- `src/services/GameMatchingService.ts` - Matches guides to RA game entries
- `src/models/Game.ts` - Game data model and database operations
- `src/models/Achievement.ts` - Achievement data model and database operations
- `src/screens/SettingsScreen.tsx` - Settings including RA API key input
- `src/components/AchievementPanel.tsx` - Achievement tracking sidebar/overlay

### Library & Navigation
- `src/screens/LibraryScreen.tsx` - Game library with in-progress/completed views
- `src/screens/SearchScreen.tsx` - Search interface for guides
- `src/components/GameCard.tsx` - Game card component for library view
- `src/components/GuideListItem.tsx` - Guide list item component

### Bookmarking & Notes
- `src/models/Bookmark.ts` - Bookmark data model and database operations
- `src/models/Note.ts` - Note data model and database operations
- `src/services/NoteExportService.ts` - Export notes to JSON
- `src/components/BookmarkIndicator.tsx` - Visual bookmark markers in reader
- `src/components/NoteEditor.tsx` - Note creation/editing interface

### Testing
- `src/__tests__/GuideParser.test.ts` - Unit tests for guide parsing
- `src/__tests__/SearchIndex.test.ts` - Unit tests for search functionality
- `src/__tests__/RetroAchievementsAPI.test.ts` - Unit tests for RA API integration
- `src/__tests__/DatabaseService.test.ts` - Unit tests for database operations

### Notes

- This is a React Native project targeting iOS initially
- Use TypeScript for type safety
- Use SQLite for local database (consider `expo-sqlite` or `react-native-sqlite-storage`)
- Use iOS Keychain for secure API key storage (`expo-secure-store` or `react-native-keychain`)
- Consider using Expo for easier iOS development and future Android compatibility
- Testing framework: Jest + React Native Testing Library

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch for this feature (`git checkout -b feature/initial-app-setup`)

- [ ] 1.0 Project Setup & Core Infrastructure
  - [x] 1.1 Research iOS App Store guidelines regarding third-party API keys (RetroAchievements)
  - [x] 1.2 Decide on React Native framework (Expo vs React Native CLI) based on iOS requirements
  - [x] 1.3 Initialize React Native project with TypeScript support
  - [x] 1.4 Configure project structure (create `src/` directories for screens, components, services, models, database, navigation, types)
  - [x] 1.5 Install core dependencies: navigation library (@react-navigation/native, @react-navigation/bottom-tabs), SQLite database library, secure storage library
  - [x] 1.6 Set up TypeScript configuration with strict mode
  - [x] 1.7 Configure ESLint and Prettier for code quality
  - [x] 1.8 Set up testing framework (Jest + React Native Testing Library)
  - [x] 1.9 Create `.gitignore` with appropriate rules for React Native/iOS
  - [x] 1.10 Initialize basic app structure with navigation skeleton (tab navigator with placeholder screens)

- [ ] 2.0 Database Schema & Models
  - [x] 2.1 Design database schema for all entities (Guide, Game, Bookmark, Note, Achievement)
  - [x] 2.2 Create `src/database/schema.ts` with SQLite table definitions
  - [x] 2.3 Implement `src/services/DatabaseService.ts` with initialization, connection management, and basic CRUD operations
  - [x] 2.4 Create database migration system in `src/database/migrations.ts`
  - [x] 2.5 Implement `src/models/Guide.ts` with methods for creating, reading, updating, deleting guides
  - [x] 2.6 Implement `src/models/Game.ts` with methods for game CRUD operations and status management
  - [x] 2.7 Implement `src/models/Bookmark.ts` for bookmark persistence
  - [x] 2.8 Implement `src/models/Note.ts` for note persistence
  - [x] 2.9 Implement `src/models/Achievement.ts` for achievement data management
  - [x] 2.10 Create `src/types/index.ts` with TypeScript interfaces for all data models
  - [x] 2.11 Write unit tests for DatabaseService (`src/__tests__/DatabaseService.test.ts`)
  - [x] 2.12 Test database initialization and verify tables are created correctly

- [ ] 3.0 Guide Import & Parsing System
  - [x] 3.1 Implement `src/services/GuideParserService.ts` with parsers for .txt, .html, .md, and .pdf formats
  - [x] 3.2 Ensure ASCII art rendering preserves formatting (use monospace font, proper whitespace handling)
  - [x] 3.3 Extract metadata from guide filenames (game ID, game name) based on archive structure (id-game-name.txt)
  - [x] 3.4 Implement rule-based auto-tagging for guides (extract platform, genre hints from content/filename)
  - [x] 3.5 Create `src/services/GuideImportService.ts` for bulk import functionality
  - [x] 3.6 Implement file system access to read guides from user-selected archive directory
  - [x] 3.7 Add background processing for import with progress tracking (process guides asynchronously)
  - [x] 3.8 Store parsed guide content and metadata in database via Guide model
  - [x] 3.9 Implement error handling for corrupted or unsupported guide formats
  - [x] 3.10 Create first-run import wizard UI flow with progress indicator
  - [x] 3.11 Write unit tests for GuideParserService (`src/__tests__/GuideParser.test.ts`)
  - [ ] 3.12 Test import with sample guides from both example directories (Star Fox, Baldr Force EXE)

- [ ] 4.0 Guide Reader Interface
  - [x] 4.1 Create `src/screens/GuideReaderScreen.tsx` with basic layout
  - [x] 4.2 Implement `src/components/GuideContent.tsx` to render guide text with proper formatting
  - [x] 4.3 Support monospace font rendering for ASCII art preservation
  - [x] 4.4 Implement scroll position tracking to detect current reading position
  - [x] 4.5 Auto-save last read position to database when user exits guide
  - [x] 4.6 Auto-restore last read position when reopening guide
  - [x] 4.7 Add font size adjustment controls (accessibility)
  - [x] 4.8 Implement light/dark mode theming for reader
  - [x] 4.9 Add loading states for guide content
  - [ ] 4.10 Implement lazy loading for long guides (virtualized scrolling if needed)
  - [x] 4.11 Add error handling for missing or corrupted guide content
  - [ ] 4.12 Test reader performance with large guides (10,000+ lines)

- [ ] 5.0 Search & Indexing System
  - [x] 5.1 Research and select full-text search library (SQLite FTS5 or FlexSearch) (using in-memory filtering for now)
  - [ ] 5.2 Create `src/services/SearchIndexService.ts` for indexing guide content
  - [ ] 5.3 Implement asynchronous indexing during guide import (non-blocking)
  - [x] 5.4 Index guide title, game title, and full guide content (in-memory search implemented)
  - [x] 5.5 Index metadata tags (platform, genre, completion status) (searching tags implemented)
  - [x] 5.6 Implement search query parsing and execution (basic string matching)
  - [ ] 5.7 Implement search result ranking by relevance
  - [x] 5.8 Create `src/screens/SearchScreen.tsx` with search input and results list
  - [ ] 5.9 Display context snippets showing matched content in search results
  - [ ] 5.10 Add search filters (by platform, game status, tags)
  - [ ] 5.11 Implement search history/suggestions
  - [ ] 5.12 Write unit tests for SearchIndexService (`src/__tests__/SearchIndex.test.ts`)
  - [ ] 5.13 Test search performance with full archive (measure query speed)

- [ ] 6.0 RetroAchievements API Integration
  - [ ] 6.1 Research RetroAchievements API documentation (authentication, endpoints, rate limits)
  - [ ] 6.2 Verify iOS App Store compliance for user-provided API keys (from task 1.1 findings)
  - [ ] 6.3 Create `src/services/RetroAchievementsAPI.ts` with API client methods
  - [ ] 6.4 Implement API methods: authenticate, fetch user profile, fetch user game list, fetch game achievements
  - [ ] 6.5 Implement API response caching to minimize network usage and handle offline mode
  - [ ] 6.6 Implement rate limiting to comply with RA API restrictions
  - [ ] 6.7 Create `src/services/GameMatchingService.ts` for matching guides to RA game entries
  - [ ] 6.8 Implement best-effort automated matching using game name/ID from guide filename
  - [ ] 6.9 Store matched game data (title, platform, RA game ID, artwork URL) in database
  - [ ] 6.10 Implement manual link/unlink functionality for game-guide associations
  - [ ] 6.11 Fetch and store achievement lists for matched games
  - [ ] 6.12 Sync achievement completion status from RA API
  - [ ] 6.13 Create `src/components/AchievementPanel.tsx` for displaying pinned achievements
  - [ ] 6.14 Implement achievement pin/unpin functionality
  - [ ] 6.15 Add achievement overlay/sidebar to GuideReaderScreen
  - [ ] 6.16 Handle offline mode gracefully (display cached data, disable sync)
  - [ ] 6.17 Write unit tests for RetroAchievementsAPI (`src/__tests__/RetroAchievementsAPI.test.ts`)
  - [ ] 6.18 Test API integration with real RA account (if possible) or mock data

- [ ] 7.0 Game Library & Organization
  - [x] 7.1 Create `src/screens/LibraryScreen.tsx` with tabs/sections for "In Progress" and "Completed" (basic version - displays all guides)
  - [ ] 7.2 Implement `src/components/GameCard.tsx` to display game artwork, title, progress, guide count
  - [ ] 7.3 Fetch game artwork URLs from RetroAchievements API
  - [ ] 7.4 Display games with associated guides in library view
  - [ ] 7.5 Implement automatic "in progress" categorization based on RA completion percentage
  - [ ] 7.6 Implement manual status override (user can manually mark games as in progress/completed)
  - [ ] 7.7 Display completion metadata (achievement percentage, number of guides opened)
  - [ ] 7.8 Implement sorting options (by name, by progress, by last played)
  - [ ] 7.9 Implement filtering options (by platform, by status)
  - [x] 7.10 Create `src/components/GuideListItem.tsx` for displaying guides associated with a game (inline in LibraryScreen)
  - [x] 7.11 Navigate from game to list of associated guides (basic navigation implemented)
  - [x] 7.12 Navigate from guide list item to GuideReaderScreen
  - [x] 7.13 Handle empty states (no games, no guides for a game)

- [ ] 8.0 Bookmarking & Progress Tracking
  - [x] 8.1 Implement automatic last-read position tracking (already in task 4.5-4.6, ensure persisted to Bookmark model)
  - [x] 8.2 Create UI for creating named bookmarks (long-press or button in reader)
  - [x] 8.3 Implement bookmark creation with user-defined names
  - [x] 8.4 Store bookmarks in database using Bookmark model
  - [ ] 8.5 Create `src/components/BookmarkIndicator.tsx` to show visual markers in scrollbar/progress bar
  - [ ] 8.6 Display bookmark locations within the guide reader
  - [x] 8.7 Implement bookmark list view (accessible from reader menu/toolbar)
  - [x] 8.8 Implement quick navigation to bookmarks (tap bookmark to jump to position)
  - [x] 8.9 Implement bookmark deletion
  - [ ] 8.10 Implement bookmark editing (rename)
  - [ ] 8.11 Test multiple bookmarks per guide
  - [ ] 8.12 Test bookmark persistence across app restarts

- [ ] 9.0 Notes & Annotations System
  - [ ] 9.1 Create `src/components/NoteEditor.tsx` for creating/editing notes
  - [ ] 9.2 Implement note creation UI (button/menu in guide reader)
  - [ ] 9.3 Support notes associated with specific guide positions/sections
  - [ ] 9.4 Support notes associated with entire guide (position nullable)
  - [ ] 9.5 Store notes in database using Note model
  - [ ] 9.6 Display note indicators within guide reader (icon/marker at note positions)
  - [ ] 9.7 Implement note list view (show all notes for current guide)
  - [ ] 9.8 Implement note editing and deletion
  - [ ] 9.9 Create `src/services/NoteExportService.ts` for exporting notes to JSON
  - [ ] 9.10 Implement export functionality (allow user to save JSON file to device)
  - [ ] 9.11 Test note creation, editing, deletion workflow
  - [ ] 9.12 Test note export with multiple notes (verify JSON format)

- [ ] 10.0 Settings & Configuration
  - [x] 10.1 Create `src/screens/SettingsScreen.tsx` with sections for RA integration, appearance, about
  - [ ] 10.2 Implement `src/services/StorageService.ts` using iOS Keychain for secure API key storage
  - [ ] 10.3 Create RA API key input UI in settings
  - [ ] 10.4 Implement user consent flow for API key storage (explain why key is needed, what data is accessed)
  - [ ] 10.5 Store RA username and API key securely using StorageService
  - [ ] 10.6 Add "Test Connection" button to verify RA API credentials
  - [ ] 10.7 Implement logout/disconnect from RA (clear stored credentials)
  - [x] 10.8 Add appearance settings (font size, theme preference)
  - [x] 10.9 Add about section (app version, credits, privacy policy link, open source licenses)
  - [ ] 10.10 Test secure storage of API keys (verify stored in iOS Keychain)
  - [ ] 10.11 Test app functionality without RA login (verify core features work offline)

- [ ] 11.0 iOS App Store Preparation
  - [ ] 11.1 Create app icon in required sizes for iOS
  - [ ] 11.2 Create launch/splash screen
  - [ ] 11.3 Implement proper app metadata (bundle ID, version, display name)
  - [ ] 11.4 Draft privacy policy document addressing data collection (RA API keys, user notes, bookmarks)
  - [ ] 11.5 Add privacy policy link in settings screen
  - [ ] 11.6 Implement iOS App Store In-App Purchase for $2 paid app model (or configure as paid download)
  - [ ] 11.7 Configure app signing and provisioning profiles for iOS
  - [ ] 11.8 Test app on physical iOS device (not just simulator)
  - [ ] 11.9 Verify iOS version compatibility (current iOS + one prior major version)
  - [ ] 11.10 Optimize app performance (measure launch time, guide open time against success metrics)
  - [ ] 11.11 Prepare App Store listing materials (description, screenshots, keywords)
  - [ ] 11.12 Verify compliance with iOS Human Interface Guidelines
  - [ ] 11.13 Review iOS App Store guidelines for any violations (API usage, content, payments)

- [ ] 12.0 Testing & Quality Assurance
  - [ ] 12.1 Run all unit tests and ensure they pass (`npx jest`)
  - [ ] 12.2 Perform integration testing: import guides → search → read → bookmark → take notes → export
  - [ ] 12.3 Test RA integration flow: login → fetch games → match guides → view achievements → pin achievements
  - [ ] 12.4 Test offline mode: import guides → disconnect internet → verify reading, search, notes work
  - [ ] 12.5 Test with large archive (1000+ guides) and measure import time and app performance
  - [ ] 12.6 Test all guide formats (.txt, .html, .md, .pdf) to ensure proper rendering
  - [ ] 12.7 Test ASCII art rendering with sample guides (Star Fox, Baldr Force EXE)
  - [ ] 12.8 Test accessibility features (Dynamic Type, VoiceOver, high contrast mode)
  - [ ] 12.9 Perform memory leak testing (ensure long reading sessions don't cause crashes)
  - [ ] 12.10 Test edge cases: empty archive, corrupted guides, invalid RA credentials, no internet
  - [ ] 12.11 Verify crash-free rate (use crash reporting tool like Sentry or Crashlytics)
  - [ ] 12.12 Fix all critical bugs identified during testing
  - [ ] 12.13 Perform final QA pass before App Store submission
