# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rogame is a cross-platform game save file manager built with Tauri v2, React, and TypeScript. It scans for installed games across various platforms (Steam, Epic, GOG, Origin, etc.) and provides backup/restore functionality for game save files. The app also features cloud integration (Google Drive, Dropbox, OneDrive) and community save file sharing capabilities.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (frontend + Tauri)
npm run dev

# Run server for community saves
cd server && npm run dev

# Build the application
npm run build

# Preview production build
npm run preview

# Run Tauri-specific commands
npm run tauri [command]

# Generate mock community saves
./scripts/generate_server_saves.sh
```

## Architecture Overview

### Frontend (React + TypeScript)

- **State Management**: Zustand stores in `src/store/`
  - `gameStore.ts`: Main game state management
  - `db.ts`: IndexedDB wrapper for browser storage
- **Routing**: React Router v7 with pages in `src/pages/`
- **Styling**: TailwindCSS v4 with Vite plugin
- **i18n**: Supports English and Vietnamese (`src/i18n/`)
- **Platform Icons**: Located in `src/assets/platforms/`

### Backend (Rust + Tauri)

- **Core Modules**:
  - `db.rs`: SQLite database operations
  - `game_scanner.rs`: Platform-specific game scanning logic
  - `save_manager.rs`: Save file backup/restore functionality
  - `cloud_tokens.rs`: OAuth token management for cloud providers
  - `security.rs`: Path validation and security utilities
- **Game Configuration**: `src-tauri/src/save_game_location.json` contains save locations for supported games
- **Async Runtime**: Uses Tokio for async operations

### Server (Node.js + Express)

- **Community Saves API**: Express server for sharing save files
- **File Structure**: `uploads/shared/{steam_id}/{save_id}/`
- **Endpoints**:
  - `GET /api/shared-saves/:gameId` - Get saves for a game
  - `GET /api/shared-saves/download/:saveId` - Download a save
  - `POST /api/shared-saves/reload` - Reload saves from filesystem

### Database Schema

SQLite database stores:

- **games**: Game metadata (id, title, platform, cover_image, last_played, save_location)
- **save_files**: Backup history (id, game_id, file_name, created_at, size_bytes, cloud)
- **cloud_tokens**: OAuth tokens for cloud providers
- **community_saves**: Downloaded community saves (id, game_id, save_name, uploaded_by, local_path)
- **settings**: User preferences and configuration

## Key Implementation Details

### Game Scanning

The scanner checks multiple platform directories:

- Steam: User library folders and common install paths
- Epic Games: Manifest files for installed games
- GOG Galaxy: Game database locations
- Origin: Game installation registry

### Save File Management

- Uses platform-specific save locations defined in `save_game_location.json`
- Supports pattern matching for save files (e.g., `*.sav`, `*.sl2`)
- Handles cross-platform paths with `~` expansion
- Cloud upload integration with Google Drive, Dropbox, OneDrive
- Community save sharing with download/restore functionality
- Automatic save detection and backup scheduling

### Testing

Manual testing scripts available:

```bash
# Generate mock game directories
./scripts/generate_mock_games.sh

# Test backup/restore functionality
./scripts/test_backup_restore.sh
```

## Common Development Tasks

### Adding a New Game

1. Update `src-tauri/src/save_game_location.json` with:
   - Save file locations for each platform
   - File patterns to match
   - Cover image URL
   - Game category
   - Steam App ID for proper identification

### Cloud Integration

1. OAuth flow handled via deep links
2. Tokens stored encrypted in SQLite
3. Upload status tracked per save file
4. Provider icons shown for uploaded saves

### Adding Platform Support

1. Implement scanner logic in `game_scanner.rs`
2. Add platform icon to `src/assets/platforms/`
3. Update platform detection in frontend components

### Modifying Database Schema

1. Update schema in `db.rs`
2. Add migration logic if needed
3. Update corresponding TypeScript types in `src/types/`

## Important Considerations

- **File System Access**: Tauri provides secure file system access - always use Tauri APIs rather than direct file operations
- **Cross-Platform Paths**: Use proper path handling for Windows/macOS/Linux compatibility
- **Async Operations**: All file operations should be async to prevent UI blocking
- **Error Handling**: Game scanning should gracefully handle missing directories and permission errors
- **Security**: All paths are validated to prevent traversal attacks
- **Cloud Security**: OAuth tokens are stored securely and never exposed to frontend
- **Community Saves**: Downloaded saves are isolated and validated before restore

## Known Issues and Technical Debt

### Security (Mostly Resolved)

- ✅ **Path Traversal**: Fixed with security module and path validation
- ✅ **File Operations**: All file operations now validate paths
- ✅ **SQL Injection**: Using parameterized queries throughout
- ⚠️ **CSP**: Still needs to be enabled in production
- ⚠️ **URL Validation**: Cover image URLs still need validation

### Performance Bottlenecks

- **O(n²) Directory Scanning**: `get_directory_size` recursively traverses for each game (8+ minutes for 50 games)
- **N+1 Query Pattern**: Frontend fetches backup counts individually for each game
- **No Caching**: Game metadata and images re-fetched on every scan
- **Synchronous File Operations**: Large backup/restore operations block the UI

### Code Quality Issues

- **Missing TypeScript Types**: Many `any` types and missing interfaces throughout frontend
- **Complex Functions**: Several functions exceed 100 lines (e.g., `scan_games` at 139 lines)
- **DRY Violations**: Duplicate logic between Steam and Epic game scanning
- **No Test Coverage**: Complete absence of unit, integration, and E2E tests

### Architecture Limitations

- **Tight Coupling**: React components directly invoke Tauri commands
- **No Service Layer**: Missing abstraction between UI and backend
- **Global Singleton DB**: Uses `Lazy<Mutex<Connection>>` causing potential contention
- **Hardcoded Configurations**: Game definitions in JSON file limit extensibility

## Recent Features Added

### Cloud Storage Integration
- OAuth2 authentication for Google Drive, Dropbox, OneDrive
- Automatic token refresh
- Upload status indicators on save files
- Deep link handling for OAuth callbacks

### Community Save Sharing
- Express server for hosting shared saves
- Download and restore community saves
- Offline access to downloaded saves
- Pagination for large save lists
- Separate storage from regular backups

### UI Improvements
- Vietnamese and English language support
- Dark theme optimized UI
- Pagination for backup lists
- Loading states and error handling
- Consistent button styling across sections

## Recommended Improvements

### Immediate Fixes (High Priority)

1. **Security**: Implement path validation to prevent traversal attacks
2. **Security**: Enable CSP in `tauri.conf.json`
3. **Performance**: Add React.memo to GameCard components
4. **Quality**: Add TypeScript strict mode and fix type errors

### Short-term Improvements

1. **Testing**: Set up Vitest for frontend, cargo test for backend
2. **Performance**: Implement parallel game scanning with rayon
3. **Architecture**: Extract service layer for Tauri command abstraction
4. **Security**: Add input validation for all user inputs

### Long-term Enhancements

1. **Architecture**: Implement plugin system for game configurations
2. **Performance**: Add SQLite connection pooling
3. **Features**: Real-time save file monitoring with file watchers
4. **Quality**: Achieve 80% test coverage

## Development Best Practices

### When Adding New Features

1. Always validate user input, especially file paths
2. Use proper error types instead of string errors
3. Add loading states for async operations
4. Consider performance impact for users with large game libraries
5. Ensure cross-platform compatibility

### Common Pitfalls to Avoid

1. Don't use synchronous file operations in Tauri commands
2. Don't trust external data (game titles, paths, URLs)
3. Don't update state without considering re-render impact
4. Don't forget to handle edge cases (missing files, permissions)

### Performance Guidelines

- Use virtualization for lists over 100 items
- Implement caching for expensive operations
- Batch database operations when possible
- Use Web Workers for CPU-intensive tasks
- Profile before optimizing

You must always run `!claudepoint` for every change. This is automation. Therefore, please add "[AUTO]" at the beginning of the description. Include a very detailed explanation of the change in the "details" argument.

Run `!uv run .claude/hooks/remove_checkpoint.py` to remove all checkpoints.
