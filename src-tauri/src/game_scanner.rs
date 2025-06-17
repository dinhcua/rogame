use serde::{Serialize};
use std::{collections::HashMap, path::PathBuf, fs};
use walkdir::WalkDir;

#[derive(Debug, Serialize)]
pub struct GameInfo {
    id: String,
    title: String,
    cover_image: String,
    platform: String,
    last_played: String,
    save_count: i32,
    size: String,
    status: String,
    category: String,
    is_favorite: bool,
}

// Common game installation directories
const STEAM_PATHS: &[&str] = &[
    "~/Library/Application Support/Steam/steamapps/common",  // macOS
    "~/.steam/steam/steamapps/common",                      // Linux
    "C:\\Program Files (x86)\\Steam\\steamapps\\common",    // Windows
];

const EPIC_PATHS: &[&str] = &[
    "~/Library/Application Support/Epic/EpicGamesLauncher/Data/Manifests",  // macOS
    "~/.config/Epic/EpicGamesLauncher/Data/Manifests",                      // Linux
    "C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests",           // Windows
];

fn expand_tilde(path: &str) -> PathBuf {
    if path.starts_with("~/") {
        if let Some(home) = dirs::home_dir() {
            return home.join(&path[2..]);
        }
    }
    PathBuf::from(path)
}

fn get_directory_size(path: &PathBuf) -> u64 {
    WalkDir::new(path)
        .into_iter()
        .filter_map(|entry| entry.ok())
        .filter_map(|entry| entry.metadata().ok())
        .filter(|metadata| metadata.is_file())
        .fold(0, |acc, m| acc + m.len())
}

fn format_size(size: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if size >= GB {
        format!("{:.1}GB", size as f64 / GB as f64)
    } else if size >= MB {
        format!("{:.1}MB", size as f64 / MB as f64)
    } else if size >= KB {
        format!("{:.1}KB", size as f64 / KB as f64)
    } else {
        format!("{}B", size)
    }
}

#[tauri::command]
pub async fn scan_games() -> Result<HashMap<String, GameInfo>, String> {
    let mut games = HashMap::new();
    let mut game_id = 0;

    // Scan Steam games
    for steam_path in STEAM_PATHS {
        let path = expand_tilde(steam_path);
        if path.exists() {
            if let Ok(entries) = fs::read_dir(&path) {
                for entry in entries.filter_map(|e| e.ok()) {
                    if entry.path().is_dir() {
                        if let Ok(game_name) = entry.file_name().into_string() {
                            let game_path = entry.path();
                            let size = get_directory_size(&game_path);
                            
                            game_id += 1;
                            games.insert(
                                format!("game{}", game_id),
                                GameInfo {
                                    id: format!("game{}", game_id),
                                    title: game_name,
                                    cover_image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg".to_string(),
                                    platform: "Steam".to_string(),
                                    last_played: "Just added".to_string(),
                                    save_count: 0,
                                    size: format_size(size),
                                    status: "synced".to_string(),
                                    category: "Unknown".to_string(),
                                    is_favorite: false,
                                }
                            );
                        }
                    }
                }
            }
        }
    }

    // Scan Epic games
    for epic_path in EPIC_PATHS {
        let path = expand_tilde(epic_path);
        if path.exists() {
            if let Ok(entries) = fs::read_dir(&path) {
                for entry in entries.filter_map(|e| e.ok()) {
                    if entry.path().is_file() && entry.path().extension().map_or(false, |ext| ext == "item") {
                        if let Ok(content) = fs::read_to_string(entry.path()) {
                            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                                if let Some(display_name) = json["DisplayName"].as_str() {
                                    if let Some(install_location) = json["InstallLocation"].as_str() {
                                        let game_path = PathBuf::from(install_location);
                                        let size = get_directory_size(&game_path);
                                        
                                        game_id += 1;
                                        games.insert(
                                            format!("game{}", game_id),
                                            GameInfo {
                                                id: format!("game{}", game_id),
                                                title: display_name.to_string(),
                                                cover_image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1551360/header.jpg".to_string(),
                                                platform: "Epic Games".to_string(),
                                                last_played: "Just added".to_string(),
                                                save_count: 0,
                                                size: format_size(size),
                                                status: "synced".to_string(),
                                                category: "Unknown".to_string(),
                                                is_favorite: false,
                                            }
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(games)
} 