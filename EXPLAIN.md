# Explanation: Why save_location and backup_location are None for Stellar Blade

## Root Cause

The issue occurs because **Stellar Blade is not configured in the save_game_location.json file**. This is the primary configuration file that defines save locations for all supported games.

## Data Flow Analysis

### 1. Game Scanner Process (`game_scanner.rs`)

When scanning for games:
- The scanner finds Stellar Blade installed on the system
- It creates a `GameInfo` struct with basic information
- For the `save_locations` field, it looks up the game in `save_game_location.json`
- Since Stellar Blade is not in the config file, `save_locations` is set to an empty vector

### 2. Database Sync Process (`sync_game_to_db` in `save_manager.rs`)

When syncing to the database:
```rust
// Lines 642-651 in save_manager.rs
let save_location = if let Some(locations) = game_info["save_locations"].as_array() {
    if let Some(first_location) = locations.first() {
        first_location["path"].as_str().unwrap_or("").to_string()
    } else {
        String::new()  // Empty string when no locations found
    }
} else {
    String::new()  // Empty string when save_locations is not an array
};
```

- The function receives the game info from the scanner
- It tries to extract the first save location from the `save_locations` array
- Since the array is empty for Stellar Blade, it sets `save_location` to an empty string
- `backup_location` is always set to NULL for new games (line 684)

### 3. Database Storage (`db.rs`)

The database schema defines:
- `save_location TEXT NOT NULL` - stores the primary save location path
- `backup_location TEXT` - nullable, stores custom backup location (if set by user)
- `last_backup_time INTEGER` - nullable, timestamp of last backup

### 4. Game Retrieval (`get_game_by_id` in `save_manager.rs`)

When fetching from database:
```rust
// Lines 156-157 in save_manager.rs
save_location: row.get(10)?,      // Gets empty string
backup_location: row.get(11)?,     // Gets NULL, converted to None
```

### 5. Frontend Display (`GameDetail.tsx`)

The frontend receives the Game object with:
- `save_location: ""` (empty string)
- `backup_location: None` (null in JSON)

## Why This Causes Backup Failure

In the `backup_save` function (lines 386-396 in `save_manager.rs`):
```rust
let origin_path = if !game.save_location.is_empty() {
    let path = expand_tilde(&game.save_location);
    println!("Save location from database: {}", game.save_location);
    println!("Expanded save location: {:?}", path);
    path
} else {
    return Err(SaveFileError {
        message: "Game has no save location configured".to_string(),
    });
};
```

Since `save_location` is an empty string, the function immediately returns an error.

## Solution

To fix this issue, Stellar Blade needs to be added to `save_game_location.json` with its proper save locations. For example:

```json
"Stellar Blade": {
  "locations": [
    "~/AppData/Roaming/StellarBlade",
    "~/Library/Application Support/StellarBlade",
    "~/.local/share/StellarBlade"
  ],
  "patterns": ["*"],
  "cover_image": "https://cdn.cloudflare.steamstatic.com/steam/apps/3489700/header.jpg",
  "category": "Action",
  "steam_id": "3489700"
}
```

Once added, the game scanner will properly detect save locations, sync them to the database, and enable backup functionality.