use crate::db::SqliteGameRepository;
use crate::game_scanner::{CustomGameInfo, GameInfo, GameScanner};
use std::collections::HashMap;
use tauri::State;

#[tauri::command]
pub async fn scan_games(
    scanner: State<'_, GameScanner<SqliteGameRepository>>,
) -> Result<HashMap<String, GameInfo>, String> {
    scanner.scan_games().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn scan_installed_games(
    scanner: State<'_, GameScanner<SqliteGameRepository>>,
) -> Result<HashMap<String, GameInfo>, String> {
    scanner.scan_installed_games().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn import_custom_game(
    scanner: State<'_, GameScanner<SqliteGameRepository>>,
    game_info: CustomGameInfo,
) -> Result<GameInfo, String> {
    scanner.import_custom_game(game_info).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn import_game(
    scanner: State<'_, GameScanner<SqliteGameRepository>>,
    game: GameInfo,
) -> Result<GameInfo, String> {
    scanner.import_game(game).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_game_detail(
    scanner: State<'_, GameScanner<SqliteGameRepository>>,
    game_id: String,
) -> Result<GameInfo, String> {
    scanner.get_game_detail(game_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_game(
    scanner: State<'_, GameScanner<SqliteGameRepository>>,
    game_id: String,
) -> Result<(), String> {
    scanner.delete_game(game_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn toggle_favorite(
    scanner: State<'_, GameScanner<SqliteGameRepository>>,
    game_id: String,
) -> Result<(), String> {
    scanner.toggle_favorite(game_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_save_file(
    scanner: State<'_, GameScanner<SqliteGameRepository>>,
    game_id: String,
    save_id: String,
) -> Result<(), String> {
    scanner.delete_save_file(game_id, save_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_game_saves(
    scanner: State<'_, GameScanner<SqliteGameRepository>>,
    game_id: String,
) -> Result<(), String> {
    scanner.delete_game_saves(game_id).await.map_err(|e| e.to_string())
}