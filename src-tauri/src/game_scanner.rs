use chrono::Local;
use glob::glob;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fs, path::PathBuf};
use walkdir::WalkDir;

// Helper function to get save game config path
fn get_save_config_path() -> PathBuf {
    if cfg!(debug_assertions) {
        // During development, use the source file
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src/save_game_location.json")
    } else {
        // In production, load from resources
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                // Try multiple possible locations
                let resource_paths = vec![
                    exe_dir.join("resources").join("save_game_location.json"),
                    exe_dir.join("save_game_location.json"),
                    exe_dir.join("_up_").join("resources").join("save_game_location.json"),
                ];
                
                for path in resource_paths {
                    if path.exists() {
                        return path;
                    }
                }
            }
        }
        
        // Fallback
        PathBuf::from("save_game_location.json")
    }
}

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
    #[serde(default)]
    steam_id: String,
}

// Common game installation directories
const STEAM_PATHS: &[&str] = &[
    "~/Library/Application Support/Steam/steamapps/common", // macOS
    "~/.steam/steam/steamapps/common",                      // Linux
    "C:\\Program Files (x86)\\Steam\\steamapps\\common",    // Windows
];

// Steam installation paths (for finding libraryfolders.vdf)
const STEAM_ROOT_PATHS: &[&str] = &[
    "~/Library/Application Support/Steam",              // macOS
    "~/.steam/steam",                                  // Linux
    "~/.local/share/Steam",                            // Linux alternative
    "C:\\Program Files (x86)\\Steam",                  // Windows
    "C:\\Program Files\\Steam",                        // Windows alternative
];

const EPIC_PATHS: &[&str] = &[
    "~/Library/Application Support/Epic/EpicGamesLauncher/Data/Manifests", // macOS
    "~/.config/Epic/EpicGamesLauncher/Data/Manifests",                     // Linux
    "C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests",           // Windows
];

// Steam userdata directories
const STEAM_USERDATA_PATHS: &[&str] = &[
    "~/Library/Application Support/Steam/userdata", // macOS
    "~/.steam/steam/userdata",                      // Linux
    "~/.local/share/Steam/userdata",                // Linux alternative
    "C:\\Program Files (x86)\\Steam\\userdata",     // Windows
];

fn expand_tilde(path: &str) -> PathBuf {
    // Handle tilde expansion for Unix-like paths
    if path.starts_with("~/") {
        if let Some(home) = dirs::home_dir() {
            return home.join(&path[2..]);
        }
    }
    
    // For Windows absolute paths, return as-is
    if cfg!(windows) {
        // Check if it's already an absolute Windows path
        if path.len() >= 3 && path.chars().nth(1) == Some(':') && path.chars().nth(2) == Some('\\') {
            return PathBuf::from(path);
        }
    }
    
    PathBuf::from(path)
}

// Parse Steam's libraryfolders.vdf to find all Steam library locations
fn get_steam_library_folders() -> Vec<PathBuf> {
    let mut library_folders = Vec::new();
    
    // Always include default paths
    for path in STEAM_PATHS {
        let expanded = expand_tilde(path);
        if expanded.exists() {
            library_folders.push(expanded);
        }
    }
    
    // Try to find and parse libraryfolders.vdf
    for steam_root in STEAM_ROOT_PATHS {
        let steam_path = expand_tilde(steam_root);
        let vdf_path = steam_path.join("steamapps").join("libraryfolders.vdf");
        
        println!("Checking for Steam library config at: {:?}", vdf_path);
        
        if vdf_path.exists() {
            println!("Found libraryfolders.vdf at: {:?}", vdf_path);
            if let Ok(content) = fs::read_to_string(&vdf_path) {
                // Parse VDF format (simple parser for "path" values)
                for line in content.lines() {
                    let trimmed = line.trim();
                    if trimmed.contains("\"path\"") && trimmed.contains("\"") {
                        // Find the value after "path"
                        if let Some(path_start) = trimmed.rfind("\"") {
                            if let Some(value_start) = trimmed[..path_start].rfind("\"") {
                                let path_str = &trimmed[value_start + 1..path_start];
                                // Replace double backslashes with single ones for Windows paths
                                let cleaned_path = path_str.replace("\\\\", "\\");
                                let library_path = PathBuf::from(cleaned_path).join("steamapps").join("common");
                                
                                println!("Checking library path: {:?}", library_path);
                                
                                if library_path.exists() && !library_folders.contains(&library_path) {
                                    println!("Found valid Steam library: {:?}", library_path);
                                    library_folders.push(library_path);
                                }
                            }
                        }
                    }
                }
            } else {
                println!("Failed to read libraryfolders.vdf");
            }
            break; // Found one valid libraryfolders.vdf, no need to check others
        }
    }
    
    println!("Total Steam libraries found: {}", library_folders.len());
    
    // Additional fallback: Check common drive letters on Windows
    if cfg!(windows) && library_folders.is_empty() {
        println!("No Steam libraries found via VDF, checking common locations...");
        
        // Check common drive letters for Steam installations
        let common_drives = vec!["C:", "D:", "E:", "F:", "G:", "H:"];
        let common_steam_paths = vec![
            "\\SteamLibrary\\steamapps\\common",
            "\\Steam\\steamapps\\common",
            "\\Games\\Steam\\steamapps\\common",
            "\\Program Files\\Steam\\steamapps\\common",
            "\\Program Files (x86)\\Steam\\steamapps\\common",
        ];
        
        for drive in &common_drives {
            for steam_path in &common_steam_paths {
                let full_path = PathBuf::from(format!("{}{}", drive, steam_path));
                if full_path.exists() && !library_folders.contains(&full_path) {
                    println!("Found Steam library at: {:?}", full_path);
                    library_folders.push(full_path);
                }
            }
        }
    }
    
    library_folders
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

// Function to find Steam user IDs
fn get_steam_user_ids() -> Vec<String> {
    let mut user_ids = Vec::new();

    for steam_path in STEAM_USERDATA_PATHS {
        let path = expand_tilde(steam_path);
        if path.exists() {
            if let Ok(entries) = fs::read_dir(&path) {
                for entry in entries.filter_map(|e| e.ok()) {
                    if entry.path().is_dir() {
                        if let Ok(user_id) = entry.file_name().into_string() {
                            // Only add if it looks like a Steam user ID (numeric)
                            if user_id.chars().all(|c| c.is_digit(10)) {
                                user_ids.push(user_id);
                            }
                        }
                    }
                }
            }
        }
    }

    user_ids
}

// Function to replace {{uid}} placeholders in paths
fn replace_placeholders(path: &str, user_ids: &[String]) -> Vec<String> {
    if path.contains("{{uid}}") {
        user_ids
            .iter()
            .map(|uid| path.replace("{{uid}}", uid))
            .collect()
    } else {
        vec![path.to_string()]
    }
}

fn scan_save_locations(game_title: &str, save_config: &SaveGameConfig) -> Vec<SaveLocation> {
    let mut save_locations = Vec::new();
    let steam_user_ids = get_steam_user_ids();

    if let Some(game_info) = save_config.games.get(game_title) {
        for location in &game_info.locations {
            // Expand the location with possible user IDs
            let expanded_locations = replace_placeholders(location, &steam_user_ids);

            for expanded_location in expanded_locations {
                let expanded_path = expand_tilde(&expanded_location);
                if expanded_path.exists() {
                    let mut total_size = 0u64;
                    let mut file_count = 0;
                    let mut latest_modified = std::time::SystemTime::UNIX_EPOCH;

                    for pattern in &game_info.patterns {
                        let glob_pattern =
                            expanded_path.join(pattern).to_string_lossy().into_owned();
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
                            path: expanded_path.to_string_lossy().into_owned(),
                            file_count,
                            total_size: format_size(total_size),
                            last_modified,
                        });
                    }
                }
            }
        }
    }

    save_locations
}

#[tauri::command]
pub async fn scan_games() -> Result<HashMap<String, GameInfo>, String> {
    println!("Starting game scan...");
    println!("Operating System: {}", std::env::consts::OS);
    
    let mut games = HashMap::new();
    let mut game_id = 0;

    // Load save game configuration
    let config_path = get_save_config_path();
    println!("Loading save game config from: {:?}", config_path);
    
    let save_config: SaveGameConfig = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| e.to_string())?,
        Err(e) => {
            println!("Error reading config: {}", e);
            // Return empty config as fallback
            SaveGameConfig {
                games: HashMap::new()
            }
        },
    };

    // Scan Steam games from all library folders
    let steam_libraries = get_steam_library_folders();
    println!("Found {} Steam library folders", steam_libraries.len());
    
    for library_path in steam_libraries {
        println!("Scanning Steam library: {:?}", library_path);
        if library_path.exists() {
            if let Ok(entries) = fs::read_dir(&library_path) {
                for entry in entries.filter_map(|e| e.ok()) {
                    if entry.path().is_dir() {
                        if let Ok(game_name) = entry.file_name().into_string() {
                            let game_path = entry.path();
                            println!("Found game: {} at {:?}", game_name, game_path);
                            let size = get_directory_size(&game_path);
                            let save_locations = scan_save_locations(&game_name, &save_config);
                            let save_count = save_locations.iter().map(|loc| loc.file_count).sum();

                            // Get cover image and category from config if available, otherwise use defaults
                            let (cover_image, category) = if let Some(game_info) =
                                save_config.games.get(&game_name)
                            {
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
                                    last_played: save_locations
                                        .first()
                                        .map_or("Never".to_string(), |loc| {
                                            loc.last_modified.clone()
                                        }),
                                    save_count,
                                    size: format_size(size),
                                    status: if save_count > 0 {
                                        "has_saves"
                                    } else {
                                        "no_saves"
                                    }
                                    .to_string(),
                                    category,
                                    is_favorite: false,
                                    save_locations,
                                },
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
                    if entry.path().is_file()
                        && entry.path().extension().map_or(false, |ext| ext == "item")
                    {
                        if let Ok(content) = fs::read_to_string(entry.path()) {
                            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                                if let Some(display_name) = json["DisplayName"].as_str() {
                                    if let Some(install_location) = json["InstallLocation"].as_str()
                                    {
                                        let game_path = PathBuf::from(install_location);
                                        let size = get_directory_size(&game_path);
                                        let save_locations =
                                            scan_save_locations(display_name, &save_config);
                                        let save_count =
                                            save_locations.iter().map(|loc| loc.file_count).sum();

                                        // Get cover image and category from config if available, otherwise use defaults
                                        let (cover_image, category) = if let Some(game_info) =
                                            save_config.games.get(display_name)
                                        {
                                            (
                                                game_info.cover_image.clone(),
                                                game_info.category.clone(),
                                            )
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
                                                last_played: save_locations
                                                    .first()
                                                    .map_or("Never".to_string(), |loc| {
                                                        loc.last_modified.clone()
                                                    }),
                                                save_count,
                                                size: format_size(size),
                                                status: if save_count > 0 {
                                                    "has_saves"
                                                } else {
                                                    "no_saves"
                                                }
                                                .to_string(),
                                                category,
                                                is_favorite: false,
                                                save_locations,
                                            },
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
    let config_path = get_save_config_path();
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

    let steam_user_ids = get_steam_user_ids();

    // Delete from original save locations
    for location in &game_info.locations {
        // Expand the location with possible user IDs
        let expanded_locations = replace_placeholders(location, &steam_user_ids);

        for expanded_location in expanded_locations {
            let expanded_path = expand_tilde(&expanded_location);
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
    let config_path = get_save_config_path();
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
    let steam_user_ids = get_steam_user_ids();

    for location in &game_info.locations {
        // Expand the location with possible user IDs
        let expanded_locations = replace_placeholders(location, &steam_user_ids);

        for expanded_location in expanded_locations {
            let expanded_path = expand_tilde(&expanded_location);
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
    }

    Ok(save_files)
}

#[tauri::command]
pub async fn delete_game_saves(game_id: String) -> Result<(), String> {
    println!("Attempting to delete saves for game: {}", game_id);
    let mut errors = Vec::new();

    // 1. Delete from original save locations
    let config_path = get_save_config_path();
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
    let steam_user_ids = get_steam_user_ids();

    // Delete from original save locations
    for location in &game_info.locations {
        // Expand the location with possible user IDs
        let expanded_locations = replace_placeholders(location, &steam_user_ids);

        for expanded_location in expanded_locations {
            let expanded_path = expand_tilde(&expanded_location);
            println!("Checking location: {:?}", expanded_path);

            if expanded_path.exists() {
                for pattern in &game_info.patterns {
                    let glob_pattern = expanded_path.join(pattern).to_string_lossy().into_owned();
                    println!("Checking pattern: {}", glob_pattern);

                    if let Ok(entries) = glob(&glob_pattern) {
                        for entry in entries.filter_map(Result::ok) {
                            println!("Deleting file: {:?}", entry);
                            if let Err(e) = fs::remove_file(&entry) {
                                let error_msg = format!(
                                    "Failed to delete save file {}: {}",
                                    entry.display(),
                                    e
                                );
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
