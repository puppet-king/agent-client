use tauri::{
  plugin::{Builder, TauriPlugin},
  Manager, Runtime,
};

pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::VpnHelper;
#[cfg(mobile)]
use mobile::VpnHelper;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the vpn-helper APIs.
pub trait VpnHelperExt<R: Runtime> {
  fn vpn_helper(&self) -> &VpnHelper<R>;
}

impl<R: Runtime, T: Manager<R>> crate::VpnHelperExt<R> for T {
  fn vpn_helper(&self) -> &VpnHelper<R> {
    self.state::<VpnHelper<R>>().inner()
  }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
  Builder::new("vpn-helper")
    .invoke_handler(tauri::generate_handler![commands::ping])
    .setup(|app, api| {
      #[cfg(mobile)]
      let vpn_helper = mobile::init(app, api)?;
      #[cfg(desktop)]
      let vpn_helper = desktop::init(app, api)?;
      app.manage(vpn_helper);
      Ok(())
    })
    .build()
}
