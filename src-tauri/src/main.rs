// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
async fn scan_music_dir(path: String) -> Result<Vec<String>, String> {
    let mut music_files = Vec::new();
    let entries = std::fs::read_dir(path).map_err(|e| e.to_string())?;

    for entry in entries {
        if let Ok(entry) = entry {
            if let Some(extension) = entry.path().extension() {
                if extension == "mp3" || extension == "wav" || extension == "flac" {
                    if let Some(path_str) = entry.path().to_str() {
                        music_files.push(path_str.to_string());
                    }
                }
            }
        }
    }

    Ok(music_files)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![scan_music_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
