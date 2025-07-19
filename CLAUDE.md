# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rogame is a cross-platform game save file manager built with Tauri v2, React, and TypeScript. It scans for installed games across various platforms (Steam, Epic, GOG, Origin, etc.) and provides backup/restore functionality for game save files.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (frontend + Tauri)
npm run dev

# Build the application
npm run build

# Preview production build
npm run preview

# Run Tauri-specific commands
npm run tauri [command]
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
- **Game Configuration**: `src-tauri/src/save_game_location.json` contains save locations for supported games
- **Async Runtime**: Uses Tokio for async operations

### Database Schema
SQLite database stores:
- Games metadata (name, platform, cover_image, last_played)
- Backup history and locations
- User preferences (favorites, categories)

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

## Known Issues and Technical Debt

### Critical Security Vulnerabilities
- **Path Traversal**: Multiple functions accept user-controlled paths without validation (CVSS 8.5)
- **Arbitrary File Deletion**: `delete_game_saves` and `delete_save_file` lack path validation (CVSS 9.1)
- **SQL Injection Risk**: Some queries use string concatenation instead of proper parameterization
- **Insecure URL Handling**: External cover image URLs loaded without validation, CSP disabled

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