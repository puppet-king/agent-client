use std::process::Child;
use tauri::async_runtime::Mutex;

pub struct TrojanState {
    pub child: Mutex<Option<Child>>,
}
