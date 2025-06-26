use crate::db::SqliteGameRepository;
use crate::save_manager::{BackupResponse, BackupSettings, SaveFile, SaveFileError, SaveManager};
use tauri::State;

#[tauri::command]
pub async fn backup_save(
    manager: State<'_, SaveManager<SqliteGameRepository>>,
    game_id: String,
) -> Result<BackupResponse, SaveFileError> {
    manager.backup_save(game_id).await.map_err(|e| SaveFileError {
        message: e.to_string(),
    })
}

#[tauri::command]
pub async fn restore_save(
    manager: State<'_, SaveManager<SqliteGameRepository>>,
    game_id: String,
    save_id: String,
) -> Result<SaveFile, SaveFileError> {
    manager.restore_save(game_id, save_id).await.map_err(|e| SaveFileError {
        message: e.to_string(),
    })
}

#[tauri::command]
pub async fn list_saves(
    manager: State<'_, SaveManager<SqliteGameRepository>>,
    game_id: String,
) -> Result<Vec<SaveFile>, SaveFileError> {
    manager.list_saves(game_id).await.map_err(|e| SaveFileError {
        message: e.to_string(),
    })
}

#[tauri::command]
pub async fn save_backup_settings(
    manager: State<'_, SaveManager<SqliteGameRepository>>,
    settings: BackupSettings,
) -> Result<(), SaveFileError> {
    manager.save_backup_settings(settings).await.map_err(|e| SaveFileError {
        message: e.to_string(),
    })
}

#[tauri::command]
pub async fn load_backup_settings(
    manager: State<'_, SaveManager<SqliteGameRepository>>,
) -> Result<BackupSettings, SaveFileError> {
    manager.load_backup_settings().await.map_err(|e| SaveFileError {
        message: e.to_string(),
    })
}