use crate::engine::trojan::{stop_trojan_internal, TrojanState};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    App, Manager, Runtime,
};

pub fn create_tray<R: Runtime>(app: &App<R>) -> tauri::Result<()> {
    // 1. 初始化托盘菜单项
    let show_i = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "退出程序", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

    // 2. 构建托盘图标
    let _tray = TrayIconBuilder::with_id("main_tray") // 建议指定一个 ID
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "show" => {
                    // println!("show menu item was clicked");
                    if let Some(window) = app.get_webview_window("puppet4105") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "quit" => {
                    log::info!("quit");
                    // 调用 trojan 模块的清理逻辑
                    let state = app.state::<TrojanState>();
                    let _ = stop_trojan_internal(&state);
                    for window in app.webview_windows().values() {
                        let _ = window.close();
                    }

                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            use tauri::tray::MouseButton;

            match event {
                TrayIconEvent::Click {
                    button: MouseButton::Left,
                    ..
                } => {
                    let app = tray.app_handle();
                    if let Some(window) = app.get_webview_window("puppet4105") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}
