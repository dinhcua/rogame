use std::fs::{self, create_dir_all};
use std::path::PathBuf;
use chrono::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SaveFile {
    pub id: String,
    pub game_id: String,
    pub file_name: String,
    pub created_at: String,
    pub modified_at: String,
    pub size_bytes: u64,
    pub tags: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct SaveFileError {
    pub message: String,
}

impl SaveFile {
    pub fn new(game_id: String, file_name: String, size_bytes: u64) -> Self {
        let now = Utc::now().to_rfc3339();
        Self {
            id: file_name.clone(),
            game_id,
            file_name,
            created_at: now.clone(),
            modified_at: now,
            size_bytes,
            tags: Vec::new(),
        }
    }
}

#[tauri::command]
pub async fn restore_save(game_id: String, save_id: String) -> Result<SaveFile, SaveFileError> {
    println!("Attempting to restore save. Game ID: {}, Save ID: {}", game_id, save_id);
    
    let saves_dir = get_saves_directory()?;
    let game_saves_dir = saves_dir.join(&game_id);

    println!("Game saves directory: {:?}", game_saves_dir);

    let save_path = game_saves_dir.join(&save_id);
    println!("Save file path: {:?}", save_path);

    if !save_path.exists() {
        return Err(SaveFileError {
            message: format!("Save file not found at path: {:?}", save_path),
        });
    }

    let metadata = fs::metadata(&save_path).map_err(|e| SaveFileError {
        message: format!("Failed to read save file metadata: {}", e),
    })?;

    println!("Successfully verified save file. Size: {} bytes", metadata.len());

    Ok(SaveFile::new(game_id, save_id, metadata.len()))
}

#[tauri::command]
pub async fn backup_save(game_id: String) -> Result<SaveFile, SaveFileError> {
    let saves_dir = get_saves_directory()?;
    let game_saves_dir = saves_dir.join(&game_id);
    
    // Create game saves directory if it doesn't exist
    create_dir_all(&game_saves_dir).map_err(|e| SaveFileError {
        message: format!("Failed to create saves directory: {}", e),
    })?;

    // Create a new save file with timestamp
    let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();
    let save_file_name = format!("save_{}.sav", timestamp);
    let save_path = game_saves_dir.join(&save_file_name);

    // TODO: Implement actual save file copying logic here
    // For now, we'll create an empty file
    fs::write(&save_path, "").map_err(|e| SaveFileError {
        message: format!("Failed to create save file: {}", e),
    })?;

    let metadata = fs::metadata(&save_path).map_err(|e| SaveFileError {
        message: format!("Failed to get file metadata: {}", e),
    })?;

    Ok(SaveFile::new(game_id, save_file_name, metadata.len()))
}

#[tauri::command]
pub async fn list_saves(game_id: String) -> Result<Vec<SaveFile>, SaveFileError> {
    let saves_dir = get_saves_directory()?;
    let game_saves_dir = saves_dir.join(&game_id);

    if !game_saves_dir.exists() {
        return Ok(Vec::new());
    }

    let mut saves = Vec::new();
    for entry in fs::read_dir(&game_saves_dir).map_err(|e| SaveFileError {
        message: format!("Failed to read saves directory: {}", e),
    })? {
        let entry = entry.map_err(|e| SaveFileError {
            message: format!("Failed to read directory entry: {}", e),
        })?;
        
        let metadata = entry.metadata().map_err(|e| SaveFileError {
            message: format!("Failed to get file metadata: {}", e),
        })?;

        if metadata.is_file() {
            let file_name = entry.file_name().to_string_lossy().to_string();
            saves.push(SaveFile::new(
                game_id.clone(),
                file_name,
                metadata.len(),
            ));
        }
    }

    Ok(saves)
}

fn get_saves_directory() -> Result<PathBuf, SaveFileError> {
    let app_data_dir = dirs::data_local_dir()
        .ok_or_else(|| SaveFileError {
            message: "Failed to get app data directory".to_string(),
        })?;
    
    Ok(app_data_dir.join("rogame").join("saves"))
} 