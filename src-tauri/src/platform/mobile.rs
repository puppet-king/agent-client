use crate::logger;
use std::fs;
use tauri::{App, AppHandle, Builder, Runtime, Wry};
use tauri_plugin_vpn_helper::{PingRequest, StartVpnRequest, VpnHelperExt};

pub fn build_plugins(builder: Builder<Wry>) -> Builder<Wry> {
    builder
        .plugin(tauri_plugin_haptics::init())
        .plugin(tauri_plugin_vpn_helper::init())
}

pub fn handle_window_event(builder: Builder<Wry>) -> Builder<Wry> {
    builder
}

pub fn handle_setup_event(_app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    // 移动端独有的初始化，例如设置 VPN 相关的状态
    log::info!("正在初始化移动端环境...");

    Ok(())
}

pub fn get_handlers() -> impl Fn(tauri::ipc::Invoke<tauri::Wry>) -> bool {
    tauri::generate_handler![
        logger::flush_logs,
        logger::get_logs_page,
        debug_vpn_connection,
        start_vpn, // 新增
        stop_vpn   // 新增
    ]
}

#[tauri::command]
pub async fn debug_vpn_connection<R: Runtime>(app: AppHandle<R>) -> Result<String, String> {
    log::info!("Rust 层: 准备调用插件...");

    // 构造请求参数
    let payload = PingRequest {
        value: Some("来自主项目的调试".into()),
    };

    // 3. 直接通过 .vpn_helper() 调用插件的实例方法
    // 注意：这里调用的是 VpnHelper 结构体上的 pub fn ping，而不是 commands 里的 ping
    let response = app.vpn_helper().ping(payload).map_err(|e| e.to_string())?;

    Ok(format!("Android 响应: {:?}", response.value))
}

#[tauri::command]
pub async fn start_vpn<R: Runtime>(
    app: AppHandle<R>,
    config_path: String,
) -> Result<String, String> {
    log::info!("Rust 层: 正在读取配置并启动 VPN, 路径: {}", config_path);

    // 1. 从前端传入的绝对路径读取 JSON 内容
    let config_content =
        fs::read_to_string(&config_path).map_err(|e| format!("无法读取配置文件: {}", e))?;

    // 2. 构造插件所需的 Payload
    let payload = StartVpnRequest {
        config: config_content, // 假设你的 StartVpnRequest 结构体字段名是 config
    };

    // 3. 调用插件逻辑
    app.vpn_helper()
        .start_vpn(payload)
        .map_err(|e| e.to_string())?;

    Ok("VPN 启动指令已发送".into())
}

#[tauri::command]
pub async fn stop_vpn<R: Runtime>(app: AppHandle<R>) -> Result<String, String> {
    log::info!("Rust 层: 请求停止 VPN");

    // 调用插件的停止逻辑
    app.vpn_helper().stop_vpn().map_err(|e| e.to_string())?;

    Ok("VPN 停止指令已发送".into())
}
