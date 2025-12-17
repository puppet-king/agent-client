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
            if let WindowEvent::CloseRequested { api, .. } = event {
                // 阻止窗口真正关闭/销毁
                api.prevent_close();
                // 隐藏窗口到后台
                let _ = window.hide();
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
        ]);

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
