use tauri::{Builder, Wry, App};

pub fn build_plugins(builder: Builder<Wry>) -> Builder<Wry> {
    builder.plugin(tauri_plugin_haptics::init())
}

pub fn handle_window_event(builder: Builder<Wry>) -> Builder<Wry> {
    builder
}

pub fn handle_setup_event(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    // 移动端独有的初始化，例如设置 VPN 相关的状态
    log::info!("正在初始化移动端环境...");

    Ok(())
}

fn get_handlers() -> impl Fn(tauri::ipc::Invoke<tauri::Wry>) -> bool {
    tauri::generate_handler![logger::flush_logs, logger::get_logs_page,]
}