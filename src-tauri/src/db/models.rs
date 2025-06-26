use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Game {
    pub id: String,
    pub title: String,
    pub cover_image: String,
    pub platform: String,
    pub last_played: String,
    pub save_count: i32,
    pub size: String,
    pub status: String,
    pub category: String,
    pub is_favorite: bool,
    pub save_location: String,
    pub backup_location: Option<String>,
    pub last_backup_time: Option<i64>,
}

#[derive(Debug, Clone)]
pub struct SaveLocation {
    pub game_id: String,
    pub path: String,
    pub pattern: String,
}

impl Game {
    pub fn new(id: String, title: String, platform: String) -> Self {
        Self {
            id,
            title,
            cover_image: String::new(),
            platform,
            last_played: "Never".to_string(),
            save_count: 0,
            size: "0B".to_string(),
            status: "no_saves".to_string(),
            category: "Unknown".to_string(),
            is_favorite: false,
            save_location: String::new(),
            backup_location: None,
            last_backup_time: None,
        }
    }
}