// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod game_scanner;
pub mod save_manager;
pub mod db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            game_scanner::scan_games,
            game_scanner::scan_installed_games,
            game_scanner::import_custom_game,
            game_scanner::import_game,
            game_scanner::delete_save_file,
            game_scanner::delete_game_saves,
            game_scanner::delete_game,
            game_scanner::toggle_favorite,
            save_manager::backup_save,
            save_manager::restore_save,
            save_manager::list_saves,
            save_manager::save_backup_settings,
            save_manager::load_backup_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
