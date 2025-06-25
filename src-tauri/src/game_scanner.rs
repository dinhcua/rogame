use glob::glob;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fs, path::PathBuf};
use walkdir::WalkDir;
use crate::db::{self, Game as DbGame, SaveLocation as DbSaveLocation};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
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
    save_location: String,
}

#[derive(Debug, Deserialize)]
struct SaveGameConfig {
    games: HashMap<String, GameConfig>,
}

#[derive(Debug, Deserialize)]
struct GameConfig {
    locations: Vec<String>,
    patterns: Vec<String>,
    cover_image: String,
    category: String,
}

#[derive(Debug, Deserialize)]
pub struct CustomGameInfo {
    title: String,
    platform: String,
    locations: Vec<String>,
    patterns: Vec<String>,
    cover_image: String,
    category: String,
     // optional save_location
    save_location: String

}

// Common game installation directories
const STEAM_PATHS: &[&str] = &[
    "~/Library/Application Support/Steam/steamapps/common", // macOS
    "~/.steam/steam/steamapps/common",                      // Linux
    "C:\\Program Files (x86)\\Steam\\steamapps\\common",    // Windows
];

const EPIC_PATHS: &[&str] = &[
    "~/Library/Application Support/Epic/EpicGamesLauncher/Data/Manifests", // macOS
    "~/.config/Epic/EpicGamesLauncher/Data/Manifests",                     // Linux
    "C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests",           // Windows
];

const GOG_PATHS: &[&str] = &[
    "~/Library/Application Support/GOG.com/Galaxy/Games", // macOS
    "~/.local/share/GOG Galaxy/Games",                    // Linux
    "C:\\Program Files (x86)\\GOG Galaxy\\Games",        // Windows
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

fn get_os_specific_location(locations: &[String]) -> Option<String> {
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

fn scan_save_location(game_title: &str, save_config: &SaveGameConfig) -> (String, i32, String) {
    if let Some(game_info) = save_config.games.get(game_title) {
        if let Some(location) = get_os_specific_location(&game_info.locations) {
            let expanded_path = expand_tilde(&location);
            if expanded_path.exists() {
                let mut total_size = 0u64;
                let mut file_count = 0;

                for pattern in &game_info.patterns {
                    let glob_pattern = expanded_path.join(pattern).to_string_lossy().into_owned();
                    if let Ok(entries) = glob(&glob_pattern) {
                        for entry in entries.filter_map(Result::ok) {
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
    }
    (String::new(), 0, "0B".to_string())
}

// Function to scan Steam library
fn scan_steam_library() -> Vec<String> {
    let mut games = Vec::new();
    
    // Get the Steam path for current OS
    let steam_path = if cfg!(target_os = "macos") {
        STEAM_PATHS[0]
    } else if cfg!(target_os = "linux") {
        STEAM_PATHS[1]
    } else if cfg!(target_os = "windows") {
        STEAM_PATHS[2]
    } else {
        return games;
    };

    let expanded_path = expand_tilde(steam_path);
    if expanded_path.exists() {
        if let Ok(entries) = fs::read_dir(expanded_path) {
            for entry in entries.filter_map(Result::ok) {
                if entry.path().is_dir() {
                    if let Some(name) = entry.path().file_name() {
                        if let Some(name_str) = name.to_str() {
                            // Convert directory name to game title (replace underscores with spaces)
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

// Function to scan Epic Games library
fn scan_epic_library() -> Vec<String> {
    let mut games = Vec::new();
    
    // Get the Epic path for current OS
    let epic_path = if cfg!(target_os = "macos") {
        EPIC_PATHS[0]
    } else if cfg!(target_os = "linux") {
        EPIC_PATHS[1]
    } else if cfg!(target_os = "windows") {
        EPIC_PATHS[2]
    } else {
        return games;
    };

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

// Function to scan GOG library
fn scan_gog_library() -> Vec<String> {
    let mut games = Vec::new();
    
    // Get the GOG path for current OS
    let gog_path = if cfg!(target_os = "macos") {
        GOG_PATHS[0]
    } else if cfg!(target_os = "linux") {
        GOG_PATHS[1]
    } else if cfg!(target_os = "windows") {
        GOG_PATHS[2]
    } else {
        return games;
    };

    let expanded_path = expand_tilde(gog_path);
    if expanded_path.exists() {
        if let Ok(entries) = fs::read_dir(expanded_path) {
            for entry in entries.filter_map(Result::ok) {
                if entry.path().is_dir() {
                    if let Some(name) = entry.path().file_name() {
                        if let Some(name_str) = name.to_str() {
                            // Convert directory name to game title
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

#[tauri::command]
pub async fn scan_games() -> Result<HashMap<String, GameInfo>, String> {
    let mut games = HashMap::new();
    
    // Load save game configuration
    let config_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src/save_game_location.json");
    let save_config: SaveGameConfig = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| e.to_string())?,
        Err(e) => return Err(format!("Failed to read save game configuration: {}", e)),
    };

    // Scan all platforms
    let mut all_games = Vec::new();
    
    // Add Steam games
    let steam_games = scan_steam_library();
    for game in steam_games {
        all_games.push((game, "Steam".to_string()));
    }
    
    // Add Epic games
    let epic_games = scan_epic_library();
    for game in epic_games {
        all_games.push((game, "Epic".to_string()));
    }
    
    // Add GOG games
    let gog_games = scan_gog_library();
    for game in gog_games {
        all_games.push((game, "GOG".to_string()));
    }

    // Process all found games
    for (title, platform) in all_games {
        let id = Uuid::new_v4().to_string();
        
        // Try to find game in save_game_location.json
        let game_config = save_config.games.get(&title);
        
        let (save_location, save_count, size, category, cover_image) = if let Some(config) = game_config {
            let (path, count, size) = scan_save_location(&title, &save_config);
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

#[tauri::command]
pub async fn scan_installed_games() -> Result<HashMap<String, GameInfo>, String> {
    let mut games = HashMap::new();

    // Get all games from database
    let db_games = db::get_all_games().map_err(|e| e.to_string())?;

    // Convert database games to GameInfo format
    for (game, locations) in db_games {
        let (save_location, file_count, total_size) = if let Some(loc) = locations.first() {
            let expanded_path = expand_tilde(&loc.path);
            let mut count = 0;
            let mut size = 0u64;

            if expanded_path.exists() {
                if let Ok(entries) = glob(&format!("{}/{}", expanded_path.to_string_lossy(), loc.pattern)) {
                    for entry in entries.filter_map(Result::ok) {
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

// Helper function to get backup directory path
fn get_backup_dir() -> PathBuf {
    let app_data_dir = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("./"));
    app_data_dir.join("rogame").join("saves")
}

#[tauri::command]
pub async fn delete_save_file(game_id: String, save_id: String) -> Result<(), String> {
    let mut found = false;
    let mut last_error = None;

    // 1. Delete from original save locations
    let config_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src/save_game_location.json");
    let save_config: SaveGameConfig = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| e.to_string())?,
        Err(e) => return Err(format!("Failed to read save game configuration: {}", e)),
    };

    let game_info = save_config
        .games
        .iter()
        .find(|(name, _)| name.contains(&game_id))
        .map(|(_, info)| info)
        .ok_or_else(|| format!("Game not found: {}", game_id))?;

    // Delete from original save locations
    for location in &game_info.locations {
        let expanded_path = expand_tilde(location);
        if expanded_path.exists() {
            // First try exact match
            let exact_path = expanded_path.join(&save_id);
            if exact_path.exists() {
                match fs::remove_file(&exact_path) {
                    Ok(_) => found = true,
                    Err(e) => last_error = Some(e.to_string()),
                }
                continue; // If we found an exact match, no need to check patterns
            }

            // Try patterns only if exact match wasn't found
            for pattern in &game_info.patterns {
                let glob_pattern = expanded_path.join(pattern).to_string_lossy().into_owned();
                if let Ok(entries) = glob(&glob_pattern) {
                    for entry in entries.filter_map(Result::ok) {
                        if let Some(file_name) = entry.file_name() {
                            // Only delete if the file name matches exactly
                            if file_name.to_string_lossy() == save_id {
                                match fs::remove_file(&entry) {
                                    Ok(_) => found = true,
                                    Err(e) => last_error = Some(e.to_string()),
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 2. Delete from backup directory
    let backup_dir = get_backup_dir().join(&game_id);
    if backup_dir.exists() {
        let backup_file = backup_dir.join(&save_id);
        if backup_file.exists() {
            match fs::remove_file(&backup_file) {
                Ok(_) => found = true,
                Err(e) => last_error = Some(e.to_string()),
            }
        }
    }

    if !found {
        if let Some(error) = last_error {
            return Err(format!("Failed to delete save file: {}", error));
        }
        return Err(format!("Save file not found: {}", save_id));
    }

    Ok(())
}

// Helper function to list all save files for a game
fn list_save_files(game_id: &str) -> Result<Vec<String>, String> {
    let config_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src/save_game_location.json");
    let save_config: SaveGameConfig = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| e.to_string())?,
        Err(e) => return Err(format!("Failed to read save game configuration: {}", e)),
    };

    let game_info = save_config
        .games
        .iter()
        .find(|(name, _)| name.contains(game_id))
        .map(|(_, info)| info)
        .ok_or_else(|| format!("Game not found: {}", game_id))?;

    let mut save_files = Vec::new();

    for location in &game_info.locations {
        let expanded_path = expand_tilde(location);
        if expanded_path.exists() {
            for pattern in &game_info.patterns {
                let glob_pattern = expanded_path.join(pattern).to_string_lossy().into_owned();
                if let Ok(entries) = glob(&glob_pattern) {
                    for entry in entries.filter_map(Result::ok) {
                        if let Some(file_name) = entry.file_name() {
                            save_files.push(file_name.to_string_lossy().into_owned());
                        }
                    }
                }
            }
        }
    }

    Ok(save_files)
}

#[tauri::command]
pub async fn delete_game(game_id: String) -> Result<(), String> {
    db::delete_game(&game_id).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn toggle_favorite(game_id: String) -> Result<(), String> {
    db::toggle_favorite(&game_id).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn delete_game_saves(game_id: String) -> Result<(), String> {
    println!("Attempting to delete saves for game: {}", game_id);
    let mut errors = Vec::new();

    // 1. Delete from original save locations
    let config_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src/save_game_location.json");
    let save_config: SaveGameConfig = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| e.to_string())?,
        Err(e) => return Err(format!("Failed to read save game configuration: {}", e)),
    };

    // Find game info by exact title match
    let game_info = save_config
        .games
        .get(&game_id)
        .ok_or_else(|| format!("Game not found: {}", game_id))?;

    println!("Found game info: {:?}", game_info);

    // Delete from original save locations
    for location in &game_info.locations {
        let expanded_path = expand_tilde(location);
        println!("Checking location: {:?}", expanded_path);

        if expanded_path.exists() {
            for pattern in &game_info.patterns {
                let glob_pattern = expanded_path.join(pattern).to_string_lossy().into_owned();
                println!("Checking pattern: {}", glob_pattern);

                if let Ok(entries) = glob(&glob_pattern) {
                    for entry in entries.filter_map(Result::ok) {
                        println!("Deleting file: {:?}", entry);
                        if let Err(e) = fs::remove_file(&entry) {
                            let error_msg =
                                format!("Failed to delete save file {}: {}", entry.display(), e);
                            println!("Error: {}", error_msg);
                            errors.push(error_msg);
                        } else {
                            println!("Successfully deleted: {:?}", entry);
                        }
                    }
                }
            }

            // Try to remove the directory if it's empty
            if expanded_path.exists() {
                match fs::read_dir(&expanded_path) {
                    Ok(mut dir) => {
                        if dir.next().is_none() {
                            // Directory is empty
                            if let Err(e) = fs::remove_dir(&expanded_path) {
                                println!(
                                    "Failed to remove empty directory {}: {}",
                                    expanded_path.display(),
                                    e
                                );
                            } else {
                                println!(
                                    "Successfully removed empty directory: {:?}",
                                    expanded_path
                                );
                            }
                        }
                    }
                    Err(e) => println!(
                        "Failed to read directory {}: {}",
                        expanded_path.display(),
                        e
                    ),
                }
            }
        }
    }

    // 2. Delete from backup directory
    let backup_dir = get_backup_dir().join(&game_id);
    println!("Checking backup directory: {:?}", backup_dir);

    if backup_dir.exists() {
        if let Err(e) = fs::remove_dir_all(&backup_dir) {
            let error_msg = format!("Failed to delete backup directory: {}", e);
            println!("Error: {}", error_msg);
            errors.push(error_msg);
        } else {
            println!("Successfully deleted backup directory");
        }
    }

    if !errors.is_empty() {
        Err(errors.join("\n"))
    } else {
        println!("Successfully deleted all save files for game: {}", game_id);
        Ok(())
    }
}

#[tauri::command]
pub async fn add_custom_game(game_info: CustomGameInfo) -> Result<GameInfo, String> {
    let game_id = Uuid::new_v4().to_string();
    
    // Create database game record
    let db_game = DbGame {
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
        backup_location: None,
        last_backup_time: None,
    };

    // Create save location
    let db_location = DbSaveLocation {
        game_id: game_id.clone(),
        path: game_info.locations[0].clone(),
        pattern: game_info.patterns[0].clone(),
    };

    // Save to database
    db::add_game(&db_game, &[db_location]).map_err(|e| e.to_string())?;

    // Create GameInfo response
    // let save_location = SaveLocation {
    //     path: game_info.locations[0].clone(),
    //     file_count: 0,
    //     total_size: "0B".to_string(),
    //     last_modified: "Unknown".to_string(),
    // };

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

#[tauri::command]
pub async fn import_game(game: GameInfo) -> Result<GameInfo, String> {
    // Create database game record
    let db_game = DbGame {
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
        backup_location: None,
        last_backup_time: None,
    };

    // Create save location
    let db_location = DbSaveLocation {
        game_id: game.id.clone(),
        path: game.save_location.clone(),
        pattern: "*.sav".to_string(), // Default pattern, you might want to adjust this based on the game type
    };

    // Save to database
    db::add_game(&db_game, &[db_location]).map_err(|e| e.to_string())?;

    Ok(game)
}

#[tauri::command]
pub async fn get_game_detail(game_id: String) -> Result<GameInfo, String> {
    // Get game from database
    let (game, locations) = db::get_game(&game_id).map_err(|e| e.to_string())?;

    // Convert to GameInfo
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
