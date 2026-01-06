use tauri::Manager;
mod logger;
mod platform;

#[cfg(desktop)]
pub mod engine;
#[cfg(desktop)]
pub mod tray;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init());

    // 根据平台加载插件
    builder = platform::build_plugins(builder)
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init());

    // 根据平台监听窗口事件
    builder = platform::handle_window_event(builder);

    // 注入插件
    builder = builder
        // 使用 argon2 密码哈希函数初始化
        .setup(|app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = app.get_webview_window("puppet4105").unwrap();
                window.open_devtools();
                // window.close_devtools();
            }

            logger::init_logging(&app.handle())?;
            platform::handle_setup_event(app)?;
            Ok(())
        })
        .invoke_handler(platform::get_handlers());

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
