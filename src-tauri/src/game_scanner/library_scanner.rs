use crate::utils::{expand_tilde, format_size, PlatformPaths};
use crate::game_scanner::SaveGameConfig;
use glob::glob;
use std::{fs, path::PathBuf};
use walkdir::WalkDir;

pub struct LibraryScanner;

impl LibraryScanner {
    pub fn new() -> Self {
        Self
    }

    pub fn scan_all_libraries(&self) -> Vec<(String, String)> {
        let mut all_games = Vec::new();
        
        let steam_games = self.scan_steam_library();
        for game in steam_games {
            all_games.push((game, "Steam".to_string()));
        }
        
        let epic_games = self.scan_epic_library();
        for game in epic_games {
            all_games.push((game, "Epic".to_string()));
        }
        
        let gog_games = self.scan_gog_library();
        for game in gog_games {
            all_games.push((game, "GOG".to_string()));
        }

        all_games
    }

    fn scan_steam_library(&self) -> Vec<String> {
        let mut games = Vec::new();
        let steam_path = PlatformPaths::get_platform_path(PlatformPaths::steam_paths());
        let expanded_path = expand_tilde(steam_path);

        if expanded_path.exists() {
            if let Ok(entries) = fs::read_dir(expanded_path) {
                for entry in entries.filter_map(Result::ok) {
                    if entry.path().is_dir() {
                        if let Some(name) = entry.path().file_name() {
                            if let Some(name_str) = name.to_str() {
                                let title = name_str.replace("_", " ");
                                games.push(title);
                            }
                        }
                    }
                }
            }
        }
        
        games
    }

    fn scan_epic_library(&self) -> Vec<String> {
        let mut games = Vec::new();
        let epic_path = PlatformPaths::get_platform_path(PlatformPaths::epic_paths());
        let expanded_path = expand_tilde(epic_path);

        if expanded_path.exists() {
            if let Ok(entries) = fs::read_dir(expanded_path) {
                for entry in entries.filter_map(Result::ok) {
                    if entry.path().is_file() && entry.path().extension().map_or(false, |ext| ext == "item") {
                        if let Ok(content) = fs::read_to_string(entry.path()) {
                            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                                if let Some(display_name) = json["DisplayName"].as_str() {
                                    games.push(display_name.to_string());
                                }
                            }
                        }
                    }
                }
            }
        }
        
        games
    }

    fn scan_gog_library(&self) -> Vec<String> {
        let mut games = Vec::new();
        let gog_path = PlatformPaths::get_platform_path(PlatformPaths::gog_paths());
        let expanded_path = expand_tilde(gog_path);

        if expanded_path.exists() {
            if let Ok(entries) = fs::read_dir(expanded_path) {
                for entry in entries.filter_map(Result::ok) {
                    if entry.path().is_dir() {
                        if let Some(name) = entry.path().file_name() {
                            if let Some(name_str) = name.to_str() {
                                let title = name_str.replace("_", " ");
                                games.push(title);
                            }
                        }
                    }
                }
            }
        }
        
        games
    }

    pub fn scan_save_location(&self, game_title: &str, save_config: &SaveGameConfig) -> (String, i32, String) {
        if let Some(game_info) = save_config.games.get(game_title) {
            let game_path = self.get_game_installation_path(game_title);
            let mut total_size = 0u64;
            let mut file_count = 0;

            if let Some(location) = self.get_os_specific_location(&game_info.locations) {
                let expanded_path = expand_tilde(&location);
                if expanded_path.exists() {
                    for pattern in &game_info.patterns {
                        let glob_pattern = expanded_path.join(pattern).to_string_lossy().into_owned();
                        if let Ok(entries) = glob(&glob_pattern) {
                            for entry in entries.filter_map(|r| r.ok()) {
                                if let Ok(metadata) = entry.metadata() {
                                    total_size += metadata.len();
                                    file_count += 1;
                                }
                            }
                        }
                    }

                    return (
                        expanded_path.to_string_lossy().into_owned(),
                        file_count,
                        format_size(total_size),
                    );
                }
            }

            if game_path.exists() {
                return (
                    game_path.to_string_lossy().into_owned(),
                    file_count,
                    format_size(total_size),
                );
            }
        }
        (String::new(), 0, "0B".to_string())
    }

    fn get_game_installation_path(&self, game_title: &str) -> PathBuf {
        let steam_path = PlatformPaths::get_platform_path(PlatformPaths::steam_paths());
        expand_tilde(steam_path).join(game_title)
    }

    fn get_os_specific_location(&self, locations: &[String]) -> Option<String> {
        let location = if cfg!(target_os = "macos") {
            locations.iter().find(|loc| loc.contains("Library") || loc.contains("Documents"))
        } else if cfg!(target_os = "linux") {
            locations.iter().find(|loc| loc.contains(".local"))
        } else if cfg!(target_os = "windows") {
            locations.iter().find(|loc| loc.contains("AppData") || loc.contains("Documents"))
        } else {
            None
        };

        location.cloned()
    }

    pub fn get_directory_size(&self, path: &PathBuf) -> u64 {
        WalkDir::new(path)
            .into_iter()
            .filter_map(|entry| entry.ok())
            .filter_map(|entry| entry.metadata().ok())
            .filter(|metadata| metadata.is_file())
            .fold(0, |acc, m| acc + m.len())
    }
}