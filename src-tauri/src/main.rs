// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crate::game_scanner::*;
use crate::save_manager::*;

mod game_scanner;
mod save_manager;
mod db;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // Game Scanner Commands
            scan_games,
            add_custom_game,
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
