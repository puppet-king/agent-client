use tauri::Builder;

pub fn enhance_builder(builder: Builder) -> Builder {
    builder
}

pub fn setup(_: &tauri::App) -> tauri::Result<()> {
    log::info!("初始化移动端环境...");
    Ok(())
}

pub fn window_event(_: &tauri::Window, _: &tauri::WindowEvent) {}
