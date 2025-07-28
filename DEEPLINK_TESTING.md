# Deep Link Testing Guide for Rogame

## Overview

Rogame supports deep linking with the `rogame://` URL scheme, allowing external applications and websites to launch the app and navigate to specific content.

## Supported Deep Link Patterns

- `rogame://game/{gameId}` - Navigate to a specific game's detail page
- `rogame://backup/{gameId}` - Trigger a backup for a specific game
- `rogame://restore/{gameId}` - Navigate to restore page for a specific game
- `rogame://scan` - Trigger a game library scan

## Testing on Windows

### Method 1: Using the Test Script

1. Run the provided batch file:
   ```cmd
   test-deeplink.bat
   ```

### Method 2: Manual Testing

1. Open Command Prompt or PowerShell
2. Test individual deep links:
   ```cmd
   start rogame://game/1
   start rogame://backup/2
   start rogame://restore/3
   start rogame://scan
   ```

### Method 3: From Web Browser

1. Create an HTML file with links:
   ```html
   <a href="rogame://game/1">Open Game 1</a>
   <a href="rogame://scan">Scan Games</a>
   ```

## Testing on macOS

### Method 1: Using the Test Script

1. Run the provided shell script:
   ```bash
   ./test-deeplink.sh
   ```

### Method 2: Manual Testing

1. Open Terminal
2. Test individual deep links:
   ```bash
   open "rogame://game/1"
   open "rogame://backup/2"
   open "rogame://restore/3"
   open "rogame://scan"
   ```

### Method 3: From Safari

1. Type the URL directly in Safari's address bar:
   - `rogame://game/1`
   - `rogame://scan`

## Development Notes

### Windows
- The app automatically registers the URL scheme when running in development mode
- In production, the installer will register the scheme in the Windows Registry

### macOS
- URL scheme is registered via Info.plist configuration
- No manual registration needed
- Works immediately after app installation

## Debugging

### Check Console Output

The app logs all deep link events to the console:
```
Deep link URLs received: ["rogame://game/1"]
Processing deep link: rogame://game/1
```

### Frontend Debugging

In the browser DevTools console, you should see:
```javascript
Handling deep link: rogame://game/1
Deep link received via plugin: ["rogame://game/1"]
```

### Common Issues

1. **App doesn't launch**
   - Ensure the app is built and installed
   - On Windows, check if the scheme is registered in Registry
   - On macOS, check if Info.plist contains the URL scheme

2. **Multiple instances open**
   - Single instance plugin should prevent this
   - Check if the plugin is properly initialized

3. **Deep link not handled**
   - Check console for error messages
   - Verify the URL format is correct
   - Ensure the frontend listener is active

## Registry Check (Windows)

To verify the URL scheme is registered on Windows:

1. Open Registry Editor (regedit)
2. Navigate to: `HKEY_CLASSES_ROOT\rogame`
3. Should contain:
   - Default value: "URL:rogame Protocol"
   - URL Protocol: ""
   - shell\open\command: Path to your app executable with "%1"

## Testing from External Apps

### From a web page:
```javascript
window.location.href = 'rogame://game/123';
```

### From another Electron/Tauri app:
```javascript
shell.openExternal('rogame://scan');
```

### From native apps:
- Windows: `ShellExecute(NULL, "open", "rogame://game/1", NULL, NULL, SW_SHOW);`
- macOS: `[[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:@"rogame://game/1"]];`