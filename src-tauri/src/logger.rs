use log::LevelFilter;
use rev_lines::RevLines;
use std::fs::File;
use tauri::AppHandle;
use tauri_plugin_log::{Builder, RotationStrategy, Target, TargetKind};

pub fn init_logging(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(debug_assertions)]
    let level_filter = LevelFilter::Debug;

    #[cfg(not(debug_assertions))]
    let level_filter = LevelFilter::Info;

    let log_builder = Builder::new()
        .level(level_filter)
        .max_file_size(10 * 1024 * 1024)
        // 使用本地时区
        .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
        // 只保留 1个日志文件
        .rotation_strategy(RotationStrategy::KeepOne)
        .targets([
            Target::new(TargetKind::Stdout),
            // 文件路径示例 C:\Users\qqq43\AppData\Local\com.tauri.dev\logs
            // windows 应用 C:\Users\qqq43\AppData\Local\com.puppet4105.client\logs
            Target::new(TargetKind::LogDir {
                file_name: Some("app".to_string()),
            }),
        ])
        .filter(|metadata| {
            #[cfg(desktop)]
            {
                if metadata.target() == "tauri::manager" ||
                   metadata.target() == "wry::webview2" ||
                   metadata.target() == "tracing::span" ||
                   metadata.target() == "tauri::app" {
                    return false;
                }
            }

            // 移动端特有的过滤逻辑
            #[cfg(mobile)]
            {
            }

            // 默认允许其他所有日志通过
            true
        });

    #[cfg(debug_assertions)]
    {
        let (tauri_plugin_log, _max_level, logger) = log_builder.split(app)?;
        let mut devtools_builder = tauri_plugin_devtools::Builder::default();
        devtools_builder.attach_logger(logger);
        app.plugin(devtools_builder.init())?;
        app.plugin(tauri_plugin_log)?;
    }

    #[cfg(not(debug_assertions))]
    //     #[cfg(debug_assertions)]
    {
        let (tauri_plugin_log, max_level, logger) = log_builder.split(app)?;
        let _ = tauri_plugin_log::attach_logger(max_level, logger);
        app.plugin(tauri_plugin_log)?;
    }

    Ok(())
}

#[tauri::command]
pub fn flush_logs() {
    log::debug!("前端触发了日志刷盘");
    log::logger().flush();
}

// 反向读取
#[tauri::command]
pub async fn get_logs_page(
    path: String,
    page: usize,
    page_size: usize,
) -> Result<Vec<String>, String> {
    let file = File::open(&path).map_err(|e| e.to_string())?;
    let rev_lines = RevLines::new(file);

    let logs: Vec<String> = rev_lines
        .skip(page * page_size)
        .take(page_size)
        .filter_map(|line_result| line_result.ok())
        .collect();

    Ok(logs)
}
