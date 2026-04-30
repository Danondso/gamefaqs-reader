# GameFAQs Reader

A cross-platform mobile app for reading GameFAQs text walkthroughs offline, with optional RetroAchievements integration. Built with Expo and React Native.

The app pairs with [gamefaqs-server](https://github.com/Danondso/gamefaqs-server), which hosts the GameFAQs guide archive and exposes a REST API.

## Features

- Offline-first: guides are cached locally in SQLite and remain available without a network connection
- Full-text search across imported guides (SQLite FTS5)
- Library, Search, Reader, Downloads, and Settings screens
- Bookmarks and notes scoped to a guide or to a position within a guide
- Local import of `.txt`, `.html`, `.md` guides via the document picker
- RetroAchievements data model in place (API integration is in progress)
- Light and dark themes following system appearance

## Tech Stack

- Expo SDK 54 / React Native 0.81 / React 19
- TypeScript
- React Navigation (bottom tabs + stack)
- expo-sqlite with FTS5 for local cache and search
- TanStack Query for server data
- Jest with `jest-expo` for tests

## Getting Started

### Prerequisites

- Node.js (LTS)
- For native builds: Xcode (iOS) or Android Studio (Android)

### Install

```bash
npm install
```

### Run

```bash
npm start          # Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web build
```

### Test and lint

```bash
npm test           # Jest
npx tsc            # Type check
npx eslint .       # Lint
```

### Build (Android APK)

```bash
npm run build:android    # Local EAS build, preview profile
```

## Project Structure

```
src/
├── components/      # Shared UI components
├── contexts/        # Theme, settings providers
├── database/        # Schema, migrations, offline cache
├── models/          # Active Record models (Guide, Game, Bookmark, Note, Achievement)
├── navigation/      # Root navigator and tab setup
├── providers/       # Query and network providers
├── screens/         # Library, Search, Reader, Downloads, Settings
├── services/        # Guide import, parsing, database access
└── types/           # Shared TypeScript types
```

## Companion Server

To browse and download guides from the GameFAQs archive, point the reader at a running [gamefaqs-server](https://github.com/Danondso/gamefaqs-server) instance from the Settings screen. The server can be self-hosted via Docker.

## Privacy

See [PRIVACY.md](PRIVACY.md). The app stores all reading data locally; no analytics or tracking are included.

## License

MIT — see [LICENSE](LICENSE).
