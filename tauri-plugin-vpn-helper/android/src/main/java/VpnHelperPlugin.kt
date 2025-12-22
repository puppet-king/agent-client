use tauri::{AppHandle, Runtime};
use crate::platform::MobileVpnProvider;
use async_trait::async_trait;

#[cfg(target_os = "android")]
pub mod android;

#[cfg(target_os = "ios")]
pub mod ios;

pub struct MobileProvider<R: Runtime> {
    app: AppHandle<R>,
}

impl<R: Runtime> MobileProvider<R> {
    pub fn new(app: AppHandle<R>) -> Self {
        Self { app }
    }
}

#[async_trait]
impl<R: Runtime> MobileVpnProvider for MobileProvider<R> {
    async fn start_vpn(&self) -> Result<i32, String> {
        #[cfg(target_os = "android")]
        {
            // 这里以后编写调用 android.rs 的代码
            return self.start_android_impl().await;
        }

        #[cfg(target_os = "ios")]
        {
            // 这里以后编写调用 ios.rs 的代码
            return self.start_ios_impl().await;
        }

        #[cfg(not(any(target_os = "android", target_os = "ios")))]
        Err("Not a mobile platform".to_string())
    }

    async fn stop_vpn(&self) -> Result<(), String> {
        Ok(())
    }
}