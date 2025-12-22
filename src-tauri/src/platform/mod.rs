use tauri::{Wry, App};

#[cfg(mobile)]
pub mod mobile;

#[cfg(desktop)]
pub mod desktop;


// 构建插件
pub fn build_plugins(builder: tauri::Builder<Wry>) -> tauri::Builder<Wry> {
    #[cfg(desktop)]
    {
        return desktop::build_plugins(builder); // 在 desktop 平台上返回 builder
    }

    #[cfg(mobile)]
    {
        return mobile::build_plugins(builder); // 在 mobile 平台上返回 builder
    }
}

pub fn handle_window_event(builder: tauri::Builder<Wry>) -> tauri::Builder<Wry> {
    #[cfg(desktop)]
    {
        return desktop::handle_window_event(builder);
    }

    #[cfg(mobile)]
    {
        return mobile::handle_window_event(builder);
    }
}


pub fn handle_setup_event(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(desktop)]
    {
         desktop::handle_setup_event(app)?;
    }

    #[cfg(mobile)]
    {
          mobile::handle_setup_event(app)?;
    }

    Ok(())
}


pub fn get_handlers() -> impl Fn(tauri::ipc::Invoke<tauri::Wry>) -> bool {
    #[cfg(desktop)]
    {
        desktop::get_handlers() 
    }

    #[cfg(mobile)]
    {
        mobile::get_handlers() 
    }
}