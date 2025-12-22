use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
  app: &AppHandle<R>,
  _api: PluginApi<R, C>,
) -> crate::Result<VpnHelper<R>> {
  Ok(VpnHelper(app.clone()))
}

/// Access to the vpn-helper APIs.
pub struct VpnHelper<R: Runtime>(AppHandle<R>);

impl<R: Runtime> VpnHelper<R> {
  pub fn ping(&self, payload: PingRequest) -> crate::Result<PingResponse> {
    Ok(PingResponse {
      value: payload.value,
    })
  }
}
