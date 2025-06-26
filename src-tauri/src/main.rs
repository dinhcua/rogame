// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod error;
mod game_scanner;
mod save_manager;
mod utils;

use commands::*;
use db::{init_database, SqliteGameRepository};
use game_scanner::GameScanner;
use save_manager::SaveManager;

fn main() {
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
