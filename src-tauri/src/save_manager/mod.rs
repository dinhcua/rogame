mod backup;
mod models;

use crate::db::GameRepository;
use crate::error::Result;
use crate::utils::PlatformPaths;
use chrono::prelude::*;
use std::fs;

pub use backup::*;
pub use models::*;

pub struct SaveManager<R: GameRepository> {
    repository: R,
}

impl<R: GameRepository> SaveManager<R> {
    pub fn new(repository: R) -> Self {
        Self { repository }
    }

    pub async fn backup_save(&self, game_id: String) -> Result<BackupResponse> {
        let backup_handler = BackupHandler::new();
        let (game, locations) = self.repository.get_game(&game_id)?;
        
        let backup_response = backup_handler.backup_game_saves(&game, &locations)?;
        
        let backup_time = Utc::now().timestamp_millis();
        self.repository.update_backup_time(&game_id, backup_time)?;
        
        Ok(backup_response)
    }

    pub async fn restore_save(&self, game_id: String, save_id: String) -> Result<SaveFile> {
        let backup_handler = BackupHandler::new();
        let (game, _) = self.repository.get_game(&game_id)?;
        
        backup_handler.restore_save(&game, &save_id)
    }

    pub async fn list_saves(&self, game_id: String) -> Result<Vec<SaveFile>> {
        let saves_dir = PlatformPaths::backup_dir().join(&game_id);

        if !saves_dir.exists() {
            return Ok(Vec::new());
        }

        let mut saves = Vec::new();
        for entry in fs::read_dir(&saves_dir)? {
            let entry = entry?;
            let metadata = entry.metadata()?;

            if metadata.is_file() {
                let file_name = entry.file_name().to_string_lossy().to_string();
                let backup_location = entry.path().to_string_lossy().into_owned();
                saves.push(SaveFile::new(
                    file_name.clone(),
                    game_id.clone(),
                    file_name,
                    metadata.len(),
                    backup_location,
                ));
            }
        }

        Ok(saves)
    }

    pub async fn save_backup_settings(&self, settings: BackupSettings) -> Result<()> {
        let config_dir = PlatformPaths::config_dir();
        fs::create_dir_all(&config_dir)?;

        let settings_path = config_dir.join("backup_settings.json");
        let settings_json = serde_json::to_string_pretty(&settings)?;
        fs::write(&settings_path, settings_json)?;

        Ok(())
    }

    pub async fn load_backup_settings(&self) -> Result<BackupSettings> {
        let settings_path = PlatformPaths::config_dir().join("backup_settings.json");

        if !settings_path.exists() {
            return Ok(BackupSettings::default());
        }

        let settings_json = fs::read_to_string(&settings_path)?;
        let settings = serde_json::from_str(&settings_json)?;
        Ok(settings)
    }
}