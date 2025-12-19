use tauri::{Builder, Manager, WindowEvent};
use crate::{tray, trojan::TrojanState};
use std::sync::Mutex;

pub fn enhance_builder(builder: Builder) -> Builder {
    builder
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            let _ = app.get_webview_window("puppet4105")
                .expect("no main window")
                .set_focus();
        }))
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
}

pub fn setup(app: &tauri::App) -> tauri::Result<()> {
    let salt_path = app
        .path()
        .app_local_data_dir()?
        .join("salt.txt");

    app.handle()
        .plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;

    app.manage(TrojanState {
        child: Mutex::new(None),
        current_config_name: Mutex::new(None),
    });

    tray::create_tray(app)?;

    Ok(())
}

pub fn window_event(window: &tauri::Window, event: &WindowEvent) {
    match event {
        WindowEvent::CloseRequested { api, .. } => {
            api.prevent_close();
            let _ = window.hide();
        }
        _ => {}
    }
}
