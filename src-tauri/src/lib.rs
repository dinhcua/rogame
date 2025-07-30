// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::{Emitter, Manager};
use tauri_plugin_deep_link::DeepLinkExt;

mod cloud_tokens;
mod db;
mod game_scanner;
mod save_manager;
mod security;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    // Setup single instance plugin for desktop to handle deep links
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|_app, argv, _cwd| {
            println!("New app instance opened with args: {:?}", argv);
        }));
    }

    builder
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            game_scanner::scan_games,
            game_scanner::delete_game_saves,
            save_manager::backup_save,
            save_manager::restore_save,
            save_manager::list_saves,
            save_manager::delete_save,
            save_manager::save_backup_settings,
            save_manager::load_backup_settings,
            save_manager::get_all_games,
            save_manager::get_game_by_id,
            save_manager::add_game,
            save_manager::update_game,
            save_manager::delete_game,
            save_manager::toggle_favorite,
            save_manager::add_game_to_library,
            save_manager::add_game_manually,
            save_manager::read_file_as_bytes,
            save_manager::open_save_location,
            save_manager::update_save_cloud_status,
            save_manager::get_saves_directory_path,
            save_manager::create_directory,
            save_manager::write_binary_file,
            save_manager::extract_zip,
            save_manager::add_community_save,
            save_manager::save_community_download,
            save_manager::get_community_saves,
            cloud_tokens::save_cloud_token,
            cloud_tokens::get_cloud_token,
            cloud_tokens::delete_cloud_token
        ])
        .setup(|app| {
            // Setup deep link handler
            let app_handle = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                let urls = event.urls();
                println!("Deep link URLs received: {:?}", urls);

                // Bring the window to front when deep link is received
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.unminimize();
                }

                // Emit deep link events to the frontend
                for url in urls {
                    println!("Processing deep link: {}", url);
                    app_handle.emit("deep-link", url).unwrap();
                }
            });

            // Register deep link schemes for development
            // On Windows and Linux, we need to register the scheme
            #[cfg(any(windows, target_os = "linux"))]
            {
                app.deep_link().register_all()?;
                println!("Deep link schemes registered");
            }

            // macOS automatically registers schemes from Info.plist

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
