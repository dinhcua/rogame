# Tailwind CSS v4 Theme Implementation

## Overview
This project uses Tailwind CSS v4 with the new `@theme` and `@custom-variant` directives for theme management.

## Key Features

### 1. Custom Dark Variant
```css
@custom-variant dark (&:where(.dark, .dark *));
```
This creates a custom variant that applies styles when the `.dark` class is present on the root element or any parent.

### 2. Theme Variables in @theme
All color variables are defined in the `@theme` block:
- Light theme colors (--color-light-*)
- Dark theme colors (--color-dark-*)
- Base colors for reference

### 3. Custom Utility Classes
Instead of using Tailwind's built-in colors, we define custom classes:

#### Background Colors
- `.bg-game-dark` - Main background
- `.bg-game-card` - Card/panel background
- `.bg-sidebar` - Sidebar background
- `.bg-rog-blue` - Accent color

#### Text Colors
- `.text-primary` - Primary text
- `.text-secondary` - Secondary text
- `.text-rog-blue` - Accent text

#### Border Colors
- `.border-theme` - Theme-aware borders

### 4. Usage Example
```tsx
<div className="bg-game-dark text-primary">
  <div className="bg-game-card border border-theme">
    <h1 className="text-primary">Title</h1>
    <p className="text-secondary">Description</p>
    <button className="bg-rog-blue text-white">Action</button>
  </div>
</div>
```

## Theme Switching
The theme is controlled by the `ThemeContext` which:
1. Adds/removes the `dark` class on the document root
2. Persists preference to localStorage
3. Provides `theme` and `toggleTheme` via the `useTheme` hook

## Benefits
1. **Type Safety**: Custom classes prevent typos
2. **Consistency**: All colors defined in one place
3. **Performance**: CSS-only theme switching
4. **Tailwind v4**: Leverages new features for cleaner code

## Testing
1. Go to Settings page
2. Toggle "Dark Mode" switch
3. Colors should smoothly transition
4. Refresh page - theme persists