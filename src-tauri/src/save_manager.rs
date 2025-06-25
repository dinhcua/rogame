use chrono::prelude::*;
use serde::{Deserialize, Serialize};
use std::fs::{self, create_dir_all};
use std::path::PathBuf;
use crate::db::{self, Game as DbGame};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SaveFile {
    pub id: String,
    pub game_id: String,
    pub file_name: String,
    pub created_at: String,
    pub modified_at: String,
    pub size_bytes: u64,
    pub tags: Vec<String>,
    pub save_location: String,
    pub backup_location: String,
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
    pub fn new(game_id: String, file_name: String, size_bytes: u64, backup_location: String) -> Self {
        let now = Utc::now().to_rfc3339();
        let expanded_path = expand_tilde(&backup_location);

        // For mock saves, set save_location to the Steam saves directory
        let save_location = if let Some(home) = dirs::home_dir() {
            let mock_saves_path = home
                .join("Library/Application Support/Steam/steamapps/common")
                .join(&game_id)
                .join("saves");
            if mock_saves_path.exists() {
                mock_saves_path
            } else {
                expanded_path.clone()
            }
        } else {
            expanded_path.clone()
        };

        Self {
            id: file_name.clone(),
            game_id,
            file_name,
            created_at: now.clone(),
            modified_at: now,
            size_bytes,
            tags: Vec::new(),
            save_location: save_location.to_string_lossy().into_owned(),
            backup_location: expanded_path.to_string_lossy().into_owned(),
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
pub async fn restore_save(game_id: String, save_id: String) -> Result<SaveFile, SaveFileError> {
    println!(
        "Starting restore process. Game ID: {}, Save ID: {}",
        game_id, save_id
    );

    // Step 1: Get game detail from database
    let (game, _) = db::get_game(&game_id).map_err(|e| SaveFileError {
        message: format!("Failed to get game info from database: {}", e),
    })?;

    println!("Game info: {:?}", game);

    // Step 2: Get save_location and backup_location from game detail
    let save_location = expand_tilde(&game.save_location);
    let backup_location = match game.backup_location {
        Some(loc) => expand_tilde(&loc),
        None => return Err(SaveFileError {
            message: "Backup location not set for this game".to_string(),
        }),
    };

    println!("Save location: {:?}", save_location);
    println!("Backup location: {:?}", backup_location);

    // Verify backup file exists
    let backup_file = backup_location.join(&save_id);
    if !backup_file.exists() {
        return Err(SaveFileError {
            message: format!("Backup file not found: {:?}", backup_file),
        });
    }

    // Create save directory if it doesn't exist
    if let Some(parent) = save_location.parent() {
        create_dir_all(parent).map_err(|e| SaveFileError {
            message: format!("Failed to create save directory: {}", e),
        })?;
    }

    // Step 3: Restore file from backup_location to save_location
    let save_file_path = save_location.join(&save_id);
    println!("Restoring from {:?} to {:?}", backup_file, save_file_path);

    // Copy the backup file to the save location
    fs::copy(&backup_file, &save_file_path).map_err(|e| SaveFileError {
        message: format!("Failed to restore save file: {}", e),
    })?;

    let metadata = fs::metadata(&backup_file).map_err(|e| SaveFileError {
        message: format!("Failed to read backup file metadata: {}", e),
    })?;

    println!("Restore completed successfully");

    Ok(SaveFile::new(
        game_id,
        save_id,
        metadata.len(),
        backup_file.to_string_lossy().into_owned(),
    ))
}

#[tauri::command]
pub async fn backup_save(game_id: String) -> Result<BackupResponse, SaveFileError> {
    println!("Starting backup process for game: {}", game_id);
    
    // Step 1: Get game detail from database
    let (game, locations) = db::get_game(&game_id).map_err(|e| SaveFileError {
        message: format!("Failed to get game info from database: {}", e),
    })?;

    println!("Game info: {:?}", game);

    // Step 2: Get save_location and backup_location from game detail
    let save_location = expand_tilde(&game.save_location);
    let backup_location = match game.backup_location {
        Some(loc) => expand_tilde(&loc),
        None => return Err(SaveFileError {
            message: "Backup location not set for this game".to_string(),
        }),
    };

    println!("Save location: {:?}", save_location);
    println!("Backup location: {:?}", backup_location);

    // Verify save location exists
    if !save_location.exists() {
        return Err(SaveFileError {
            message: format!("Save location does not exist: {:?}", save_location),
        });
    }

    // Create backup directory if it doesn't exist
    if let Some(parent) = backup_location.parent() {
        create_dir_all(parent).map_err(|e| SaveFileError {
            message: format!("Failed to create backup directory: {}", e),
        })?;
    }

    // Step 3: Backup files from save_location to backup_location
    let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();
    let save_file_name = format!("save_{}.sav", timestamp);
    let backup_path = backup_location.join(&save_file_name);

    // Find and copy save files using patterns from locations
    let mut found_save = false;
    for location in locations {
        let pattern = location.pattern;
        println!("Checking pattern: {}", pattern);
        
        // Split pattern by semicolon to handle multiple patterns
        for single_pattern in pattern.split(';') {
            let glob_pattern = save_location.join(single_pattern.trim());
            println!("Checking glob pattern: {:?}", glob_pattern);
            
            if let Ok(entries) = glob::glob(&glob_pattern.to_string_lossy()) {
                for entry in entries.filter_map(Result::ok) {
                    println!("Found save file: {:?}", entry);
                    // Copy the save file
                    if let Err(e) = fs::copy(&entry, &backup_path) {
                        println!("Failed to copy save file: {}", e);
                        continue;
                    }
                    found_save = true;
                    break;
                }
                if found_save {
                    break;
                }
            }
        }
        if found_save {
            break;
        }
    }

    if !found_save {
        return Err(SaveFileError {
            message: format!("No save files found in save location: {:?}", save_location),
        });
    }

    let metadata = fs::metadata(&backup_path).map_err(|e| SaveFileError {
        message: format!("Failed to get file metadata: {}", e),
    })?;

    let backup_time = Utc::now().timestamp_millis();

    // Update game's last backup time in database
    if let Err(e) = db::update_backup_time(&game_id, backup_time) {
        println!("Failed to update backup time in database: {}", e);
    }

    println!("Backup completed successfully");
    Ok(BackupResponse {
        save_file: SaveFile::new(
            game_id,
            save_file_name,
            metadata.len(),
            backup_path.to_string_lossy().into_owned(),
        ),
        backup_time,
        save_count: 1, // Since we're backing up a single file
    })
}

#[tauri::command]
pub async fn list_saves(game_id: String) -> Result<Vec<SaveFile>, SaveFileError> {
    let saves_dir = get_saves_directory()?;
    let game_saves_dir = saves_dir.join(&game_id);

    if !game_saves_dir.exists() {
        return Ok(Vec::new());
    }

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

        if metadata.is_file() {
            let file_name = entry.file_name().to_string_lossy().to_string();
            let backup_location = entry.path().to_string_lossy().into_owned();
            saves.push(SaveFile::new(
                game_id.clone(),
                file_name,
                metadata.len(),
                backup_location,
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
