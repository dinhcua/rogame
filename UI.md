# Rogame UI Documentation

## Overview

Rogame is a cross-platform game save file manager with a modern React-based UI built on Tauri v2. The interface features a dark gaming aesthetic with responsive design and internationalization support.

## Architecture

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v7
- **State Management**: Zustand
- **Styling**: TailwindCSS v4
- **Icons**: Lucide React
- **i18n**: react-i18next (English & Vietnamese)

### Design System

#### Color Palette
- **Background**: `game-dark` (#0a0a0a)
- **Cards**: `game-card` (#1a1a1a)  
- **Sidebar**: `sidebar` (#141414)
- **Primary**: `rog-blue` (#00b4d8)
- **Text**: White with opacity variants

#### Typography
- Font: System default (sans-serif)
- Sizes: text-xs to text-2xl
- Weights: normal, medium, semibold, bold

## Pages

### 1. Game Library (`/`)
**File**: `src/pages/GameUI.tsx`

Main dashboard displaying all games with:
- **Scanner Section**: Progress bar showing game detection status
- **Found Games**: Newly discovered games ready for import
- **Filters**: Search, platform filter, category filter, sort options
- **Game Grid**: Responsive card layout with hover effects
- **Actions**: Add game, scan games, bulk import

### 2. Game Detail (`/game/:id`)
**File**: `src/pages/GameDetail.tsx`

Individual game management interface:
- **Hero Section**: Large game artwork banner
- **Info Panel**: Title, platform, last played, storage size
- **Actions**: Backup now, restore, delete game
- **Save Files**: List with metadata and individual actions
- **Settings**: Auto-backup configuration

### 3. Settings (`/settings`)
**File**: `src/pages/Settings.tsx`

Application configuration:
- **General**: Language, dark mode, notifications, startup behavior
- **Backup**: Default location, compression, scheduling
- **Cloud Storage**: Google Drive, Dropbox, OneDrive integration
- **Danger Zone**: Data reset options

### 4. History (`/history`)
**File**: `src/pages/History.tsx`

Backup history management:
- **Search**: Find backups by game name
- **Filters**: Date range selection
- **List View**: Paginated backup cards
- **Actions**: Quick restore, view details

## Components

### Layout Components

#### Layout
**File**: `src/components/Layout.tsx`
- Fixed sidebar navigation (64px width)
- Icon-based menu items
- Active state highlighting
- Content area with responsive padding

### Modal Components

#### AddGameModal
**File**: `src/components/AddGameModal.tsx`
- Manual game addition form
- Platform selection dropdown
- Save location path input
- Pattern configuration
- Auto-backup toggle

#### DeleteGameModal
**File**: `src/components/DeleteGameModal.tsx`
- Confirmation dialog
- Checkbox for save file deletion
- Warning text with game name
- Cancel/Delete action buttons

#### RestoreModal
**File**: `src/components/RestoreModal.tsx`
- Save file selection list
- File metadata display
- Radio button selection
- Restore action

#### NotificationModal
**File**: `src/components/NotificationModal.tsx`
- Success/error states
- Auto-dismiss (3 seconds)
- Centered overlay positioning
- Icon with message display

### Utility Components

#### PlatformIcon
**File**: `src/components/PlatformIcon.tsx`
- Platform-specific icon rendering
- Supports: Steam, Epic, GOG, Origin, Other
- Cloud providers: Google Drive, Dropbox, OneDrive
- Consistent 24x24 sizing

#### DropdownSelect
**File**: `src/components/DropdownSelect.tsx`
- Reusable dropdown with custom styling
- Icon support in options
- Hover and focus states
- Accessible keyboard navigation

#### SaveFileItem
**File**: `src/components/SaveFileItem.tsx`
- Individual save file display
- Actions: restore, delete, open location
- File size formatting
- Date/time display

### Game-Specific Components

#### BackupSettings
**File**: `src/components/BackupSettings.tsx`
- Auto-backup interval configuration
- Enable/disable toggle
- Interval dropdown (hours/days/weeks)

#### CloudStorage
**File**: `src/components/CloudStorage.tsx`
- Cloud provider connection status
- Connect/disconnect actions
- Sync status indicators

#### StorageInfo
**File**: `src/components/StorageInfo.tsx`
- Storage usage visualization
- Used/total space display
- Progress bar representation

## State Management

### Game Store (`useGameStore`)
**File**: `src/store/gameStore.ts`

Global state management:
```typescript
interface GameStore {
  games: Game[]
  foundGames: FoundGame[]
  isLoading: boolean
  error: string | null
  // Actions
  loadGames: () => Promise<void>
  addGame: (game: Game) => Promise<void>
  deleteGame: (id: number) => Promise<void>
  toggleFavorite: (id: number) => Promise<void>
  scanForGames: () => Promise<void>
  // ... more actions
}
```

## UI Patterns

### Loading States
- Spinner animation with "Loading..." text
- Disabled UI during operations
- Progress bars for long operations

### Error Handling
- Red text for error messages
- Modal notifications for critical errors
- Inline validation messages

### Responsive Design
- Mobile: Single column layout
- Tablet: 2-3 column grid
- Desktop: 4-6 column grid
- Breakpoints: sm (640px), md (768px), lg (1024px)

### Interactions
- Hover effects on cards and buttons
- Active states for navigation
- Smooth transitions (200ms default)
- Focus indicators for accessibility

## Internationalization

### Configuration
**File**: `src/i18n/config.ts`

Supports English and Vietnamese with:
- Lazy loading of translations
- Browser language detection
- Local storage persistence

### Usage
```typescript
const { t } = useTranslation()
<h1>{t('gameLibrary.title')}</h1>
```

### Translation Files
- `src/i18n/en.json` - English translations
- `src/i18n/vi.json` - Vietnamese translations

## Best Practices

### Component Guidelines
1. Use functional components with hooks
2. Implement proper loading and error states
3. Memoize expensive computations
4. Handle edge cases (empty states, errors)

### Styling Guidelines
1. Use Tailwind utilities over custom CSS
2. Maintain consistent spacing (4px grid)
3. Follow color palette strictly
4. Ensure sufficient contrast ratios

### Accessibility
1. Proper ARIA labels on interactive elements
2. Keyboard navigation support
3. Focus management in modals
4. Screen reader friendly text

### Performance
1. Lazy load heavy components
2. Virtualize long lists (100+ items)
3. Optimize images with proper formats
4. Minimize re-renders with React.memo

## Common UI Tasks

### Adding a New Page
1. Create component in `src/pages/`
2. Add route in main app router
3. Add navigation item to Layout
4. Include translations in i18n files

### Creating a Modal
1. Use overlay with `fixed inset-0`
2. Center content with flexbox
3. Add backdrop click to close
4. Trap focus within modal
5. Animate entry/exit with transitions

### Implementing a Form
1. Use controlled components
2. Add validation on blur/submit
3. Show inline error messages
4. Disable submit during processing
5. Show success/error feedback

## Known UI Issues

### Performance
- Game grid can lag with 100+ games
- No virtualization in backup history
- Large images not optimized

### Accessibility
- Some modals missing focus trap
- Keyboard navigation incomplete
- Screen reader announcements needed

### Responsive
- Settings page needs mobile optimization
- Game detail layout breaks on small screens
- Sidebar should collapse on mobile