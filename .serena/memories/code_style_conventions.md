# Code Style and Conventions

## TypeScript/React Conventions
- **TypeScript**: Strict mode enabled with no implicit any
- **Components**: Functional components with hooks
- **State**: Zustand for global state, useState for local state
- **Async**: All Tauri commands use async/await pattern
- **Error Handling**: Try-catch blocks for Tauri command invocations
- **Imports**: Module imports, no default exports for utilities
- **Types**: Interfaces over type aliases, located in `src/types/`
- **Naming**: PascalCase for components, camelCase for functions/variables

## Rust Conventions
- **Error Handling**: Result types with custom error messages
- **Async**: Tokio for async operations, #[tokio::main] for entry
- **Database**: Singleton pattern with Lazy<Mutex<Connection>>
- **Modules**: Separate files for major features (db, game_scanner, save_manager)
- **Serialization**: Serde for JSON handling
- **Path Handling**: Cross-platform path normalization

## General Patterns
- **No Comments**: Code should be self-documenting
- **Loading States**: Required for all async operations
- **File Paths**: Always validate and use absolute paths
- **Security**: Input validation, especially for file paths
- **Cross-Platform**: Handle Windows/macOS/Linux differences