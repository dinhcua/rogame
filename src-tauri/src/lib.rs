// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod cloud_tokens;
mod db;
mod game_scanner;
mod save_manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            game_scanner::scan_games,
            game_scanner::delete_game_saves,
            game_scanner::delete_save_file,
            save_manager::backup_save,
            save_manager::restore_save,
            save_manager::list_saves,
            save_manager::save_backup_settings,
            save_manager::load_backup_settings,
            save_manager::get_all_games,
            save_manager::get_game_by_id,
            save_manager::add_game,
            save_manager::update_game,
            save_manager::delete_game,
            save_manager::toggle_favorite,
            save_manager::sync_game_to_db,
            save_manager::add_game_to_library,
            cloud_tokens::save_cloud_token,
            cloud_tokens::get_cloud_token,
            cloud_tokens::delete_cloud_token,
            cloud_tokens::get_all_cloud_tokens
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
