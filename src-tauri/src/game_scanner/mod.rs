mod config;
mod library_scanner;
mod models;

use crate::db::{GameRepository, SaveLocation as DbSaveLocation};
use crate::error::{AppError, Result};
use crate::utils::{expand_tilde, format_size, PlatformPaths};
use glob::glob;
use std::{collections::HashMap, fs, path::PathBuf};
use uuid::Uuid;

pub use config::*;
pub use library_scanner::*;
pub use models::*;

pub struct GameScanner<R: GameRepository> {
    repository: R,
}

impl<R: GameRepository> GameScanner<R> {
    pub fn new(repository: R) -> Self {
        Self { repository }
    }

    pub async fn scan_games(&self) -> Result<HashMap<String, GameInfo>> {
        let config_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src/save_game_location.json");
        let save_config = SaveGameConfig::load(&config_path)?;

        let mut games = HashMap::new();
        let scanner = LibraryScanner::new();
        let all_games = scanner.scan_all_libraries();

        for (title, platform) in all_games {
            let id = Uuid::new_v4().to_string();
            let game_config = save_config.games.get(&title);
            
            let (save_location, save_count, size, category, cover_image) = if let Some(config) = game_config {
                let (path, count, size) = scanner.scan_save_location(&title, &save_config);
                (path, count, size, config.category.clone(), config.cover_image.clone())
            } else {
                (String::new(), 0, "0B".to_string(), "Unknown".to_string(), String::new())
            };

            games.insert(
                id.clone(),
                GameInfo {
                    id,
                    title,
                    cover_image,
                    platform,
                    last_played: "Never".to_string(),
                    save_count,
                    size,
                    status: if save_count > 0 { "has_saves" } else { "no_saves" }.to_string(),
                    category,
                    is_favorite: false,
                    save_location,
                },
            );
        }

        Ok(games)
    }

    pub async fn scan_installed_games(&self) -> Result<HashMap<String, GameInfo>> {
        let mut games = HashMap::new();
        let db_games = self.repository.get_all_games()?;

        for (game, locations) in db_games {
            let (save_location, file_count, total_size) = if let Some(loc) = locations.first() {
                let expanded_path = expand_tilde(&loc.path);
                let mut count = 0;
                let mut size = 0u64;

                if expanded_path.exists() {
                    if let Ok(entries) = glob(&format!("{}/{}", expanded_path.to_string_lossy(), loc.pattern)) {
                        for entry in entries.filter_map(|r| r.ok()) {
                            if let Ok(metadata) = entry.metadata() {
                                size += metadata.len();
                                count += 1;
                            }
                        }
                    }
                }

                (loc.path.clone(), count, format_size(size))
            } else {
                (String::new(), 0, "0B".to_string())
            };

            games.insert(
                game.id.clone(),
                GameInfo {
                    id: game.id,
                    title: game.title,
                    cover_image: game.cover_image,
                    platform: game.platform,
                    last_played: game.last_played,
                    save_count: file_count,
                    size: total_size,
                    status: if file_count > 0 { "has_saves" } else { "no_saves" }.to_string(),
                    category: game.category,
                    is_favorite: game.is_favorite,
                    save_location,
                },
            );
        }

        Ok(games)
    }

    pub async fn import_custom_game(&self, game_info: CustomGameInfo) -> Result<GameInfo> {
        let game_id = Uuid::new_v4().to_string();
        let backup_dir = PlatformPaths::backup_dir().join(&game_id);
        fs::create_dir_all(&backup_dir)?;
        
        let backup_location = backup_dir.to_string_lossy().into_owned();
        
        let db_game = crate::db::Game {
            id: game_id.clone(),
            title: game_info.title.clone(),
            platform: game_info.platform.clone(),
            category: game_info.category.clone(),
            cover_image: game_info.cover_image.clone(),
            is_favorite: false,
            last_played: "Never".to_string(),
            save_count: 0,
            size: "0B".to_string(),
            status: "no_saves".to_string(),
            save_location: game_info.save_location.clone(),
            backup_location: Some(backup_location),
            last_backup_time: None,
        };

        let db_location = DbSaveLocation {
            game_id: game_id.clone(),
            path: game_info.locations[0].clone(),
            pattern: game_info.patterns[0].clone(),
        };

        self.repository.add_game(&db_game, &[db_location])?;

        Ok(GameInfo {
            id: game_id,
            title: game_info.title,
            cover_image: game_info.cover_image,
            platform: game_info.platform,
            last_played: "Never".to_string(),
            save_count: 0,
            size: "0B".to_string(),
            status: "no_saves".to_string(),
            category: game_info.category,
            is_favorite: false,
            save_location: game_info.save_location,
        })
    }

    pub async fn import_game(&self, game: GameInfo) -> Result<GameInfo> {
        let backup_dir = PlatformPaths::backup_dir().join(&game.id);
        fs::create_dir_all(&backup_dir)?;
        let backup_location = backup_dir.to_string_lossy().into_owned();

        let db_game = crate::db::Game {
            id: game.id.clone(),
            title: game.title.clone(),
            platform: game.platform.clone(),
            category: game.category.clone(),
            cover_image: game.cover_image.clone(),
            is_favorite: false,
            last_played: "Never".to_string(),
            save_count: game.save_count,
            size: game.size.clone(),
            status: game.status.clone(),
            save_location: game.save_location.clone(),
            backup_location: Some(backup_location),
            last_backup_time: None,
        };

        let pattern = match game.platform.as_str() {
            "Steam" => "*.sav;*.dat;*.save",
            "Epic" => "*.sav;*.dat;*.save;*.json",
            "GOG" => "*.sav;*.dat;*.save",
            _ => "*.sav;*.dat;*.save",
        };

        let db_location = DbSaveLocation {
            game_id: game.id.clone(),
            path: game.save_location.clone(),
            pattern: pattern.to_string(),
        };

        self.repository.add_game(&db_game, &[db_location])?;
        Ok(game)
    }

    pub async fn get_game_detail(&self, game_id: String) -> Result<GameInfo> {
        let (game, _) = self.repository.get_game(&game_id)?;

        Ok(GameInfo {
            id: game.id,
            title: game.title,
            cover_image: game.cover_image,
            platform: game.platform,
            last_played: game.last_played,
            save_count: game.save_count,
            size: game.size,
            status: game.status,
            category: game.category,
            is_favorite: game.is_favorite,
            save_location: game.save_location,
        })
    }

    pub async fn delete_game(&self, game_id: String) -> Result<()> {
        self.repository.delete_game(&game_id)?;
        Ok(())
    }

    pub async fn toggle_favorite(&self, game_id: String) -> Result<()> {
        self.repository.toggle_favorite(&game_id)?;
        Ok(())
    }

    pub async fn delete_save_file(&self, game_id: String, save_id: String) -> Result<()> {
        let config_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src/save_game_location.json");
        let save_config = SaveGameConfig::load(&config_path)?;

        let game_info = save_config
            .games
            .iter()
            .find(|(name, _)| name.contains(&game_id))
            .map(|(_, info)| info)
            .ok_or_else(|| AppError::NotFound(format!("Game not found: {}", game_id)))?;

        let mut found = false;

        for location in &game_info.locations {
            let expanded_path = expand_tilde(location);
            if expanded_path.exists() {
                let exact_path = expanded_path.join(&save_id);
                if exact_path.exists() {
                    fs::remove_file(&exact_path)?;
                    found = true;
                    continue;
                }

                for pattern in &game_info.patterns {
                    let glob_pattern = expanded_path.join(pattern).to_string_lossy().into_owned();
                    if let Ok(entries) = glob(&glob_pattern) {
                        for entry in entries.filter_map(|r| r.ok()) {
                            if let Some(file_name) = entry.file_name() {
                                if file_name.to_string_lossy() == save_id {
                                    fs::remove_file(&entry)?;
                                    found = true;
                                }
                            }
                        }
                    }
                }
            }
        }

        let backup_dir = PlatformPaths::backup_dir().join(&game_id);
        if backup_dir.exists() {
            let backup_file = backup_dir.join(&save_id);
            if backup_file.exists() {
                fs::remove_file(&backup_file)?;
                found = true;
            }
        }

        if !found {
            return Err(AppError::NotFound(format!("Save file not found: {}", save_id)));
        }

        Ok(())
    }

    pub async fn delete_game_saves(&self, game_id: String) -> Result<()> {
        let config_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src/save_game_location.json");
        let save_config = SaveGameConfig::load(&config_path)?;

        let game_info = save_config
            .games
            .get(&game_id)
            .ok_or_else(|| AppError::NotFound(format!("Game not found: {}", game_id)))?;

        for location in &game_info.locations {
            let expanded_path = expand_tilde(location);
            if expanded_path.exists() {
                for pattern in &game_info.patterns {
                    let glob_pattern = expanded_path.join(pattern).to_string_lossy().into_owned();
                    if let Ok(entries) = glob(&glob_pattern) {
                        for entry in entries.filter_map(|r| r.ok()) {
                            fs::remove_file(&entry)?;
                        }
                    }
                }

                if let Ok(mut dir) = fs::read_dir(&expanded_path) {
                    if dir.next().is_none() {
                        fs::remove_dir(&expanded_path)?;
                    }
                }
            }
        }

        let backup_dir = PlatformPaths::backup_dir().join(&game_id);
        if backup_dir.exists() {
            fs::remove_dir_all(&backup_dir)?;
        }

        Ok(())
    }
}