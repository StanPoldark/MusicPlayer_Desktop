#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::command;
#[derive(serde::Serialize)]
struct AudioData {
    content_type: String,
    data: Vec<u8>,
}
/// 代理音频请求的命令
#[command]
async fn proxy_audio(url: String) -> Result<AudioData, String> {
    // 创建带超时的 HTTP 客户端
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    // 发起 GET 请求
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;

    // 获取 Content-Type
    let content_type = response
        .headers()
        .get("Content-Type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("audio/mpeg")
        .to_string();

    // 检查内容类型
    if !content_type.starts_with("audio/") && content_type != "application/octet-stream;charset=UTF-8" {
        return Err(format!("Unsupported audio format: {}", content_type));
    }

    // 获取音频字节数据
    let audio_bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read audio response: {}", e))?
        .to_vec();

    // 返回结构化数据
    Ok(AudioData {
        content_type,
        data: audio_bytes,
    })
}

/// 扫描音乐目录的命令
#[command]
async fn scan_music_dir(path: String) -> Result<Vec<String>, String> {
    let mut music_files = Vec::new();

    // 读取目录内容
    let entries = std::fs::read_dir(&path).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in entries {
        if let Ok(entry) = entry {
            // 检查文件扩展名
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

/// 主函数
fn main() {
    tauri::Builder::default()
        // 插件初始化
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        // 注册命令
        .invoke_handler(tauri::generate_handler![proxy_audio, scan_music_dir])
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
