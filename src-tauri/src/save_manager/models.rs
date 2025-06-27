use chrono::prelude::*;
use serde::{Deserialize, Serialize};
use crate::utils::expand_tilde;

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
    pub backup_time: i64,
    pub save_count: i32,
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
    pub fn new(id: String, game_id: String, file_name: String, size_bytes: u64, backup_location: String) -> Self {
        let now = Utc::now().to_rfc3339();
        let expanded_path = expand_tilde(&backup_location);

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
            id,
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