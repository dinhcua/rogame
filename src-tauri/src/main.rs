// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod game_scanner;
mod save_manager;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            game_scanner::scan_games,
            game_scanner::delete_game_saves,
            game_scanner::delete_save_file,
            save_manager::backup_save,
            save_manager::list_saves,
            save_manager::restore_save,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
