// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod commands;
pub mod db;
pub mod error;
pub mod game_scanner;
pub mod save_manager;
pub mod utils;

use commands::*;
use db::{init_database, SqliteGameRepository};
use game_scanner::GameScanner;
use save_manager::SaveManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize database on startup
    if let Err(e) = init_database() {
        eprintln!("Failed to initialize database: {}", e);
        std::process::exit(1);
    }

    let game_scanner = GameScanner::new(SqliteGameRepository::new());
    let save_manager = SaveManager::new(SqliteGameRepository::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(game_scanner)
        .manage(save_manager)
        .invoke_handler(tauri::generate_handler![
            // Game Scanner Commands
            scan_games,
            import_custom_game,
            delete_game,
            toggle_favorite,
            delete_game_saves,
            delete_save_file,
            scan_installed_games,
            import_game,
            get_game_detail,
            // Save Manager Commands
            backup_save,
            list_saves,
            restore_save,
            save_backup_settings,
            load_backup_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
