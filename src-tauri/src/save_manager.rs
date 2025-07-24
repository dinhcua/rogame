use chrono::prelude::*;
use glob::glob;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::{self, create_dir_all};
use std::path::PathBuf;

use crate::db;

// Structs for the new JSON structure
#[derive(Debug, Deserialize)]
struct GameEntry {
    steam_id: String,
    name: String,
    save_locations: SaveLocations,
    save_pattern: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct SaveLocations {
    #[serde(default)]
    macos: String,
    #[serde(default)]
    windows: String,
    #[serde(default)]
    linux: String,
}

// Helper function to get platform-specific save location
fn get_platform_save_location(locations: &SaveLocations) -> &str {
    #[cfg(target_os = "macos")]
    return &locations.macos;

    #[cfg(target_os = "windows")]
    return &locations.windows;

    #[cfg(target_os = "linux")]
    return &locations.linux;

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    return "";
}

// Helper function to get save game config path
fn get_save_config_path() -> PathBuf {
    if cfg!(debug_assertions) {
        // During development, use the source file
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src/save_game_location.json")
    } else {
        // In production, load from resources
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                // Try multiple possible locations
                let resource_paths = vec![
                    exe_dir.join("resources").join("save_game_location.json"),
                    exe_dir.join("save_game_location.json"),
                    exe_dir
                        .join("_up_")
                        .join("resources")
                        .join("save_game_location.json"),
                ];

                for path in resource_paths {
                    if path.exists() {
                        return path;
                    }
                }
            }
        }

        // Fallback
        PathBuf::from("save_game_location.json")
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SaveFile {
    pub id: String,
    pub game_id: String,
    pub file_name: String,
    pub created_at: String,
    pub modified_at: String,
    pub size_bytes: u64,
    pub tags: Vec<String>,
    pub file_path: String,
    pub origin_path: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Game {
    pub id: String,
    pub title: String,
    pub cover_image: String,
    pub platform: String,
    pub last_played: String,
    pub save_count: i32,
    pub size: String,
    pub status: String,
    pub category: String,
    pub is_favorite: bool,
    pub save_location: String,
    pub backup_location: Option<String>,
    pub last_backup_time: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct SaveFileError {
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct BackupResponse {
    pub save_file: SaveFile,
    pub backup_time: i64, // Unix timestamp in milliseconds
    pub save_count: i32,  // Current number of saves
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BackupSettings {
    pub auto_backup: bool,
    pub backup_interval: String,
    pub max_backups: i32,
    pub compression_enabled: bool,
}

impl Default for BackupSettings {
    fn default() -> Self {
        Self {
            auto_backup: true,
            backup_interval: "30min".to_string(),
            max_backups: 5,
            compression_enabled: true,
        }
    }
}

impl SaveFile {
    pub fn new(
        game_id: String,
        file_name: String,
        size_bytes: u64,
        file_path: String,
        origin_path: String,
    ) -> Self {
        let now = Utc::now().to_rfc3339();
        let expanded_path = expand_tilde(&file_path);
        let expanded_origin_path = expand_tilde(&origin_path);

        Self {
            id: file_name.clone(),
            game_id,
            file_name,
            created_at: now.clone(),
            modified_at: now,
            size_bytes,
            tags: Vec::new(),
            file_path: expanded_path.to_string_lossy().into_owned(),
            origin_path: expanded_origin_path.to_string_lossy().into_owned(),
        }
    }
}

fn expand_tilde(path: &str) -> PathBuf {
    if path.starts_with("~/") {
        if let Some(home) = dirs::home_dir() {
            return home.join(&path[2..]);
        }
    }
    PathBuf::from(path)
}

#[tauri::command]
pub async fn get_all_games() -> Result<Vec<Game>, SaveFileError> {
    db::execute_blocking(|conn| {
        let mut stmt = conn
            .prepare("SELECT * FROM games")
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let games = stmt
            .query_map([], |row| {
                Ok(Game {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    cover_image: row.get(2)?,
                    platform: row.get(3)?,
                    last_played: row.get(4)?,
                    save_count: row.get(5)?,
                    size: row.get(6)?,
                    status: row.get(7)?,
                    category: row.get(8)?,
                    is_favorite: row.get(9)?,
                    save_location: row.get(10)?,
                    backup_location: row.get(11)?,
                    last_backup_time: row.get(12)?,
                })
            })
            .map_err(|e| format!("Failed to query games: {}", e))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("Failed to collect games: {}", e))?;

        Ok(games)
    })
    .await
    .map_err(|e| SaveFileError { message: e })
}

#[tauri::command]
pub async fn get_game_by_id(id: String) -> Result<Game, SaveFileError> {
    let id_clone = id.clone();

    db::execute_blocking(move |conn| {
        let mut stmt = conn
            .prepare("SELECT * FROM games WHERE id = ?1")
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let game = stmt
            .query_row(params![id_clone], |row| {
                Ok(Game {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    cover_image: row.get(2)?,
                    platform: row.get(3)?,
                    last_played: row.get(4)?,
                    save_count: row.get(5)?,
                    size: row.get(6)?,
                    status: row.get(7)?,
                    category: row.get(8)?,
                    is_favorite: row.get(9)?,
                    save_location: row.get(10)?,
                    backup_location: row.get(11)?,
                    last_backup_time: row.get(12)?,
                })
            })
            .map_err(|e| format!("Failed to get game: {}", e))?;

        Ok(game)
    })
    .await
    .map_err(|e| SaveFileError { message: e })
}

#[tauri::command]
pub async fn add_game(game: Game) -> Result<(), SaveFileError> {
    db::execute_blocking(move |conn| {
        conn.execute(
            "INSERT INTO games (
                id, title, cover_image, platform, last_played, save_count, 
                size, status, category, is_favorite, save_location, 
                backup_location, last_backup_time
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                game.id,
                game.title,
                game.cover_image,
                game.platform,
                game.last_played,
                game.save_count,
                game.size,
                game.status,
                game.category,
                game.is_favorite,
                game.save_location,
                game.backup_location,
                game.last_backup_time,
            ],
        )
        .map_err(|e| format!("Failed to add game: {}", e))?;

        Ok(())
    })
    .await
    .map_err(|e| SaveFileError { message: e })
}

#[tauri::command]
pub async fn update_game(game: Game) -> Result<(), SaveFileError> {
    db::execute_blocking(move |conn| {
        conn.execute(
            "UPDATE games SET 
                title = ?2, 
                cover_image = ?3, 
                platform = ?4, 
                last_played = ?5, 
                save_count = ?6, 
                size = ?7, 
                status = ?8, 
                category = ?9, 
                is_favorite = ?10, 
                save_location = ?11, 
                backup_location = ?12, 
                last_backup_time = ?13 
            WHERE id = ?1",
            params![
                game.id,
                game.title,
                game.cover_image,
                game.platform,
                game.last_played,
                game.save_count,
                game.size,
                game.status,
                game.category,
                game.is_favorite,
                game.save_location,
                game.backup_location,
                game.last_backup_time,
            ],
        )
        .map_err(|e| format!("Failed to update game: {}", e))?;

        Ok(())
    })
    .await
    .map_err(|e| SaveFileError { message: e })
}

#[tauri::command]
pub async fn delete_game(id: String) -> Result<(), SaveFileError> {
    db::execute_blocking(move |conn| {
        conn.execute("DELETE FROM games WHERE id = ?1", params![id])
            .map_err(|e| format!("Failed to delete game: {}", e))?;

        Ok(())
    })
    .await
    .map_err(|e| SaveFileError { message: e })
}

#[tauri::command]
pub async fn toggle_favorite(id: String) -> Result<Game, SaveFileError> {
    let id_clone = id.clone();

    // First, toggle the favorite status
    db::execute_blocking(move |conn| {
        // Get current favorite status
        let mut stmt = conn
            .prepare("SELECT is_favorite FROM games WHERE id = ?1")
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let current_favorite: bool = stmt
            .query_row(params![id_clone], |row| row.get(0))
            .map_err(|e| format!("Failed to get favorite status: {}", e))?;

        // Toggle favorite status
        conn.execute(
            "UPDATE games SET is_favorite = ?1 WHERE id = ?2",
            params![!current_favorite, id_clone],
        )
        .map_err(|e| format!("Failed to update favorite status: {}", e))?;

        Ok(())
    })
    .await
    .map_err(|e| SaveFileError { message: e })?;

    // Then get the updated game
    get_game_by_id(id).await
}

#[tauri::command]
pub async fn restore_save(game_id: String, save_id: String) -> Result<SaveFile, SaveFileError> {
    println!(
        "Attempting to restore save. Game ID: {}, Save ID: {}",
        game_id, save_id
    );

    let saves_dir = get_saves_directory()?;
    let game_saves_dir = saves_dir.join(&game_id);
    let save_path = game_saves_dir.join(&save_id);

    println!("Backup file path: {:?}", save_path);

    if !save_path.exists() {
        return Err(SaveFileError {
            message: format!("Save file not found at path: {:?}", save_path),
        });
    }

    // Get the game from database to get the actual save location
    let game = get_game_by_id(game_id.clone()).await?;

    // Get the origin path (where to restore the save)
    let save_location = if !game.save_location.is_empty() {
        game.save_location.clone()
    } else {
        // Try to get from JSON config if not in database
        println!("No save location in database, checking JSON config...");
        match get_save_location_from_config(&game_id) {
            Ok(location) => {
                println!("Found save location in config: {}", location);
                location
            }
            Err(e) => {
                return Err(SaveFileError {
                    message: format!("Game has no save location configured: {}", e.message),
                });
            }
        }
    };

    let origin_path = expand_tilde(&save_location);

    // Check if the backup is a directory (for pattern "*" backups)
    if save_path.is_dir() {
        println!(
            "Restoring directory backup from {:?} to {:?}",
            save_path, origin_path
        );

        // Create the origin directory if it doesn't exist
        if !origin_path.exists() {
            fs::create_dir_all(&origin_path).map_err(|e| SaveFileError {
                message: format!("Failed to create origin directory: {}", e),
            })?;
        }

        // Clear existing files in the origin directory (optional, be careful)
        // This is commented out for safety - uncomment if you want to clear before restore
        // if origin_path.exists() {
        //     fs::remove_dir_all(&origin_path).map_err(|e| SaveFileError {
        //         message: format!("Failed to clear origin directory: {}", e),
        //     })?;
        //     fs::create_dir_all(&origin_path).map_err(|e| SaveFileError {
        //         message: format!("Failed to recreate origin directory: {}", e),
        //     })?;
        // }

        // Copy all files from backup to origin
        copy_dir_recursive(&save_path, &origin_path).map_err(|e| SaveFileError {
            message: format!("Failed to restore directory: {}", e),
        })?;
    } else {
        // Single file restore (legacy behavior)
        let file_name = save_path.file_name().ok_or_else(|| SaveFileError {
            message: "Invalid save file name".to_string(),
        })?;

        let target_path = origin_path.join(file_name);

        // Create parent directory if needed
        if let Some(parent) = target_path.parent() {
            fs::create_dir_all(parent).map_err(|e| SaveFileError {
                message: format!("Failed to create parent directory: {}", e),
            })?;
        }

        // Copy the file
        fs::copy(&save_path, &target_path).map_err(|e| SaveFileError {
            message: format!("Failed to restore save file: {}", e),
        })?;
    }

    let metadata = fs::metadata(&save_path).map_err(|e| SaveFileError {
        message: format!("Failed to read save file metadata: {}", e),
    })?;

    println!(
        "Successfully restored save file from {:?} to {:?}",
        save_path, origin_path
    );

    // Update the game's last_played field in the database
    let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let game_id_for_db = game_id.clone();

    db::execute_blocking(move |conn| {
        conn.execute(
            "UPDATE games SET last_played = ?1 WHERE id = ?2",
            params![now, game_id_for_db],
        )
        .map_err(|e| format!("Failed to update last played time: {}", e))?;

        Ok(())
    })
    .await
    .map_err(|e| SaveFileError { message: e })?;

    Ok(SaveFile::new(
        game_id,
        save_id,
        metadata.len(),
        save_path.to_string_lossy().into_owned(),
        origin_path.to_string_lossy().into_owned(),
    ))
}

// Helper function to get save location from JSON if not in database
fn get_save_location_from_config(game_id: &str) -> Result<String, SaveFileError> {
    println!("Looking up save location for game_id: {}", game_id);

    let config_path = get_save_config_path();
    println!("Reading config from: {:?}", config_path);

    let config_content = fs::read_to_string(&config_path).map_err(|e| SaveFileError {
        message: format!(
            "Failed to read save game configuration at {:?}: {}",
            config_path, e
        ),
    })?;

    let game_config: HashMap<String, GameEntry> =
        serde_json::from_str(&config_content).map_err(|e| SaveFileError {
            message: format!("Failed to parse save game configuration: {}", e),
        })?;

    // Extract steam_id from game_id (remove epic_ prefix if present)
    let steam_id = if game_id.starts_with("epic_") {
        game_id.strip_prefix("epic_").unwrap_or(game_id)
    } else {
        game_id
    };

    println!("Looking for steam_id: {} in config", steam_id);

    if let Some(game_entry) = game_config.get(steam_id) {
        println!("Found game entry: {}", game_entry.name);
        let save_location = get_platform_save_location(&game_entry.save_locations);
        if !save_location.is_empty() {
            println!("Save location found: {}", save_location);
            Ok(save_location.to_string())
        } else {
            Err(SaveFileError {
                message: format!(
                    "No save location configured for current platform for game: {}",
                    game_id
                ),
            })
        }
    } else {
        // Try to find by name if steam_id lookup fails
        println!(
            "Game not found by steam_id {}, available keys: {:?}",
            steam_id,
            game_config.keys().collect::<Vec<_>>()
        );
        Err(SaveFileError {
            message: format!(
                "Game '{}' not found in configuration (tried steam_id: {})",
                game_id, steam_id
            ),
        })
    }
}

#[tauri::command]
pub async fn backup_save(game_id: String) -> Result<BackupResponse, SaveFileError> {
    println!("=== Starting backup for game: {} ===", game_id);

    // Load backup settings
    let settings = load_backup_settings().await?;

    let saves_dir = get_saves_directory()?;
    let game_saves_dir = saves_dir.join(&game_id);

    // Create game saves directory if it doesn't exist
    create_dir_all(&game_saves_dir).map_err(|e| SaveFileError {
        message: format!("Failed to create saves directory: {}", e),
    })?;

    // Get the game from database to get the actual save location
    let game = get_game_by_id(game_id.clone()).await?;
    println!("Game info: {:?}", game);

    // Get the origin path from the game's save_location
    let save_location = if !game.save_location.is_empty() {
        println!("Using save location from database: {}", game.save_location);
        game.save_location.clone()
    } else {
        // Try to get from JSON config if not in database
        println!(
            "No save location in database for game {}, checking JSON config...",
            game_id
        );
        match get_save_location_from_config(&game_id) {
            Ok(location) => {
                println!("Found save location in config: {}", location);
                // Update the database with this location for future use
                let game_id_for_update = game_id.clone();
                let location_for_update = location.clone();
                if let Err(e) = db::execute_blocking(move |conn| {
                    conn.execute(
                        "UPDATE games SET save_location = ?1 WHERE id = ?2",
                        params![location_for_update, game_id_for_update],
                    )
                    .map_err(|e| format!("Failed to update save location: {}", e))?;
                    Ok(())
                })
                .await
                {
                    println!("Warning: Failed to update save location in database: {}", e);
                }
                location
            }
            Err(e) => {
                println!("Failed to get save location from config: {}", e.message);
                return Err(SaveFileError {
                    message: format!("Game '{}' has no save location configured. The game may need to be re-scanned or the save location is not defined in the configuration.", game.title),
                });
            }
        }
    };

    // Check if save_location contains wildcard
    let (has_wildcard, pattern_info) = if save_location.contains("*") {
        // For wildcard patterns, we need special handling
        println!("Save location contains wildcard pattern: {}", save_location);
        (true, Some(save_location.clone()))
    } else {
        (false, None)
    };

    let origin_path = expand_tilde(&save_location);
    println!("Save location: {}", save_location);
    println!("Expanded save location: {:?}", origin_path);

    // Create a new backup with timestamp
    let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();
    let backup_name = format!("backup_{}", timestamp);
    let backup_path = game_saves_dir.join(&backup_name);

    let mut total_size = 0u64;
    let mut found_save = false;

    println!("Checking for save files in: {:?}", origin_path);

    if has_wildcard && pattern_info.is_some() {
        // Handle wildcard patterns by using glob
        let pattern = pattern_info.unwrap();
        let expanded_pattern = expand_tilde(&pattern);
        let glob_pattern = expanded_pattern.to_string_lossy();

        println!("Using glob pattern: {}", glob_pattern);

        if let Ok(paths) = glob::glob(&glob_pattern) {
            let mut files_to_backup = Vec::new();

            for path_result in paths {
                if let Ok(path) = path_result {
                    println!("Found matching path: {:?}", path);
                    files_to_backup.push(path);
                }
            }

            if !files_to_backup.is_empty() {
                // Create backup directory
                create_dir_all(&backup_path).map_err(|e| SaveFileError {
                    message: format!("Failed to create backup directory: {}", e),
                })?;

                // Copy all matching files/directories
                for path in files_to_backup {
                    if path.is_dir() {
                        let dir_name = path.file_name().unwrap_or_default();
                        let target_dir = backup_path.join(dir_name);
                        match copy_dir_recursive(&path, &target_dir) {
                            Ok(size) => {
                                total_size += size;
                                found_save = true;
                            }
                            Err(e) => {
                                println!("Failed to backup directory {:?}: {}", path, e);
                            }
                        }
                    } else if path.is_file() {
                        let file_name = path.file_name().unwrap_or_default();
                        let target_file = backup_path.join(file_name);

                        if let Ok(metadata) = fs::metadata(&path) {
                            total_size += metadata.len();
                        }

                        if let Err(e) = fs::copy(&path, &target_file) {
                            println!("Failed to copy file {:?}: {}", path, e);
                        } else {
                            found_save = true;
                        }
                    }
                }

                println!("Backed up {} bytes from wildcard pattern", total_size);
            }
        }
    } else if origin_path.exists() {
        println!("Directory exists, creating backup...");

        // For pattern "*", backup the entire directory
        if origin_path.is_dir() {
            println!(
                "Backing up entire directory: {:?} to {:?}",
                origin_path, backup_path
            );

            match copy_dir_recursive(&origin_path, &backup_path) {
                Ok(size) => {
                    total_size = size;
                    found_save = true;
                    println!(
                        "Successfully backed up directory, total size: {} bytes",
                        total_size
                    );
                }
                Err(e) => {
                    return Err(SaveFileError {
                        message: format!("Failed to backup directory: {}", e),
                    });
                }
            }
        } else if origin_path.is_file() {
            // If it's a single file, just copy it
            println!("Backing up single file: {:?}", origin_path);
            let file_name = origin_path.file_name().unwrap_or_default();
            let save_path = backup_path.join(file_name);

            create_dir_all(&backup_path).map_err(|e| SaveFileError {
                message: format!("Failed to create backup directory: {}", e),
            })?;

            if let Ok(metadata) = fs::metadata(&origin_path) {
                total_size = metadata.len();
            }

            if let Err(e) = fs::copy(&origin_path, &save_path) {
                return Err(SaveFileError {
                    message: format!("Failed to copy save file: {}", e),
                });
            }
            found_save = true;
        }
    } else {
        println!("Save location does not exist: {:?}", origin_path);
    }

    if !found_save {
        let error_msg = format!("No save data found at: {:?}", origin_path);
        println!("{}", error_msg);
        return Err(SaveFileError { message: error_msg });
    }

    let backup_time = Utc::now().timestamp_millis();

    // Count total number of backups (directories starting with "backup_")
    let mut backup_entries: Vec<_> = fs::read_dir(&game_saves_dir)
        .map_err(|e| SaveFileError {
            message: format!("Failed to read saves directory: {}", e),
        })?
        .filter_map(Result::ok)
        .filter(|entry| {
            let name = entry.file_name().to_string_lossy().to_string();
            name.starts_with("backup_") && entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false)
        })
        .collect();

    // Sort backups by creation time (newest first)
    backup_entries.sort_by(|a, b| {
        b.metadata()
            .and_then(|m| m.created())
            .unwrap_or_else(|_| std::time::SystemTime::UNIX_EPOCH)
            .cmp(
                &a.metadata()
                    .and_then(|m| m.created())
                    .unwrap_or_else(|_| std::time::SystemTime::UNIX_EPOCH),
            )
    });

    // Remove old backups if we exceed max_backups
    if backup_entries.len() > settings.max_backups as usize {
        for old_backup in backup_entries.iter().skip(settings.max_backups as usize) {
            let backup_path = old_backup.path();
            if backup_path.is_dir() {
                if let Err(e) = fs::remove_dir_all(&backup_path) {
                    println!("Failed to remove old backup directory: {}", e);
                }
            }
        }
    }

    // Update the game's save_count and last_backup_time in the database
    let game_id_clone = game_id.clone();
    let save_count = backup_entries.len() as i32;

    db::execute_blocking(move |conn| {
        conn.execute(
            "UPDATE games SET save_count = ?1, last_backup_time = ?2 WHERE id = ?3",
            params![save_count, backup_time, game_id_clone],
        )
        .map_err(|e| format!("Failed to update game info: {}", e))?;

        Ok(())
    })
    .await
    .map_err(|e| SaveFileError { message: e })?;

    Ok(BackupResponse {
        save_file: SaveFile::new(
            game_id,
            backup_name.clone(),
            total_size,
            backup_path.to_string_lossy().into_owned(),
            origin_path.to_string_lossy().into_owned(),
        ),
        backup_time,
        save_count: backup_entries.len() as i32,
    })
}

#[tauri::command]
pub async fn list_saves(game_id: String) -> Result<Vec<SaveFile>, SaveFileError> {
    let saves_dir = get_saves_directory()?;
    let game_saves_dir = saves_dir.join(&game_id);

    if !game_saves_dir.exists() {
        return Ok(Vec::new());
    }

    // Get the game from database to get the actual save location
    let game = get_game_by_id(game_id.clone()).await?;
    let origin_path = if !game.save_location.is_empty() {
        game.save_location
    } else {
        // Fallback to empty string if no save location configured
        String::new()
    };

    let mut saves = Vec::new();
    for entry in fs::read_dir(&game_saves_dir).map_err(|e| SaveFileError {
        message: format!("Failed to read saves directory: {}", e),
    })? {
        let entry = entry.map_err(|e| SaveFileError {
            message: format!("Failed to read directory entry: {}", e),
        })?;

        let metadata = entry.metadata().map_err(|e| SaveFileError {
            message: format!("Failed to get file metadata: {}", e),
        })?;

        let file_name = entry.file_name().to_string_lossy().to_string();
        let file_path = entry.path().to_string_lossy().into_owned();

        // Check if it's a backup directory (starts with "backup_")
        if metadata.is_dir() && file_name.starts_with("backup_") {
            // For directory backups, calculate total size
            let dir_size = get_directory_size(&entry.path());
            saves.push(SaveFile::new(
                game_id.clone(),
                file_name,
                dir_size,
                file_path,
                origin_path.clone(),
            ));
        } else if metadata.is_file() {
            // Legacy single file backups
            saves.push(SaveFile::new(
                game_id.clone(),
                file_name,
                metadata.len(),
                file_path,
                origin_path.clone(),
            ));
        }
    }

    Ok(saves)
}

#[tauri::command]
pub async fn save_backup_settings(settings: BackupSettings) -> Result<(), SaveFileError> {
    let config_dir = dirs::config_local_dir()
        .ok_or_else(|| SaveFileError {
            message: "Failed to get config directory".to_string(),
        })?
        .join("rogame");

    fs::create_dir_all(&config_dir).map_err(|e| SaveFileError {
        message: format!("Failed to create config directory: {}", e),
    })?;

    let settings_path = config_dir.join("backup_settings.json");
    let settings_json = serde_json::to_string_pretty(&settings).map_err(|e| SaveFileError {
        message: format!("Failed to serialize settings: {}", e),
    })?;

    fs::write(&settings_path, settings_json).map_err(|e| SaveFileError {
        message: format!("Failed to write settings file: {}", e),
    })?;

    Ok(())
}

#[tauri::command]
pub async fn load_backup_settings() -> Result<BackupSettings, SaveFileError> {
    let config_dir = dirs::config_local_dir()
        .ok_or_else(|| SaveFileError {
            message: "Failed to get config directory".to_string(),
        })?
        .join("rogame");

    let settings_path = config_dir.join("backup_settings.json");

    if !settings_path.exists() {
        return Ok(BackupSettings::default());
    }

    let settings_json = fs::read_to_string(&settings_path).map_err(|e| SaveFileError {
        message: format!("Failed to read settings file: {}", e),
    })?;

    serde_json::from_str(&settings_json).map_err(|e| SaveFileError {
        message: format!("Failed to deserialize settings: {}", e),
    })
}

fn get_saves_directory() -> Result<PathBuf, SaveFileError> {
    let app_data_dir = dirs::data_local_dir().ok_or_else(|| SaveFileError {
        message: "Failed to get app data directory".to_string(),
    })?;

    Ok(app_data_dir.join("rogame").join("saves"))
}

// Sync scanned game to database
#[tauri::command]
pub async fn add_game_to_library(game_info: serde_json::Value) -> Result<(), SaveFileError> {
    let game_id = game_info["id"].as_str().unwrap_or("").to_string();
    let title = game_info["title"].as_str().unwrap_or("").to_string();
    let cover_image = game_info["cover_image"].as_str().unwrap_or("").to_string();
    let platform = game_info["platform"].as_str().unwrap_or("").to_string();
    let last_played = game_info["last_played"]
        .as_str()
        .unwrap_or("Never")
        .to_string();
    let save_count = game_info["save_count"].as_i64().unwrap_or(0) as i32;
    let size = game_info["size"].as_str().unwrap_or("0B").to_string();
    let status = game_info["status"]
        .as_str()
        .unwrap_or("no_saves")
        .to_string();
    let category = game_info["category"]
        .as_str()
        .unwrap_or("Unknown")
        .to_string();
    let is_favorite = game_info["is_favorite"].as_bool().unwrap_or(false);

    // Get first save location if available (from SaveLocation array)
    let save_location = if let Some(locations) = game_info["save_locations"].as_array() {
        if let Some(first_location) = locations.first() {
            // SaveLocation object has "path" field
            let path = first_location["path"].as_str().unwrap_or("");
            println!("Found save location path from scanner: {}", path);
            path.to_string()
        } else {
            println!("No save locations found in array");
            String::new()
        }
    } else {
        println!("save_locations is not an array");
        String::new()
    };

    db::execute_blocking(move |conn| {
        // Check if game exists
        let exists: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM games WHERE id = ?1)",
                params![&game_id],
                |row| row.get(0),
            )
            .unwrap_or(false);

        if exists {
            // Update existing game
            conn.execute(
                "UPDATE games SET 
                    title = ?2, cover_image = ?3, platform = ?4, last_played = ?5,
                    save_count = ?6, size = ?7, status = ?8, category = ?9,
                    is_favorite = ?10, save_location = ?11
                WHERE id = ?1",
                params![
                    game_id,
                    title,
                    cover_image,
                    platform,
                    last_played,
                    save_count,
                    size,
                    status,
                    category,
                    is_favorite,
                    save_location
                ],
            )
            .map_err(|e| format!("Failed to update game: {}", e))?;
        } else {
            // Insert new game
            conn.execute(
                "INSERT INTO games (
                    id, title, cover_image, platform, last_played, save_count,
                    size, status, category, is_favorite, save_location,
                    backup_location, last_backup_time
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, NULL, NULL)",
                params![
                    game_id,
                    title,
                    cover_image,
                    platform,
                    last_played,
                    save_count,
                    size,
                    status,
                    category,
                    is_favorite,
                    save_location
                ],
            )
            .map_err(|e| format!("Failed to insert game: {}", e))?;
        }

        Ok(())
    })
    .await
    .map_err(|e| SaveFileError { message: e })
}

// Deprecated - use add_game_to_library instead
#[tauri::command]
pub async fn sync_game_to_db(game_info: serde_json::Value) -> Result<(), SaveFileError> {
    // Just forward to the new function
    add_game_to_library(game_info).await
}

// Helper function to get directory size
fn get_directory_size(path: &PathBuf) -> u64 {
    let mut total_size = 0u64;

    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.filter_map(Result::ok) {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_file() {
                    total_size += metadata.len();
                } else if metadata.is_dir() {
                    total_size += get_directory_size(&entry.path());
                }
            }
        }
    }

    total_size
}

// Helper function to copy directory recursively
fn copy_dir_recursive(src: &PathBuf, dst: &PathBuf) -> Result<u64, std::io::Error> {
    let mut total_size = 0u64;

    if !dst.exists() {
        fs::create_dir_all(dst)?;
    }

    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let path = entry.path();
        let file_name = entry.file_name();
        let dst_path = dst.join(&file_name);

        if path.is_dir() {
            total_size += copy_dir_recursive(&path, &dst_path)?;
        } else {
            let metadata = entry.metadata()?;
            total_size += metadata.len();
            fs::copy(&path, &dst_path)?;
        }
    }

    Ok(total_size)
}
