use tauri::{App, Builder, Manager, WindowEvent, Wry};

use crate::engine::trojan;
use crate::engine::trojan::TrojanState;
use crate::logger;
use crate::tray;
use std::sync::Mutex;

pub fn build_plugins(builder: Builder<Wry>) -> Builder<Wry> {
    builder
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app
                .get_webview_window("puppet4105")
                .expect("no main window")
                .set_focus();
        }))
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
}

pub fn handle_window_event(builder: Builder<Wry>) -> Builder<Wry> {
    builder.on_window_event(|window, event| {
        match event {
            // 处理窗口关闭请求：隐藏窗口到后台，阻止真正关闭
            WindowEvent::CloseRequested { api, .. } => {
                log::info!("用户请求关闭窗口，隐藏到后台");
                api.prevent_close(); // 阻止窗口关闭
                let _ = window.hide(); // 隐藏窗口（忽略可能的错误，或按需处理）
            }

            // 处理窗口焦点事件：解决黑屏唤醒卡死问题
            WindowEvent::Focused(focused) => {
                if *focused {
                    // log::info!("窗口获得焦点，唤醒 Webview 渲染");
                    // 执行 JS 激活渲染循环
                    // let _ = window.run_javascript("window.requestAnimationFrame(() => { console.log('resume'); })");
                }
            }

            // 其他未匹配的事件：忽略（或按需打印 debug 日志）
            _ => {
                // 仅在 debug 模式打印次要事件，避免日志刷屏
                // log::debug!("未处理的窗口事件: {:?}", event);
            }
        }
    })
}

pub fn handle_setup_event(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let salt_path = app
        .path()
        .app_local_data_dir()
        .expect("could not resolve app local data path")
        .join("salt.txt");

    // 使用 Stronghold 插件，传递 salt_path
    app.handle()
        .plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;

    // 初始化 TrojanState
    app.manage(TrojanState {
        child: Mutex::new(None),
        current_config_name: Mutex::new(None),
    });

    // 创建托盘程序
    tray::create_tray(app)?;

    Ok(())
}

pub fn get_handlers() -> impl Fn(tauri::ipc::Invoke<tauri::Wry>) -> bool {
    tauri::generate_handler![
        trojan::run_trojan,
        trojan::stop_trojan,
        trojan::get_trojan_status,
        logger::flush_logs,
        logger::get_logs_page,
    ]
}
