use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;
use sysproxy::Sysproxy;
use serde::{Serialize, Deserialize};
use std::fs;


// 1. 修改 TrojanState 结构体，增加一个 Option<String> 类型的 name 字段
pub struct TrojanState {
    pub child: Mutex<Option<CommandChild>>,
    // 存储当前正在运行的配置文件的名称（如 "config_home"）
    pub current_config_name: Mutex<Option<String>>,
}

#[derive(Serialize)]
pub struct TrojanStatus {
    pub is_running: bool,
    pub proxy_status: bool, // 代理状态 true 开启
    pub name: Option<String>,
}


// serde 会自动忽略 JSON 中其他的字段
#[derive(Deserialize)]
struct TrojanPortConfig {
    local_port: u16,
}


// 内部工具函数 内部共享的停止逻辑
pub fn stop_trojan_internal(state: &TrojanState) -> Result<(), String> {
    // 关闭系统代理
    if let Ok(mut proxy) = Sysproxy::get_system_proxy() {
        if proxy.enable {
            proxy.enable = false;
            proxy.set_system_proxy()
                // 成功时执行：打印 info 日志（inspect 专用于副作用操作，如日志）
                .inspect(|_| log::info!("proxy close success"))
                // 错误时执行：打印 error 日志 + 格式化错误信息
                .map_err(|e| {
                    log::error!("proxy close faild: {}", e);
                    format!("关闭代理失败: {}", e)
                })?;
        } else {
             log::info!("proxy is already closed"); // 可选：代理已关闭，无需操作
        }
    }

    let mut lock = state.child.lock().unwrap();
    if let Some(child) = lock.take() {
        child.kill().map_err(|e| format!("无法杀掉进程: {}", e))?;
    }

    
    // 停止后清除保存的名称
    *state.current_config_name.lock().unwrap() = None;
    Ok(())
}

#[tauri::command]
pub async fn run_trojan(
    app_handle: AppHandle,
    state: State<'_, TrojanState>,
    config_path: String,
    config_name: String,
) -> Result<(), String> {
    // 读取配置文件
    let config_content = fs::read_to_string(&config_path)
        .map_err(|e| format!("无法读取配置文件: {}", e))?;

    // 解析端口 local_port 
    let config: TrojanPortConfig = serde_json::from_str(&config_content)
        .map_err(|e| format!("解析配置文件端口失败: {}", e))?;

    // 先停止旧进程
    stop_trojan_internal(&state)?;

    let shell = app_handle.shell();

    // 启动 sidecar
    let (mut rx, child) = shell
        .sidecar("trojan-go")
        .map_err(|e| format!("Sidecar 错误: {}", e))?
        .args(["-config", &config_path])
        .spawn()
        .map_err(|e| format!("Spawn 错误: {}", e))?;

    // 保存状态
    {
        *state.child.lock().unwrap() = Some(child);
        *state.current_config_name.lock().unwrap() = Some(config_name.clone());
    }

    log::info!("proxy info {}", config.local_port);
    // 设置代理
    let proxy = Sysproxy {
        enable: true,
        host: "127.0.0.1".into(),
        port: config.local_port,
        bypass: "".to_string(),
    };

    proxy.set_system_proxy().map_err(|e| {
        log::error!("proxy set error: {}", e);
        format!("自动设置代理失败: {}", e)
    })?;

    // 监听事件
    // 克隆 handle。AppHandle 的克隆是轻量级的，专门用于转移到异步线程
    let app_handle_clone = app_handle.clone();

    // 2. 启动异步监听
    tauri::async_runtime::spawn(async move {
        // 在闭包内部通过克隆的 handle 获取状态
        // 这样就不存在生命周期借用问题，因为 state_inner 也是通过克隆的句柄实时获取的
        let state_inner = app_handle_clone.state::<TrojanState>();

        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    // 使用 app_handle_clone 发送事件
                    let _ =
                        app_handle_clone.emit("trojan-log", String::from_utf8_lossy(&line).trim());
                }
                CommandEvent::Stderr(line) => {
                    let _ = app_handle_clone.emit(
                        "trojan-log",
                        format!("[ERROR] {}", String::from_utf8_lossy(&line).trim()),
                    );
                }
                CommandEvent::Terminated(_) => {
                    // 清理状态
                    let mut lock = state_inner.child.lock().unwrap();
                    *lock = None;
                    let mut name_lock = state_inner.current_config_name.lock().unwrap();
                    *name_lock = None;

                    let _ = app_handle_clone.emit("trojan-status", "stopped");
                    break;
                }
                _ => {}
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn stop_trojan(state: State<'_, TrojanState>) -> Result<(), String> {
    log::info!("trojan close");
    stop_trojan_internal(&state)
}

#[tauri::command]
pub fn get_trojan_status(state: State<'_, TrojanState>) -> TrojanStatus {
    let child_lock = state.child.lock().unwrap();
    let name_lock = state.current_config_name.lock().unwrap();

    // 实时从系统读取代理状态
    let current_proxy_enabled = Sysproxy::get_system_proxy()
    .map(|p| p.enable)
    .unwrap_or(false);

    TrojanStatus {
        is_running: child_lock.is_some(),
        name: name_lock.clone(),
        proxy_status: current_proxy_enabled
    }
}
