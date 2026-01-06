use regex::Regex;
use serde::{Deserialize, Serialize};
use std::fs;
use std::sync::Mutex;
use sysproxy::Sysproxy;
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

// 修改 TrojanState 结构体，增加一个 Option<String> 类型的 name 字段
pub struct TrojanState {
    pub child: Mutex<Option<CommandChild>>,
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
            proxy
                .set_system_proxy()
                // 成功时执行：打印 info 日志（inspect 专用于副作用操作，如日志）
                .inspect(|_| log::info!("proxy close success"))
                // 错误时执行：打印 error 日志 + 格式化错误信息
                .map_err(|e| {
                    log::error!("proxy close failed: {}", e);
                    format!("关闭代理失败: {}", e)
                })?;
        } else {
            log::info!("proxy is already closed"); // 可选：代理已关闭，无需操作
        }
    }

    let maybe_child = {
        let mut lock = state.child.lock().unwrap();
        lock.take() // take() 会留下 None 并返回内容，操作极快
    };

    // 在锁之外执行 kill()，这样即使 kill 阻塞，也不会阻塞其他状态查询
    if let Some(child) = maybe_child {
        // 优雅终止（等价于 Ctrl+C）
        if let Err(e) = child.kill() {
            log::error!("无法终止 sing-box: {}", e);
        }
    }

    {
        *state.current_config_name.lock().unwrap() = None;
    }
    Ok(())
}

#[tauri::command]
pub async fn run_trojan(
    app_handle: AppHandle,
    state: State<'_, TrojanState>,
    config_path: String,
    config_name: String,
) -> Result<(), String> {
    log::info!("config_path {}", config_path);

    // 读取配置文件
    let config_content =
        fs::read_to_string(&config_path).map_err(|e| format!("无法读取配置文件: {}", e))?;

    let v: serde_json::Value =
        json5::from_str(&config_content).map_err(|e| format!("JSON5 解析失败: {}", e))?;

    // 2. 从嵌套的 inbounds[0].listen_port 中提取端口
    let extracted_port = v["inbounds"][0]["listen_port"]
        .as_u64()
        .ok_or_else(|| "无法从配置文件 inbounds[0].listen_port 提取端口".to_string())?
        as u16;

    // 3. 手动构造并赋值给您的 TrojanPortConfig 结构体
    let config = TrojanPortConfig {
        local_port: extracted_port,
    };

    // 4. 现在您可以像以前一样使用 config.local_port 了
    log::info!("proxy info {}", config.local_port);

    // 先停止旧进程
    stop_trojan_internal(&state)?;

    let shell = app_handle.shell();

    // 启动 sidecar
    let (mut rx, child) = shell
        .sidecar("sing-box")
        .map_err(|e| format!("Sidecar 错误: {}", e))?
        .args(["run", "-c", &config_path, "--disable-color"])
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
    let port_regex = Regex::new(r"listen tcp (?:.*):(\d+): bind").unwrap();

    // 2. 启动异步监听
    tauri::async_runtime::spawn(async move {
        // 在闭包内部通过克隆的 handle 获取状态
        // 这样就不存在生命周期借用问题，因为 state_inner 也是通过克隆的句柄实时获取的
        let state_inner = app_handle_clone.state::<TrojanState>();

        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    let raw_line = String::from_utf8_lossy(&line);
                    let trimmed_line = raw_line.trim();
                    log::debug!("{}", trimmed_line);
                    if trimmed_line.contains("FATAL") {
                        let _ = app_handle_clone.emit("trojan-log", trimmed_line);
                    }
                }
                CommandEvent::Stderr(line) => {
                    let raw_line = String::from_utf8_lossy(&line);
                    let trimmed_line = raw_line.trim();
                    log::info!("{}", trimmed_line);

                    if trimmed_line.contains("FATAL") {
                        // 专门检查是否是端口占用 (WSAEADDRINUSE)
                        if trimmed_line.contains("bind: Only one usage of each socket address") {
                            // 发送中文提示
                            let port = port_regex
                                .captures(trimmed_line)
                                .and_then(|cap| cap.get(1))
                                .map(|m| m.as_str())
                                .unwrap_or("未知"); // 如果提取失败，显示未知

                            let error_msg = format!(
                               "[FATAL] 启动失败: {} 端口已被占用，请检查是否有其他代理程序正在运行",
                               port
                           );

                            let _ = app_handle_clone.emit("trojan-log", error_msg);
                        } else {
                            // 其他 FATAL 错误原样发送
                            let _ = app_handle_clone
                                .emit("trojan-log", format!("[FATAL] {}", trimmed_line));
                        }
                    }
                }

                CommandEvent::Terminated(payload) => {
                    // 1. 打印详细日志：包含进程的退出原因（如果是 Ok 则正常退出，否则包含退出码）
                    log::warn!("[Trojan] 进程事件: Terminated, 退出信息: {:?}", payload);

                    // 2. 尝试获取锁，并在日志中打印清空前的状态
                    let mut lock = state_inner.child.lock().unwrap();
                    let mut name_lock = state_inner.current_config_name.lock().unwrap();

                    log::info!(
                        "[Trojan] 清理状态前: has_child={}, current_name={:?}",
                        lock.is_some(),
                        *name_lock
                    );

                    // 3. 执行清理
                    *lock = None;
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

    //     // 实时从系统读取代理状态
    let current_proxy_enabled = Sysproxy::get_system_proxy()
        .map(|p| p.enable)
        .unwrap_or(false);

    TrojanStatus {
        is_running: child_lock.is_some(),
        name: name_lock.clone(),
        proxy_status: current_proxy_enabled,
    }
}
