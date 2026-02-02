# Product Requirements Document: GameFAQs RetroAchievements Reader

## Introduction/Overview

The GameFAQs RetroAchievements Reader is a cross-platform mobile application that modernizes the experience of reading classic GameFAQs text-based game guides. The app combines offline-first guide reading with RetroAchievements integration, allowing retro gamers to track achievements while following walkthroughs. The primary problem this solves is the fragmented experience of switching between achievement tracking tools and guide readers, while also preserving access to the valuable archive of GameFAQs guides in a modern, mobile-friendly format.

**Initial Platform:** iOS (with Android support planned post-launch)

## Goals

1. Create an offline-first mobile reader for archived GameFAQs text guides
2. Integrate RetroAchievements API to display and track achievements alongside guides
3. Provide intelligent bookmarking and progress tracking for multiple guides simultaneously
4. Enable searchable access to the entire guide archive with auto-indexing
5. Launch as a paid app ($2 USD) on the iOS App Store with quality user experience
6. Build foundation for future Android release and additional features (Steam Notes integration)

## User Stories

**As a retro gamer, I want to:**
- Import my local archive of GameFAQs guides so I can access them offline on my phone
- Browse guides organized by game, linked to RetroAchievements entries when available
- Read guides with automatic position tracking so I can resume where I left off
- Pin/track specific RetroAchievements while reading a walkthrough to stay focused on my current goals
- Search across all guide content to quickly find information about items, bosses, or strategies
- Mark games as "in progress" or "completed" to organize my gaming backlog
- Create multiple bookmarks/markers within a guide to easily return to important sections
- Take notes on guides and export them for reference outside the app
- Optionally connect my RetroAchievements account to sync my active games and achievement progress

**As a developer/maintainer, I want to:**
- Charge a small one-time fee ($2) to support ongoing development
- Build a clean codebase that can expand to Android in the future
- Comply with iOS App Store guidelines around API key usage and third-party service integration

## Functional Requirements

### 1. Guide Management
1.1. The system must support one-time bulk import of guides from a local archive on initial setup
1.2. The system must parse and display guides in multiple formats (plain text, HTML, and other common formats)
1.3. The system must maintain an offline-first architecture where all imported guides are accessible without internet connection
1.4. The system must automatically index guide content for full-text search capabilities
1.5. The system must support manual import of additional individual guides after initial setup (post-MVP)

### 2. RetroAchievements Integration
2.1. The system must allow optional RetroAchievements login via user-provided API key
2.2. The system must function fully without RetroAchievements login (core reading features available)
2.3. When logged in, the system must fetch and display the user's active games from RetroAchievements
2.4. The system must match imported guides to RetroAchievements game entries with best-effort automated matching
2.5. The system must allow users to manually link/unlink guides to game entries when auto-matching fails
2.6. The system must display achievement lists for games when viewing associated guides
2.7. The system must allow users to pin/track specific achievements while reading a guide
2.8. The system must sync achievement completion status from RetroAchievements API

### 3. Bookmarking & Progress Tracking
3.1. The system must automatically save the last-read position for every opened guide
3.2. The system must allow users to create multiple named bookmarks/markers within a single guide
3.3. The system must persist bookmarks across app sessions
3.4. The system must provide quick navigation to bookmarks from within the guide reader
3.5. The system must display a visual indicator showing bookmark locations within the guide

### 4. Game Library Organization
4.1. The system must provide a game list view showing "in progress" and "completed" games
4.2. The system must automatically categorize games as "in progress" based on RetroAchievements completion percentage (when logged in)
4.3. The system must allow users to manually mark games as "in progress" or "completed"
4.4. The system must show associated guides for each game in the library
4.5. The system must display completion metadata (achievement %, guides opened, etc.)

### 5. Search & Discovery
5.1. The system must provide full-text search across all guide content
5.2. The system must support searching by game title and guide title
5.3. The system must support searching by metadata tags (genre, platform, completion status)
5.4. The system must automatically tag/categorize guides based on content analysis
5.5. The system must display search results with context snippets showing matched content
5.6. The system must rank search results by relevance

### 6. Notes & Annotations
6.1. The system must allow users to create text notes associated with specific guides
6.2. The system must allow users to create notes associated with specific positions/sections within a guide
6.3. The system must support exporting notes to standard formats (plain text, markdown, or JSON)
6.4. The system must persist notes offline
6.5. The system must display note indicators within the guide reader

### 7. iOS App Store Compliance
7.1. The app must be packaged and distributed as a paid app ($2 USD one-time purchase)
7.2. The app must comply with iOS App Store guidelines for third-party API usage
7.3. The app must implement proper user consent flows for RetroAchievements API key storage
7.4. The app must include appropriate privacy policy and data handling disclosures
7.5. The app must support current iOS version and maintain backward compatibility with one prior major version

## Non-Goals (Out of Scope for v1.0)

- Android version (planned for future release)
- Steam Notes integration (deferred until after RetroAchievements integration is stable)
- Continuous folder sync or automatic guide updates
- In-app guide editing or user-submitted guide hosting
- Social features (sharing, comments, ratings)
- Cloud sync of bookmarks/notes across devices
- Video walkthrough integration
- Emulator integration or ROM launching
- Achievement-based search filtering (deferred as complex to implement)
- Real-time multiplayer or co-op guide features

## Design Considerations

### UI/UX Requirements
- **Reader View:** Clean, distraction-free text reader with adjustable font size and theming (light/dark mode)
- **Navigation:** Bottom tab bar with sections for Library, Search, Reader, and Settings
- **Achievement Sidebar/Overlay:** Persistent or slide-out panel showing pinned achievements while reading
- **Bookmark Interface:** Visual markers in scrollbar/progress indicator, swipe or long-press to create bookmarks
- **Library View:** Card-based or list view showing game artwork (from RetroAchievements), title, progress, and guide count
- **Import Flow:** First-run wizard guiding user through archive import with progress indicator

### Accessibility
- Support iOS Dynamic Type for font scaling
- VoiceOver compatibility for guide reading
- High contrast mode support

### Platform-Specific
- Follow iOS Human Interface Guidelines
- Use native iOS UI components where appropriate
- Optimize for iPhone (iPad support as stretch goal)

## Technical Considerations

### Architecture
- **Framework:** React Native or Flutter recommended for future Android compatibility
- **Database:** Local SQLite or Realm for guide metadata, bookmarks, notes, and search index
- **Search:** Consider full-text search library (e.g., FlexSearch, SQLite FTS5) for guide content indexing
- **File Parsing:** Multi-format parser supporting .txt, .html, and potentially .md files

### Dependencies
- RetroAchievements API client library
- File system access for initial archive import
- Background task handling for indexing guides during initial import
- Secure storage (iOS Keychain) for RetroAchievements API keys

### Data Model (Key Entities)
- **Guide:** id, title, content, format, file_path, game_id (nullable), last_read_position, created_at, updated_at
- **Game:** id, title, ra_game_id (nullable), platform, completion_percentage, status (in_progress/completed), artwork_url
- **Bookmark:** id, guide_id, position, name, created_at
- **Note:** id, guide_id, position (nullable), content, created_at, updated_at
- **Achievement:** id, ra_achievement_id, game_id, title, description, is_pinned, is_unlocked
- **SearchIndex:** Derived from guide content for full-text search

### API Integration Notes
- RetroAchievements API requires user's username and web API key (not OAuth)
- API key should be user-provided and stored securely
- Consider rate limiting and caching API responses to minimize network usage
- Handle offline gracefully (cached data remains accessible)

### Performance Considerations
- Initial import may be slow for large archives (thousands of guides); implement background processing with progress feedback
- Full-text indexing should be asynchronous and non-blocking
- Guide content should be lazy-loaded (not all loaded into memory at once)
- Consider pagination or virtualization for long guides

## Success Metrics

1. **User Adoption:** 100+ downloads in first month post-launch
2. **User Retention:** 60%+ of users return to app within 7 days of first use
3. **Guide Usage:** Average user opens 5+ guides within first week
4. **RetroAchievements Integration:** 40%+ of users connect RetroAchievements account
5. **Search Engagement:** Search used by 70%+ of users within first month
6. **App Store Rating:** Maintain 4.0+ star rating on iOS App Store
7. **Completion Rate:** Users mark at least 1 game as "completed" within first month (indicating active usage)
8. **Note-Taking:** 30%+ of users create at least one note
9. **Technical Performance:** App launches in under 3 seconds, guide opens in under 1 second
10. **Crash-Free Rate:** 99%+ crash-free sessions

## Open Questions

1. **Archive Format:** What is the exact directory structure and naming convention of the GameFAQs archive? Will guides need to be matched to games purely by filename parsing or is there metadata available?

Answer: It came from internet archive so it's just a multi-part dump organized by part/system_name/faqs/id-game-name.txt

2. **RetroAchievements API Key Flow:** Does requiring users to obtain their own API key from RetroAchievements comply with iOS App Store guidelines? Should we investigate alternative authentication methods?

Answer: I don't know, find that out for me.

3. **Guide Parsing Complexity:** How varied are the guide formats? Will we need custom parsers for each format or can a generic HTML/text renderer handle most cases?

Varied, expect, pdf, md, html, I'll pass over the entire directory so you can see what's in there.

4. **Image Handling:** Do any guides contain ASCII art or references to external images? How should these be rendered?

Yes, render them normally I want the ASCII art to look like it did if you were on the website

5. **Auto-Tagging Strategy:** What metadata can be extracted from guides (genre, platform, completion time)? Should we use LLM-based tagging or rule-based extraction?

Yes, maybe all of it, I like rule-based but I want the implementation to be lean. Let's focus on rule-based for now I don't want to muddle the intent adding AI to this.

6. **Trademark/Copyright:** Are there any legal considerations for using GameFAQs guide content or RetroAchievements branding in a paid app? (Assumes user owns archive legally)

Users have to get the archive themselves, and I'm unsure we might need to find other examples of apps doing this.

7. **Guide Updates:** If GameFAQs guides are occasionally updated, should there be a mechanism to refresh specific guides, or is the archive considered static?

Static.

8. **Achievement Search:** While deferred for MVP, what would the ideal UX be for "search guides mentioning this achievement"? Would this require achievement name matching in guide content?

I think this is too hard to make, let's can it.

9. **Multi-Game Guides:** How should guides that cover multiple games (e.g., series compilations) be handled in the game-to-guide matching system?

Individual game / guide matching don't worry about groups for MVP.

10. **Export Format Preferences:** For note export, which format would be most useful to users (plain text, markdown, CSV, JSON)?

JSON

---

## Next Steps

1. Review and approve this PRD
2. Investigate RetroAchievements API authentication flow and iOS App Store compliance
3. Analyze sample guides from archive to inform parser design
4. Create technical architecture document
5. Design wireframes for key screens (Library, Reader, Achievement Tracker)
6. Set up development environment and project structure
7. Begin implementation starting with guide import and basic reader functionality
