#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod conflict;
mod sqlite_store;
mod sync_engine;

use sync_engine::SyncEngine;

#[tauri::command]
fn sync_health() -> String {
    let engine = SyncEngine::new(sqlite_store::db_path());
    engine.describe()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![sync_health])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
