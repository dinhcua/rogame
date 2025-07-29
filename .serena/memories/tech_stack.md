# Technology Stack

## Frontend
- **Framework**: React 18.3.1 with TypeScript 5.6.2
- **Build Tool**: Vite 6.0.3
- **Styling**: TailwindCSS v4 with Vite plugin
- **State Management**: Zustand 5.0.5
- **Routing**: React Router v7.6.2
- **i18n**: i18next 25.2.1 + react-i18next
- **Icons**: Lucide React 0.516.0
- **TypeScript Config**: Strict mode enabled

## Backend (Tauri)
- **Framework**: Tauri v2.0.0-alpha.18
- **Language**: Rust (edition 2021)
- **Database**: SQLite via rusqlite 0.30.0 (bundled)
- **Async Runtime**: Tokio 1.32.0 (multi-threaded)
- **File Operations**: walkdir 2.4.0, glob 0.3.1
- **Compression**: zip 0.6
- **Deep Linking**: tauri-plugin-deep-link
- **Single Instance**: tauri-plugin-single-instance

## Development Tools
- **Frontend Dev**: Vite dev server
- **Backend Dev**: Tauri CLI
- **Type Checking**: TypeScript compiler (tsc)
- **Process Management**: Concurrently for parallel dev servers