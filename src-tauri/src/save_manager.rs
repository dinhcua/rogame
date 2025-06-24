use chrono::prelude::*;
use serde::{Deserialize, Serialize};
use std::fs::{self, create_dir_all};
use std::path::PathBuf;

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
    pub fn new(game_id: String, file_name: String, size_bytes: u64, file_path: String) -> Self {
        let now = Utc::now().to_rfc3339();
        let expanded_path = expand_tilde(&file_path);
        
        // For mock saves, set origin_path to the Steam saves directory
        let origin_path = if let Some(home) = dirs::home_dir() {
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
            file_path: expanded_path.to_string_lossy().into_owned(),
            origin_path: origin_path.to_string_lossy().into_owned(),
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

    // Get the origin path (where to restore the save)
    let origin_path = if let Some(home) = dirs::home_dir() {
        let path = home
            .join("Library/Application Support/Steam/steamapps/common")
            .join(&game_id)
            .join("saves")
            .join("save1.sav"); // For test purposes, always restore to save1.sav
        
        // Create the directory if it doesn't exist
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|e| SaveFileError {
                message: format!("Failed to create origin directory: {}", e),
            })?;
        }
        
        path
    } else {
        return Err(SaveFileError {
            message: "Failed to get home directory".to_string(),
        });
    };

    // Copy the backup file to the original location
    fs::copy(&save_path, &origin_path).map_err(|e| SaveFileError {
        message: format!("Failed to restore save file: {}", e),
    })?;

    let metadata = fs::metadata(&save_path).map_err(|e| SaveFileError {
        message: format!("Failed to read save file metadata: {}", e),
    })?;

    println!(
        "Successfully restored save file from {:?} to {:?}",
        save_path, origin_path
    );

    Ok(SaveFile::new(
        game_id,
        save_id,
        metadata.len(),
        save_path.to_string_lossy().into_owned(),
    ))
}

#[tauri::command]
pub async fn backup_save(game_id: String) -> Result<BackupResponse, SaveFileError> {
    // Load backup settings
    let settings = load_backup_settings().await?;

    let saves_dir = get_saves_directory()?;
    let game_saves_dir = saves_dir.join(&game_id);

    // Create game saves directory if it doesn't exist
    create_dir_all(&game_saves_dir).map_err(|e| SaveFileError {
        message: format!("Failed to create saves directory: {}", e),
    })?;

    // Get the origin path (mock saves directory)
    let origin_path = if let Some(home) = dirs::home_dir() {
        home.join("Library/Application Support/Steam/steamapps/common")
            .join(&game_id)
            .join("saves")
    } else {
        return Err(SaveFileError {
            message: "Failed to get home directory".to_string(),
        });
    };

    // Create a new save file with timestamp
    let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();
    let save_file_name = format!("save_{}.sav", timestamp);
    let save_path = game_saves_dir.join(&save_file_name);

    // Find and copy the first available save file from origin
    let mut found_save = false;
    if let Ok(entries) = fs::read_dir(&origin_path) {
        for entry in entries.filter_map(Result::ok) {
            if entry.path().extension().map_or(false, |ext| ext == "sav") {
                // Copy the first .sav file we find
                if let Err(e) = fs::copy(&entry.path(), &save_path) {
                    return Err(SaveFileError {
                        message: format!("Failed to copy save file: {}", e),
                    });
                }
                found_save = true;
                break;
            }
        }
    }

    if !found_save {
        return Err(SaveFileError {
            message: "No save files found in origin directory".to_string(),
        });
    }

    let metadata = fs::metadata(&save_path).map_err(|e| SaveFileError {
        message: format!("Failed to get file metadata: {}", e),
    })?;

    let backup_time = Utc::now().timestamp_millis();

    // Count total number of save files
    let mut save_files: Vec<_> = fs::read_dir(&game_saves_dir)
        .map_err(|e| SaveFileError {
            message: format!("Failed to read saves directory: {}", e),
        })?
        .filter_map(Result::ok)
        .filter(|entry| entry.file_type().map(|ft| ft.is_file()).unwrap_or(false))
        .collect();

    // Sort files by creation time (newest first)
    save_files.sort_by(|a, b| {
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
    if save_files.len() > settings.max_backups as usize {
        for old_file in save_files.iter().skip(settings.max_backups as usize) {
            if let Err(e) = fs::remove_file(old_file.path()) {
                println!("Failed to remove old backup: {}", e);
            }
        }
    }

    Ok(BackupResponse {
        save_file: SaveFile::new(
            game_id,
            save_file_name,
            metadata.len(),
            save_path.to_string_lossy().into_owned(),
        ),
        backup_time,
        save_count: save_files.len() as i32,
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
            let file_path = entry.path().to_string_lossy().into_owned();
            saves.push(SaveFile::new(
                game_id.clone(),
                file_name,
                metadata.len(),
                file_path,
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
