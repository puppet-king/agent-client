use tauri::{Manager, WindowEvent};
mod logger;
mod tray;
mod trojan;

use crate::trojan::TrojanState;
use std::sync::Mutex;

#[tauri::command]
fn my_custom_command() {
    println!("I was invoked from JavaScript!");
}

// Tauri 入口函数
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder =
        tauri::Builder::default().plugin(tauri_plugin_updater::Builder::new().build());

    // 添加单实例插件
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app
                .get_webview_window("puppet4105")
                .expect("no main window")
                .set_focus();
        }));
    }

    // 注入插件
    builder = builder
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .on_window_event(|window, event| {
            // log::info!("Window event: {:?}", event);

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
        // 使用 argon2 密码哈希函数初始化
        .setup(|app| {
            let salt_path = app
                .path()
                .app_local_data_dir()
                .expect("could not resolve app local data path")
                .join("salt.txt");

            app.handle()
                .plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;

            logger::init_logging(&app.handle())?;

            // 初始化
            app.manage(TrojanState {
                child: Mutex::new(None),
                current_config_name: Mutex::new(None),
            });

            // 创建托盘程序
            tray::create_tray(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            my_custom_command,
            trojan::run_trojan,
            trojan::stop_trojan,
            trojan::get_trojan_status,
            logger::flush_logs,
            logger::get_logs_page,
        ]);

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
