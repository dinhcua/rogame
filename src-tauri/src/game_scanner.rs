use serde::{Serialize, Deserialize};
use std::{collections::HashMap, path::PathBuf, fs};
use walkdir::WalkDir;
use glob::glob;

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
    save_locations: Vec<SaveLocation>,
}

#[derive(Debug, Serialize)]
pub struct SaveLocation {
    path: String,
    file_count: i32,
    total_size: String,
    last_modified: String,
}

#[derive(Debug, Deserialize)]
struct SaveGameConfig {
    games: HashMap<String, GameSaveInfo>,
}

#[derive(Debug, Deserialize)]
struct GameSaveInfo {
    locations: Vec<String>,
    patterns: Vec<String>,
    cover_image: String,
    category: String,
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

fn scan_save_locations(game_title: &str, save_config: &SaveGameConfig) -> Vec<SaveLocation> {
    let mut save_locations = Vec::new();
    
    if let Some(game_info) = save_config.games.get(game_title) {
        for location in &game_info.locations {
            let expanded_path = expand_tilde(location);
            if expanded_path.exists() {
                let mut total_size = 0u64;
                let mut file_count = 0;
                let mut latest_modified = std::time::SystemTime::UNIX_EPOCH;

                for pattern in &game_info.patterns {
                    let glob_pattern = expanded_path.join(pattern).to_string_lossy().into_owned();
                    if let Ok(entries) = glob(&glob_pattern) {
                        for entry in entries.filter_map(Result::ok) {
                            if let Ok(metadata) = entry.metadata() {
                                total_size += metadata.len();
                                file_count += 1;
                                if let Ok(modified) = metadata.modified() {
                                    if modified > latest_modified {
                                        latest_modified = modified;
                                    }
                                }
                            }
                        }
                    }
                }

                if file_count > 0 {
                    let last_modified = if latest_modified > std::time::SystemTime::UNIX_EPOCH {
                        chrono::DateTime::<chrono::Local>::from(latest_modified)
                            .format("%Y-%m-%d %H:%M:%S")
                            .to_string()
                    } else {
                        "Unknown".to_string()
                    };

                    save_locations.push(SaveLocation {
                        path: location.clone(),
                        file_count,
                        total_size: format_size(total_size),
                        last_modified,
                    });
                }
            }
        }
    }

    save_locations
}

#[tauri::command]
pub async fn scan_games() -> Result<HashMap<String, GameInfo>, String> {
    let mut games = HashMap::new();
    let mut game_id = 0;

    // Load save game configuration
    let config_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src/save_game_location.json");
    let save_config: SaveGameConfig = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| e.to_string())?,
        Err(e) => return Err(format!("Failed to read save game configuration: {}", e)),
    };

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
                            let save_locations = scan_save_locations(&game_name, &save_config);
                            let save_count = save_locations.iter().map(|loc| loc.file_count).sum();
                            
                            // Get cover image and category from config if available, otherwise use defaults
                            let (cover_image, category) = if let Some(game_info) = save_config.games.get(&game_name) {
                                (game_info.cover_image.clone(), game_info.category.clone())
                            } else {
                                ("https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg".to_string(), 
                                 "Unknown".to_string())
                            };
                            
                            game_id += 1;
                            games.insert(
                                format!("game{}", game_id),
                                GameInfo {
                                    id: format!("game{}", game_id),
                                    title: game_name,
                                    cover_image,
                                    platform: "Steam".to_string(),
                                    last_played: save_locations.first().map_or("Never".to_string(), |loc| loc.last_modified.clone()),
                                    save_count,
                                    size: format_size(size),
                                    status: if save_count > 0 { "has_saves" } else { "no_saves" }.to_string(),
                                    category,
                                    is_favorite: false,
                                    save_locations,
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
                                        let save_locations = scan_save_locations(display_name, &save_config);
                                        let save_count = save_locations.iter().map(|loc| loc.file_count).sum();
                                        
                                        // Get cover image and category from config if available, otherwise use defaults
                                        let (cover_image, category) = if let Some(game_info) = save_config.games.get(display_name) {
                                            (game_info.cover_image.clone(), game_info.category.clone())
                                        } else {
                                            ("https://cdn.cloudflare.steamstatic.com/steam/apps/1551360/header.jpg".to_string(), 
                                             "Unknown".to_string())
                                        };
                                        
                                        game_id += 1;
                                        games.insert(
                                            format!("game{}", game_id),
                                            GameInfo {
                                                id: format!("game{}", game_id),
                                                title: display_name.to_string(),
                                                cover_image,
                                                platform: "Epic Games".to_string(),
                                                last_played: save_locations.first().map_or("Never".to_string(), |loc| loc.last_modified.clone()),
                                                save_count,
                                                size: format_size(size),
                                                status: if save_count > 0 { "has_saves" } else { "no_saves" }.to_string(),
                                                category,
                                                is_favorite: false,
                                                save_locations,
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