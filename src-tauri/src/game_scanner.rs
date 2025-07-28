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
                    exe_dir
                        .join("_up_")
                        .join("resources")
                        .join("save_game_location.json"),
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
struct GameEntry {
    steam_id: String,
    name: String,
    save_locations: SaveLocations,
    save_pattern: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct SaveLocations {
    #[serde(default)]
    macos: String,
    #[serde(default)]
    windows: String,
    #[serde(default)]
    linux: String,
}

// Helper function to get platform-specific save location
fn get_platform_save_location(locations: &SaveLocations) -> &str {
    #[cfg(target_os = "macos")]
    return &locations.macos;

    #[cfg(target_os = "windows")]
    return &locations.windows;

    #[cfg(target_os = "linux")]
    return &locations.linux;

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    return "";
}

// Common game installation directories
const STEAM_PATHS: &[&str] = &[
    "~/Library/Application Support/Steam/steamapps/common", // macOS
    "~/.steam/steam/steamapps/common",                      // Linux
    "C:\\Program Files (x86)\\Steam\\steamapps\\common",    // Windows
];

// Steam installation paths (for finding libraryfolders.vdf)
const STEAM_ROOT_PATHS: &[&str] = &[
    "~/Library/Application Support/Steam", // macOS
    "~/.steam/steam",                      // Linux
    "~/.local/share/Steam",                // Linux alternative
    "C:\\Program Files (x86)\\Steam",      // Windows
    "C:\\Program Files\\Steam",            // Windows alternative
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
        if path.len() >= 3 && path.chars().nth(1) == Some(':') && path.chars().nth(2) == Some('\\')
        {
            return PathBuf::from(path);
        }
    }

    PathBuf::from(path)
}

// Structure to hold library info with installed games
#[derive(Debug)]
struct SteamLibrary {
    path: PathBuf,
    installed_app_ids: Vec<String>,
}

// Parse Steam's libraryfolders.vdf to find all Steam library locations and installed games
fn get_steam_libraries_with_games() -> Vec<SteamLibrary> {
    let mut libraries = Vec::new();

    // Try to find and parse libraryfolders.vdf
    for steam_root in STEAM_ROOT_PATHS {
        let steam_path = expand_tilde(steam_root);
        let vdf_path = steam_path.join("steamapps").join("libraryfolders.vdf");

        println!("Checking for Steam library config at: {:?}", vdf_path);

        if vdf_path.exists() {
            println!("Found libraryfolders.vdf at: {:?}", vdf_path);
            if let Ok(content) = fs::read_to_string(&vdf_path) {
                let mut current_library_path: Option<PathBuf> = None;
                let mut current_apps: Vec<String> = Vec::new();
                let mut in_apps_section = false;

                for line in content.lines() {
                    let trimmed = line.trim();

                    // Check if we're entering an "apps" section
                    if trimmed == "\"apps\"" {
                        in_apps_section = true;
                        continue;
                    }

                    // Check if we're exiting an apps section
                    if in_apps_section && trimmed == "}" {
                        in_apps_section = false;

                        // Save the library if we have a path and apps
                        if let Some(path) = current_library_path.take() {
                            let library_path = path.join("steamapps").join("common");
                            if library_path.exists() {
                                libraries.push(SteamLibrary {
                                    path: library_path,
                                    installed_app_ids: current_apps.clone(),
                                });
                            }
                        }
                        current_apps.clear();
                        continue;
                    }

                    // Parse path
                    if trimmed.contains("\"path\"") && trimmed.contains("\"") {
                        if let Some(path_start) = trimmed.rfind("\"") {
                            if let Some(value_start) = trimmed[..path_start].rfind("\"") {
                                let path_str = &trimmed[value_start + 1..path_start];
                                let cleaned_path = path_str.replace("\\\\", "\\");
                                current_library_path = Some(PathBuf::from(cleaned_path));
                            }
                        }
                    }

                    // Parse app IDs inside apps section
                    if in_apps_section && trimmed.contains("\"") {
                        // Extract app ID (first quoted value)
                        if let Some(first_quote) = trimmed.find("\"") {
                            if let Some(second_quote) = trimmed[first_quote + 1..].find("\"") {
                                let app_id =
                                    &trimmed[first_quote + 1..first_quote + 1 + second_quote];
                                if !app_id.is_empty() && app_id.chars().all(|c| c.is_digit(10)) {
                                    current_apps.push(app_id.to_string());
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

    println!("Total Steam libraries found: {}", libraries.len());
    for lib in &libraries {
        println!(
            "Library: {:?}, Games: {:?}",
            lib.path, lib.installed_app_ids
        );
    }

    // Fallback to default paths if no libraries found
    if libraries.is_empty() {
        for path in STEAM_PATHS {
            let expanded = expand_tilde(path);
            if expanded.exists() {
                libraries.push(SteamLibrary {
                    path: expanded,
                    installed_app_ids: Vec::new(), // Will scan all folders
                });
            }
        }
    }

    libraries
}

// Get game info from Steam app manifest
fn get_steam_game_info(library_path: &PathBuf, app_id: &str) -> Option<(String, String)> {
    // Go back to steamapps folder from common folder
    if let Some(steamapps_path) = library_path.parent() {
        let manifest_path = steamapps_path.join(format!("appmanifest_{}.acf", app_id));

        if manifest_path.exists() {
            if let Ok(content) = fs::read_to_string(&manifest_path) {
                let mut name = None;
                let mut installdir = None;
                
                // Simple parser for ACF format
                for line in content.lines() {
                    let trimmed = line.trim();
                    
                    // Parse name field
                    if trimmed.contains("\"name\"") && trimmed.contains("\"") {
                        if let Some(name_start) = trimmed.rfind("\"") {
                            if let Some(value_start) = trimmed[..name_start].rfind("\"") {
                                name = Some(trimmed[value_start + 1..name_start].to_string());
                            }
                        }
                    }
                    
                    // Parse installdir field
                    if trimmed.contains("\"installdir\"") && trimmed.contains("\"") {
                        if let Some(dir_start) = trimmed.rfind("\"") {
                            if let Some(value_start) = trimmed[..dir_start].rfind("\"") {
                                installdir = Some(trimmed[value_start + 1..dir_start].to_string());
                            }
                        }
                    }
                }
                
                // Return both if we found them
                if let (Some(n), Some(d)) = (name, installdir) {
                    return Some((n, d));
                }
            }
        }
    }
    None
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

fn scan_save_locations(
    steam_id: &str,
    game_config: &HashMap<String, GameEntry>,
) -> Vec<SaveLocation> {
    let mut save_locations = Vec::new();

    // Look up game by steam_id
    if let Some(game_info) = game_config.get(steam_id) {
        // Get platform-specific save location
        let save_location = get_platform_save_location(&game_info.save_locations);

        if !save_location.is_empty() {
            // Store the original pattern (before expansion) for proper wildcard handling
            let original_pattern = save_location.to_string();
            let expanded_path = expand_tilde(save_location);

            // Check if path contains wildcard *
            if save_location.contains("*") {
                // Use glob to find all matching paths
                let glob_path = expanded_path.to_string_lossy().into_owned();
                if let Ok(paths) = glob(&glob_path) {
                    let mut found_any = false;
                    for path_result in paths {
                        if let Ok(path) = path_result {
                            if path.is_dir() {
                                scan_location_with_patterns(
                                    &path,
                                    &game_info.save_pattern,
                                    &mut save_locations,
                                );
                                found_any = true;
                            }
                        }
                    }
                    // If we found locations, update the first one with the original pattern
                    if found_any && !save_locations.is_empty() {
                        save_locations[0].path = original_pattern.clone();
                    }
                }
            } else {
                // No wildcard, check path directly
                if expanded_path.exists() {
                    scan_location_with_patterns(
                        &expanded_path,
                        &game_info.save_pattern,
                        &mut save_locations,
                    );
                    // Store the original pattern for consistency
                    if !save_locations.is_empty() {
                        save_locations[0].path = original_pattern;
                    }
                }
            }
        }
    }

    save_locations
}

// Helper function to scan a location with given patterns
fn scan_location_with_patterns(
    path: &PathBuf,
    patterns: &[String],
    save_locations: &mut Vec<SaveLocation>,
) {
    let mut total_size = 0u64;
    let mut file_count = 0;
    let mut latest_modified = std::time::SystemTime::UNIX_EPOCH;

    // Check if pattern is "*" - meaning backup whole directory
    if patterns.len() == 1 && patterns[0] == "*" {
        // Scan all files in the directory
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.filter_map(Result::ok) {
                if let Ok(metadata) = entry.metadata() {
                    if metadata.is_file() {
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
    } else {
        // Use glob patterns for specific file types
        for pattern in patterns {
            let glob_pattern = path.join(pattern).to_string_lossy().into_owned();
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
    }

    if file_count > 0 || (patterns.len() == 1 && patterns[0] == "*") {
        let last_modified = if latest_modified > std::time::SystemTime::UNIX_EPOCH {
            chrono::DateTime::<chrono::Local>::from(latest_modified)
                .format("%Y-%m-%d %H:%M:%S")
                .to_string()
        } else {
            "Unknown".to_string()
        };

        save_locations.push(SaveLocation {
            path: path.to_string_lossy().into_owned(),
            file_count,
            total_size: format_size(total_size),
            last_modified,
        });
    }
}

#[tauri::command]
pub async fn scan_games() -> Result<HashMap<String, GameInfo>, String> {
    println!("Starting game scan...");
    println!("Operating System: {}", std::env::consts::OS);

    let mut games = HashMap::new();

    // Load save game configuration
    let config_path = get_save_config_path();
    println!("Loading save game config from: {:?}", config_path);

    let game_config: HashMap<String, GameEntry> = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| {
            println!("Error parsing config: {}", e);
            e.to_string()
        })?,
        Err(e) => {
            println!("Error reading config: {}", e);
            // Return empty config as fallback
            HashMap::new()
        }
    };

    // Scan Steam games from all library folders using VDF data
    let steam_libraries = get_steam_libraries_with_games();
    println!("Found {} Steam library folders", steam_libraries.len());

    for library in steam_libraries {
        println!("Scanning Steam library: {:?}", library.path);

        if library.installed_app_ids.is_empty() {
            // Fallback: scan all directories if no app IDs found
            println!("No app IDs found, scanning all directories in library");
            if library.path.exists() {
                if let Ok(entries) = fs::read_dir(&library.path) {
                    for entry in entries.filter_map(|e| e.ok()) {
                        if entry.path().is_dir() {
                            if let Ok(game_name) = entry.file_name().into_string() {
                                let game_path = entry.path();
                                println!("Found game directory: {} at {:?}", game_name, game_path);
                                let size = get_directory_size(&game_path);
                                // Try to find game by name in config
                                let game_entry = game_config
                                    .values()
                                    .find(|entry| entry.name.eq_ignore_ascii_case(&game_name));

                                let (game_id, save_locations, category) = if let Some(entry) =
                                    game_entry
                                {
                                    let locations =
                                        scan_save_locations(&entry.steam_id, &game_config);
                                    (entry.steam_id.clone(), locations, "Action".to_string())
                                } else {
                                    // Game not in config, use empty save locations
                                    let game_id =
                                        game_name.to_lowercase().replace(" ", "_").replace(":", "");
                                    (game_id, Vec::new(), "Unknown".to_string())
                                };

                                let save_count =
                                    save_locations.iter().map(|loc| loc.file_count).sum();
                                // let cover_image = format!("https://cdn.cloudflare.steamstatic.com/steam/apps/{}/hero_capsule.jpg",
                                let cover_image = format!("https://steamcdn-a.akamaihd.net/steam/apps/{}/library_600x900_2x.jpg",   
                                    if game_id.chars().all(|c| c.is_numeric()) { &game_id } else { "1245620" });

                                games.insert(
                                    game_id.clone(),
                                    GameInfo {
                                        id: game_id,
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
        } else {
            // Use app IDs from VDF to scan only installed games
            println!(
                "Found {} installed games in library",
                library.installed_app_ids.len()
            );
            for app_id in &library.installed_app_ids {
                // Try to get game info from manifest
                if let Some((game_name, install_dir)) = get_steam_game_info(&library.path, app_id) {
                    let game_path = library.path.join(&install_dir);

                    if game_path.exists() {
                        println!(
                            "Found game: {} (App ID: {}) at {:?}",
                            game_name, app_id, game_path
                        );
                        let size = get_directory_size(&game_path);
                        // Check if game exists in config with this steam_id
                        let save_locations = scan_save_locations(app_id, &game_config);
                        let save_count = save_locations.iter().map(|loc| loc.file_count).sum();

                        // Get game info from config if available
                        let category = if game_config.contains_key(app_id) {
                            "Action".to_string() // Default category for now
                        } else {
                            "Unknown".to_string()
                        };

                        // let cover_image = format!(
                        //     "https://cdn.cloudflare.steamstatic.com/steam/apps/{}/hero_capsule.jpg",
                        //     app_id
                        // );
                        let cover_image = format!(
                            "https://steamcdn-a.akamaihd.net/steam/apps/{}/library_600x900_2x.jpg",
                            app_id
                        );

                        games.insert(
                            app_id.clone(),
                            GameInfo {
                                id: app_id.clone(),
                                title: game_name,
                                cover_image,
                                platform: "Steam".to_string(),
                                last_played: save_locations
                                    .first()
                                    .map_or("Never".to_string(), |loc| loc.last_modified.clone()),
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
                    } else {
                        println!(
                            "Game directory not found for: {} (App ID: {})",
                            game_name, app_id
                        );
                    }
                } else {
                    println!("Could not get game name for App ID: {}", app_id);
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
                                        // Get Epic App Name (ID) from manifest
                                        let epic_app_name = json["AppName"].as_str().unwrap_or("");

                                        // Try to find game in config by name
                                        let game_entry = game_config.values().find(|entry| {
                                            entry.name.eq_ignore_ascii_case(display_name)
                                        });

                                        let (game_id, save_locations, category) =
                                            if let Some(entry) = game_entry {
                                                let locations = scan_save_locations(
                                                    &entry.steam_id,
                                                    &game_config,
                                                );
                                                (
                                                    format!("epic_{}", entry.steam_id),
                                                    locations,
                                                    "Action".to_string(),
                                                )
                                            } else {
                                                // Game not in config
                                                let game_id = if !epic_app_name.is_empty() {
                                                    format!("epic_{}", epic_app_name)
                                                } else {
                                                    format!(
                                                        "epic_{}",
                                                        display_name
                                                            .to_lowercase()
                                                            .replace(" ", "_")
                                                            .replace(":", "")
                                                    )
                                                };
                                                (game_id, Vec::new(), "Unknown".to_string())
                                            };

                                        let save_count =
                                            save_locations.iter().map(|loc| loc.file_count).sum();
                                        // let cover_image = "https://cdn.cloudflare.steamstatic.com/steam/apps/1551360/hero_capsule.jpg".to_string();
                                        let cover_image = format!("https://steamcdn-a.akamaihd.net/steam/apps/{}/library_600x900_2x.jpg", game_id);

                                        games.insert(
                                            game_id.clone(),
                                            GameInfo {
                                                id: game_id,
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
    let game_config: HashMap<String, GameEntry> = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| e.to_string())?,
        Err(e) => return Err(format!("Failed to read save game configuration: {}", e)),
    };

    // Extract steam_id from game_id (remove epic_ prefix if present)
    let steam_id = if game_id.starts_with("epic_") {
        game_id.strip_prefix("epic_").unwrap_or(&game_id)
    } else {
        &game_id
    };

    let game_info = game_config
        .get(steam_id)
        .ok_or_else(|| format!("Game not found: {}", game_id))?;

    // Get platform-specific save location
    let save_location = get_platform_save_location(&game_info.save_locations);

    if !save_location.is_empty() {
        let expanded_path = expand_tilde(save_location);

        if save_location.contains("*") {
            // Handle wildcard paths
            let glob_path = expanded_path.to_string_lossy().into_owned();
            if let Ok(paths) = glob(&glob_path) {
                for path_result in paths {
                    if let Ok(path) = path_result {
                        if path.is_dir() {
                            // Try exact match first
                            let exact_path = path.join(&save_id);
                            if exact_path.exists() {
                                match fs::remove_file(&exact_path) {
                                    Ok(_) => found = true,
                                    Err(e) => last_error = Some(e.to_string()),
                                }
                            } else {
                                // Try patterns
                                for pattern in &game_info.save_pattern {
                                    let glob_pattern =
                                        path.join(pattern).to_string_lossy().into_owned();
                                    if let Ok(entries) = glob(&glob_pattern) {
                                        for entry in entries.filter_map(Result::ok) {
                                            if let Some(file_name) = entry.file_name() {
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
                }
            }
        } else {
            // No wildcard, handle normally
            if expanded_path.exists() {
                let exact_path = expanded_path.join(&save_id);
                if exact_path.exists() {
                    match fs::remove_file(&exact_path) {
                        Ok(_) => found = true,
                        Err(e) => last_error = Some(e.to_string()),
                    }
                } else {
                    for pattern in &game_info.save_pattern {
                        let glob_pattern =
                            expanded_path.join(pattern).to_string_lossy().into_owned();
                        if let Ok(entries) = glob(&glob_pattern) {
                            for entry in entries.filter_map(Result::ok) {
                                if let Some(file_name) = entry.file_name() {
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
    let game_config: HashMap<String, GameEntry> = match fs::read_to_string(&config_path) {
        Ok(content) => serde_json::from_str(&content).map_err(|e| e.to_string())?,
        Err(e) => return Err(format!("Failed to read save game configuration: {}", e)),
    };

    // Extract steam_id from game_id
    let steam_id = if game_id.starts_with("epic_") {
        game_id.strip_prefix("epic_").unwrap_or(game_id)
    } else {
        game_id
    };

    let game_info = game_config
        .get(steam_id)
        .ok_or_else(|| format!("Game not found: {}", game_id))?;

    let mut save_files = Vec::new();

    // Get platform-specific save location
    let save_location = get_platform_save_location(&game_info.save_locations);

    if !save_location.is_empty() {
        let expanded_path = expand_tilde(save_location);

        if save_location.contains("*") {
            // Handle wildcard paths
            let glob_path = expanded_path.to_string_lossy().into_owned();
            if let Ok(paths) = glob(&glob_path) {
                for path_result in paths {
                    if let Ok(path) = path_result {
                        if path.is_dir() {
                            for pattern in &game_info.save_pattern {
                                let glob_pattern =
                                    path.join(pattern).to_string_lossy().into_owned();
                                if let Ok(entries) = glob(&glob_pattern) {
                                    for entry in entries.filter_map(Result::ok) {
                                        if let Some(file_name) = entry.file_name() {
                                            save_files
                                                .push(file_name.to_string_lossy().into_owned());
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // No wildcard
            if expanded_path.exists() {
                for pattern in &game_info.save_pattern {
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

// Helper function to delete saves in a directory
fn delete_saves_in_directory(path: &PathBuf, patterns: &[String], errors: &mut Vec<String>) {
    for pattern in patterns {
        let glob_pattern = path.join(pattern).to_string_lossy().into_owned();
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
    if path.exists() {
        match fs::read_dir(&path) {
            Ok(mut dir) => {
                if dir.next().is_none() {
                    // Directory is empty
                    if let Err(e) = fs::remove_dir(&path) {
                        println!("Failed to remove empty directory {}: {}", path.display(), e);
                    } else {
                        println!("Successfully removed empty directory: {:?}", path);
                    }
                }
            }
            Err(e) => println!("Failed to read directory {}: {}", path.display(), e),
        }
    }
}

#[tauri::command]
pub async fn delete_game_saves(game_id: String) -> Result<(), String> {
    println!("Attempting to delete BACKUP saves for game: {}", game_id);
    let mut errors = Vec::new();

    // IMPORTANT: Only delete backup directory, NOT original save files
    // Original save files should remain untouched

    // Delete from backup directory only
    let backup_dir = get_backup_dir().join(&game_id);
    println!("Deleting backup directory: {:?}", backup_dir);

    if backup_dir.exists() {
        if let Err(e) = fs::remove_dir_all(&backup_dir) {
            let error_msg = format!("Failed to delete backup directory: {}", e);
            println!("Error: {}", error_msg);
            errors.push(error_msg);
        } else {
            println!("Successfully deleted backup directory");
        }
    } else {
        println!("Backup directory does not exist: {:?}", backup_dir);
    }

    if !errors.is_empty() {
        Err(errors.join("\n"))
    } else {
        println!("Successfully deleted backup saves for game: {}", game_id);
        Ok(())
    }
}
