mod crypto;
mod db;

use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(crypto::VaultState {
            key: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            crypto::lock_vault,
            db::init_db,
            db::has_vaults,
            db::list_vaults,
            db::create_vault,
            db::unlock_vault_by_id,
            db::check_lockout,
            db::clear_attempts,
            db::register_failure,
            db::list_entries,
            db::get_entry_for_edit,
            db::decrypt_entry_field,
            db::save_entry,
            db::import_entry,
            db::toggle_entry_favorite,
            db::delete_entry,
            db::update_entry_tags,
            db::ensure_vault_settings,
            db::get_vault_settings,
            db::update_vault_setting
        ])
        .setup(|app| {
            let db_state = tauri::async_runtime::block_on(db::connect(app.handle()))?;
            app.manage(db_state);
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
