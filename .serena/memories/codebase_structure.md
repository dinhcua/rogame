# Codebase Structure

## Root Directory
```
rogame/
├── src/                    # React frontend source
├── src-tauri/              # Rust backend source
├── server/                 # Node.js backend for cloud features
├── scripts/                # Testing and utility scripts
├── public/                 # Static assets
├── .claude/                # Claude-specific configuration
└── .serena/               # Serena MCP configuration

## Frontend Structure (src/)
src/
├── assets/platforms/       # Platform icons (Steam, Epic, etc.)
├── components/            # React components
├── contexts/              # React contexts
├── hooks/                 # Custom React hooks
├── i18n/                  # Internationalization files
├── pages/                 # Route pages
├── store/                 # Zustand state management
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions

## Backend Structure (src-tauri/)
src-tauri/
├── src/
│   ├── main.rs           # Entry point
│   ├── lib.rs            # Library exports
│   ├── db.rs             # SQLite database operations
│   ├── game_scanner.rs   # Game detection logic
│   ├── save_manager.rs   # Save file operations
│   ├── cloud_tokens.rs   # Cloud service integration
│   └── *.json            # Game/save location configs
├── icons/                # Application icons
└── Cargo.toml           # Rust dependencies

## Key Configuration Files
- package.json            # Node dependencies and scripts
- tauri.conf.json        # Tauri configuration
- tsconfig.json          # TypeScript configuration
- vite.config.ts         # Vite bundler configuration
- CLAUDE.md              # Project documentation for Claude
```