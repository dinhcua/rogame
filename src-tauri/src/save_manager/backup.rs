use crate::db::{Game, SaveLocation};
use crate::error::{AppError, Result};
use crate::save_manager::{BackupResponse, SaveFile};
use crate::utils::expand_tilde;
use chrono::prelude::*;
use glob::glob;
use std::fs;

pub struct BackupHandler;

impl BackupHandler {
    pub fn new() -> Self {
        Self
    }

    pub fn backup_game_saves(&self, game: &Game, locations: &[SaveLocation]) -> Result<BackupResponse> {
        let save_location = expand_tilde(&game.save_location);
        let backup_location = match &game.backup_location {
            Some(loc) => expand_tilde(loc),
            None => return Err(AppError::BackupError("Backup location not set for this game".to_string())),
        };

        if !save_location.exists() {
            return Err(AppError::NotFound(format!("Save location does not exist: {:?}", save_location)));
        }

        if let Some(parent) = backup_location.parent() {
            fs::create_dir_all(parent)?;
        }

        let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();
        let save_file_name = format!("save_{}.sav", timestamp);
        let backup_path = backup_location.join(&save_file_name);

        let mut found_save = false;
        for location in locations {
            let pattern = location.pattern.clone();
            
            for single_pattern in pattern.split(';') {
                let glob_pattern = save_location.join(single_pattern.trim());
                
                if let Ok(entries) = glob(&glob_pattern.to_string_lossy()) {
                    for entry in entries.filter_map(|r| r.ok()) {
                        fs::copy(&entry, &backup_path)?;
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
            return Err(AppError::NotFound(format!("No save files found in save location: {:?}", save_location)));
        }

        let metadata = fs::metadata(&backup_path)?;
        let backup_time = Utc::now().timestamp_millis();

        Ok(BackupResponse {
            save_file: SaveFile::new(
                game.id.clone(),
                save_file_name,
                metadata.len(),
                backup_path.to_string_lossy().into_owned(),
            ),
            backup_time,
            save_count: 1,
        })
    }

    pub fn restore_save(&self, game: &Game, save_id: &str) -> Result<SaveFile> {
        let save_location = expand_tilde(&game.save_location);
        let backup_location = match &game.backup_location {
            Some(loc) => expand_tilde(loc),
            None => return Err(AppError::BackupError("Backup location not set for this game".to_string())),
        };

        let backup_file = backup_location.join(save_id);
        if !backup_file.exists() {
            return Err(AppError::NotFound(format!("Backup file not found: {:?}", backup_file)));
        }

        if let Some(parent) = save_location.parent() {
            fs::create_dir_all(parent)?;
        }

        let save_file_path = save_location.join(save_id);
        fs::copy(&backup_file, &save_file_path)?;

        let metadata = fs::metadata(&backup_file)?;

        Ok(SaveFile::new(
            game.id.clone(),
            save_id.to_string(),
            metadata.len(),
            backup_file.to_string_lossy().into_owned(),
        ))
    }
}