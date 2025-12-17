use tauri::{Manager, AppHandle};
use std::sync::{Arc, Mutex};
use tokio::io::{AsyncBufReadExt, BufReader};
use regex::Regex;
use std::path::PathBuf;
use tauri_plugin_shell::ShellExt;


// 全局单例存储子进程
type SharedChild = Arc<Mutex<Option<tauri_plugin_shell::Child>>>;

struct TrojanLog {
    level: String,
    timestamp: String,
    message: String,
}

// 初始化全局单例
lazy_static::lazy_static! {
    static ref TROJAN_CHILD: SharedChild = Arc::new(Mutex::new(None));
}

/// 启动 trojan-go
#[tauri::command]
pub fn run_trojan(app_handle: AppHandle, name: String) {
    log::info!("runTrojan: {}", name);

    let trojan_child = TROJAN_CHILD.clone();
    tauri::async_runtime::spawn(async move {
        // 如果已经存在子进程，先 kill 掉
        if let Some(mut child) = trojan_child.lock().unwrap().take() {
            let _ = child.kill().await;
            log::info!("已停止上一个 trojan-go 实例");
        }

        let shell = app_handle.shell();

        // spawn trojan-go sidecar
        let mut command = shell
            .command("binaries/trojan-go")
            .args(["-config", &name])
            .spawn()
            .expect("无法启动 trojan-go");

        // 保存到全局单例
        *trojan_child.lock().unwrap() = Some(command.clone());

        log::info!("trojan-go 运行成功");

        // stdout 监听
        if let Some(stdout) = command.stdout() {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            let stdout_trojan_child = trojan_child.clone();

            tauri::async_runtime::spawn(async move {
                while let Ok(Some(line)) = lines.next_line().await {
                    let text = line.trim();
                    if let Some(log_entry) = parse_trojan_log(text) {
                        log::info!("Level: {}", log_entry.level);
                        log::info!("Time: {}", log_entry.timestamp);
                        log::info!("Message: {}", log_entry.message);

                        // 端口占用检测
                        let port_conflict_regex =
                            Regex::new(r"listen (tcp|udp) 127\.0\.0\.1:(\d+): bind").unwrap();
                        if let Some(captures) = port_conflict_regex.captures(&log_entry.message) {
                            let protocol = &captures[1];
                            let port = &captures[2];
                            log::error!(
                                "[trojan-go] {} port {} conflict",
                                protocol.to_uppercase(),
                                port
                            );
                        }
                    }
                }

                // stdout 结束后清空全局子进程
                stdout_trojan_child.lock().unwrap().take();
            });
        }

        // stderr 监听
        if let Some(stderr) = command.stderr() {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();
            tauri::async_runtime::spawn(async move {
                while let Ok(Some(line)) = lines.next_line().await {
                    log::error!("[trojan-go stderr] {}", line);
                }
            });
        }

        // 等待子进程结束
        match command.wait().await {
            Ok(status) => {
                log::info!("trojan-go finished with code {:?}", status.code());
                trojan_child.lock().unwrap().take();
            }
            Err(err) => {
                log::error!("trojan-go wait error: {:?}", err);
                trojan_child.lock().unwrap().take();
            }
        }
    });
}

/// 停止 trojan-go
#[tauri::command]
pub async fn stop_trojan() {
    let trojan_child = TROJAN_CHILD.clone();

    if let Some(mut child) = trojan_child.lock().unwrap().take() {
        if let Err(err) = child.kill().await {
            log::error!("停止 trojan-go 出错: {:?}", err);
        } else {
            log::info!("trojan-go 已停止");
        }
    }
}




fn parse_trojan_log(line: &str) -> Option<TrojanLog> {
    // 匹配 [LEVEL] YYYY/MM/DD HH:MM:SS message
    let re = Regex::new(r"^\[(\w+)\]\s+(\d{4}/\d{2}/\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.*)$").unwrap();
    
    if let Some(caps) = re.captures(line) {
        Some(TrojanLog {
            level: caps[1].to_string(),
            timestamp: caps[2].to_string(),
            message: caps[3].to_string(),
        })
    } else {
        None
    }
}