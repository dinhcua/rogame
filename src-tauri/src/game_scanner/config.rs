use crate::error::Result;
use serde::Deserialize;
use std::{collections::HashMap, fs, path::Path};

#[derive(Debug, Deserialize)]
pub struct SaveGameConfig {
    pub games: HashMap<String, GameConfig>,
}

#[derive(Debug, Deserialize)]
pub struct GameConfig {
    pub locations: Vec<String>,
    pub patterns: Vec<String>,
    pub cover_image: String,
    pub category: String,
}

impl SaveGameConfig {
    pub fn load(path: &Path) -> Result<Self> {
        let content = fs::read_to_string(path)?;
        let config = serde_json::from_str(&content)?;
        Ok(config)
    }
}