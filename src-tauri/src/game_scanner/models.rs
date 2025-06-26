use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GameInfo {
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
}

#[derive(Debug, Deserialize)]
pub struct CustomGameInfo {
    pub title: String,
    pub platform: String,
    pub locations: Vec<String>,
    pub patterns: Vec<String>,
    pub cover_image: String,
    pub category: String,
    pub save_location: String,
}