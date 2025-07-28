# Deep Linking Documentation for Rogame

## Overview

Deep linking allows external applications or websites to launch Rogame and navigate to specific content or trigger actions using custom URL schemes.

## Tauri Deep Linking Plugin Documentation

### Supported Platforms

Requires Rust 1.77.2+. Supports:
- Windows
- Linux
- macOS
- Android
- iOS

### Setup

#### Installation

```bash
# Using npm
npm run tauri add deep-link

# Using Cargo
cargo add tauri-plugin-deep-link@2.0.0
```

For desktop single-instance support (recommended):
```toml
[target."cfg(any(target_os = \"macos\", windows, target_os = \"linux\"))".dependencies]
tauri-plugin-single-instance = { version = "2.0.0", features = ["deep-link"] }
```

#### Configuration

In `tauri.conf.json`:

```json
{
  "plugins": {
    "deep-link": {
      "mobile": [
        { "host": "your.website.com", "pathPrefix": ["/open"] },
        { "host": "another.site.br" }
      ],
      "desktop": {
        "schemes": ["something", "my-tauri-app"]
      }
    }
  }
}
```

### Frontend Usage

#### JavaScript/TypeScript

```javascript
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';

await onOpenUrl((urls) => {
  console.log('deep link:', urls);
});
```

### Backend Usage

#### Rust

```rust
use tauri_plugin_deep_link::DeepLinkExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            // Listen for deep link events
            app.deep_link().on_open_url(|event| {
                println!("deep link URLs: {:?}", event.urls());
            });
            
            // Register schemes at runtime (for development)
            #[cfg(desktop)]
            app.deep_link().register("my-app")?;
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### With Single Instance Support

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|_app, argv, _cwd| {
            println!("a new app instance was opened with {argv:?} and the deep link event was already triggered");
            // when defining deep link schemes at runtime, you must also check `argv` here
        }));
    }

    builder
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            app.deep_link().on_open_url(|event| {
                println!("deep link URLs: {:?}", event.urls());
            });
            
            // Register all configured schemes
            #[cfg(any(windows, target_os = "linux"))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                app.deep_link().register_all()?;
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Testing Deep Links

#### Desktop Testing

- **Windows**: `start <scheme>://url`
- **Linux**: `xdg-open <scheme>://url`
- **macOS**: URLs are automatically registered

#### Mobile Testing

- **iOS Simulator**: `xcrun simctl openurl booted https://<host>/path`
- **Android Emulator**: `adb shell am start -a android.intent.action.VIEW -d https://<host>/path <bundle-identifier>`

### Mobile Configuration

#### iOS Universal Links

Create `.well-known/apple-app-site-association` file on your server:

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["$DEVELOPMENT_TEAM_ID.$APP_BUNDLE_ID"],
        "components": [
          {
            "/": "/open/*",
            "comment": "Matches any URL whose path starts with /open/"
          }
        ]
      }
    ]
  }
}
```

Verify configuration:
```bash
curl -v https://app-site-association.cdn-apple.com/a/v1/<host>
```

#### Android App Links

Create `.well-known/assetlinks.json` file on your server:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "$APP_BUNDLE_ID",
      "sha256_cert_fingerprints": [
        "$CERT_FINGERPRINT"
      ]
    }
  }
]
```

## Rogame Implementation

### Supported Deep Link Patterns

- `rogame://game/{gameId}` - Navigate to a specific game's detail page
- `rogame://backup/{gameId}` - Trigger a backup for a specific game
- `rogame://restore/{gameId}` - Navigate to restore page for a specific game
- `rogame://scan` - Trigger a game library scan

### Frontend Implementation

```typescript
// hooks/useDeepLink.ts
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { listen } from '@tauri-apps/api/event';

export function useDeepLink() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Listen for deep links via the plugin
    const unlistenDeepLink = onOpenUrl((urls) => {
      urls.forEach(url => handleDeepLink(url));
    });
    
    // Listen for deep links via single instance (desktop)
    const unlistenSingleInstance = listen<string>('deep-link', (event) => {
      handleDeepLink(event.payload);
    });
    
    return () => {
      unlistenDeepLink.then(fn => fn());
      unlistenSingleInstance.then(fn => fn());
    };
  }, []);
}
```

### Backend Implementation

```rust
// src/lib.rs
use tauri_plugin_deep_link::DeepLinkExt;

pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            if let Some(url) = argv.iter().find(|arg| arg.starts_with("rogame://")) {
                app.emit("deep-link", url).unwrap();
            }
        }));
    }

    builder
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            app.deep_link().on_open_url(|event| {
                if let Some(app_handle) = event.app_handle() {
                    for url in event.urls() {
                        app_handle.emit("deep-link", url).unwrap();
                    }
                }
            });

            #[cfg(any(windows, target_os = "linux"))]
            {
                app.deep_link().register_all()?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Configuration

In `tauri.conf.json`:

```json
{
  "plugins": {
    "deep-link": {
      "desktop": {
        "schemes": ["rogame"]
      }
    }
  }
}
```

## Security Considerations

1. **Validate all deep link parameters** before processing
2. **Sanitize input** to prevent injection attacks
3. **Implement rate limiting** for deep link handling
4. **Use HTTPS** for mobile deep links (Universal Links/App Links)
5. **Verify source** when handling sensitive operations

## Troubleshooting

### Common Issues

1. **Deep links not working on Windows/Linux**
   - Ensure `register_all()` is called in development
   - Check if the scheme is properly registered in the OS

2. **Multiple app instances opening**
   - Implement single-instance plugin
   - Handle argv in the single-instance callback

3. **Mobile deep links not working**
   - Verify server configuration files are accessible
   - Check app bundle ID and team ID match
   - Ensure HTTPS is properly configured

### Debug Tips

1. Enable console logging for all deep link events
2. Test with simple URLs first (e.g., `rogame://test`)
3. Check system logs for URL scheme registration
4. Use platform-specific testing tools

## References

- [Tauri Deep Linking Plugin Documentation](https://v2.tauri.app/plugin/deep-linking/)
- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)
- [Custom URL Schemes](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/registerProtocolHandler)