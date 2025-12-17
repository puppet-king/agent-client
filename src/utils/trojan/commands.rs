use tauri::{AppHandle, State, Manager, path::BaseDirectory};
use crate::trojan::process::TrojanState;
use std::process::Command;

#[tauri::command]
pub async fn start_trojan(
    app: AppHandle,
    state: State<'_, TrojanState>,
    config_path: String,
) -> Result<(), String> {
    let mut guard = state.child.lock().await;

    if guard.is_some() {
        return Err("trojan already running".into());
    }

    // 使用最新 Tauri API 获取资源路径
      let salt_path = app
          .path()
          .app_local_data_dir()
          .expect("could not resolve app local data path")
          .join("salt.txt");

      println!("salt_path: {}", salt_path)


    let trojan_path = app.path()
        .resolve("trojan-go", BaseDirectory::Resource)
        .ok_or("trojan-go not found")?;

    let child = Command::new(trojan_path)
        .args(["-config", &config_path])
        .spawn()
        .map_err(|e| e.to_string())?;

    *guard = Some(child);

    Ok(())
}
