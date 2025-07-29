# Development Commands

## Primary Commands
```bash
# Install dependencies
npm install

# Run development server (frontend + Tauri)
npm run dev

# Run all services (frontend + backend server + Tauri)
npm run dev:all

# Build the application
npm run build

# Preview production build
npm run preview

# Run specific Tauri commands
npm run tauri [command]
```

## Server Commands (if using cloud features)
```bash
# Run backend server in development
npm run server:dev

# Build backend server
npm run server:build

# Start backend server
npm run server:start
```

## Testing & Quality
```bash
# Currently no test commands configured
# Manual testing scripts available:
./scripts/generate_mock_games.sh
./scripts/test_backup_restore.sh
```

## Git Commands
```bash
# Check status
git status

# View diffs
git diff

# Create commits (include emoji and co-author)
git commit -m "message

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Checkpoint Management (via Claude hooks)
```bash
# Create checkpoint (automation)
!claudepoint

# Remove all checkpoints
!uv run .claude/hooks/remove_checkpoint.py
```

## Notes
- No linting or formatting tools configured currently
- TypeScript compilation happens via `tsc` in build process
- Consider adding ESLint, Prettier, and rustfmt for code quality