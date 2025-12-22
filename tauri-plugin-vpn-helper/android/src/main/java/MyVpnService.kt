use tauri::{AppHandle, Runtime, Listener};
use tauri_plugin_vpn_helper::VpnHelperExt;
use crate::platform::mobile::MobileProvider;
use serde::Deserialize;

#[derive(Deserialize, Clone)]
struct VpnReadyPayload {
    fd: i32,
}

impl<R: Runtime> MobileProvider<R> {
    pub async fn start_android_impl(&self) -> Result<i32, String> {
        let (tx, rx) = std::sync::mpsc::channel();
        let app_handle = self.app.clone();

        // 1. 注册监听器，等待 Kotlin 传回 FD
        let handler = self.app.listen("vpn-ready", move |event| {
            if let Ok(payload) = serde_json::from_str::<VpnReadyPayload>(event.payload()) {
                let _ = tx.send(payload.fd);
            }
        });

        // 2. 调用插件启动 Service
        self.app.vpn_helper().start_my_vpn_service()
            .map_err(|e| e.to_string())?;

        // 3. 等待 FD 传回 (设置 5 秒超时)
        let fd = rx.recv_timeout(std::time::Duration::from_secs(5))
            .map_err(|_| "等待 VPN 网卡启动超时".to_string())?;

        // 停止监听以节省资源
        app_handle.unlisten(handler);

        Ok(fd)
    }
}