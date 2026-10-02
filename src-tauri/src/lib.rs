use std::collections::HashSet;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use rand::seq::SliceRandom;
use rand::thread_rng;
use tauri::Manager;

#[derive(serde::Serialize, Clone)]
pub struct VideoInfo {
    pub path: String,
    pub name: String,
}

const VIDEO_EXTS: &[&str] = &["mp4", "mov", "avi", "mkv", "webm"];

// 递归扫描目录，返回按路径排序的视频列表
fn scan_and_sort(dir: &Path) -> Vec<VideoInfo> {
    let mut videos = Vec::new();
    scan_recursive(dir, &mut videos);
    videos.sort_by(|a, b| a.path.cmp(&b.path));
    videos
}

fn scan_recursive(dir: &Path, videos: &mut Vec<VideoInfo>) {
    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            scan_recursive(&path, videos);
        } else if let Some(ext) = path.extension() {
            let ext = ext.to_string_lossy().to_ascii_lowercase();
            if VIDEO_EXTS.contains(&ext.as_str()) {
                let name = path
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("未知视频")
                    .to_string();
                videos.push(VideoInfo {
                    path: path.to_string_lossy().to_string(),
                    name,
                });
            }
        }
    }
}

#[tauri::command]
fn get_videos_by_path(video_dir: String) -> Result<Vec<VideoInfo>, String> {
    let path = Path::new(&video_dir);
    if !path.exists() {
        return Err(format!("路径不存在: {}", video_dir));
    }
    if !path.is_dir() {
        return Err(format!("路径不是目录: {}", video_dir));
    }
    Ok(scan_and_sort(path))
}

#[tauri::command]
fn get_videos(app_handle: tauri::AppHandle) -> Result<Vec<VideoInfo>, String> {
    // 收集可能的默认 video 目录候选，返回第一个存在的
    let mut candidates: Vec<PathBuf> = Vec::new();

    if let Ok(cwd) = std::env::current_dir() {
        candidates.push(cwd.join("video"));
    }
    if let Ok(exe) = std::env::current_exe() {
        let mut d = exe.as_path();
        for _ in 0..4 {
            candidates.push(d.join("video"));
            d = match d.parent() {
                Some(p) => p,
                None => break,
            };
        }
    }
    if let Ok(r) = app_handle.path().resource_dir() {
        let mut d = r.as_path();
        for _ in 0..6 {
            candidates.push(d.join("video"));
            d = match d.parent() {
                Some(p) => p,
                None => break,
            };
        }
    }
    if let Ok(a) = app_handle.path().app_data_dir() {
        if let Some(p) = a.parent().and_then(|p| p.parent()) {
            candidates.push(p.join("video"));
        }
    }

    let mut seen = HashSet::new();
    let dir = candidates
        .into_iter()
        .filter(|p| seen.insert(p.clone()))
        .find(|p| p.exists());

    match dir {
        Some(d) => Ok(scan_and_sort(&d)),
        None => Ok(Vec::new()),
    }
}

#[tauri::command]
fn generate_play_order(video_count: usize, last_played: Vec<usize>) -> Result<Vec<usize>, String> {
    if video_count == 0 {
        return Ok(Vec::new());
    }

    let mut rng = thread_rng();
    let mut all: Vec<usize> = (0..video_count).collect();
    let played: HashSet<usize> = last_played.into_iter().collect();

    let mut unplayed: Vec<usize> = all.iter().copied().filter(|i| !played.contains(i)).collect();

    let order = if !unplayed.is_empty() {
        unplayed.shuffle(&mut rng);
        unplayed
    } else {
        all.shuffle(&mut rng);
        all
    };

    Ok(order)
}

/// 安装全局 panic 钩子：任何线程上的 panic 都会被记录到日志文件与 stderr，
/// 便于崩溃后回溯原因。配合 release profile 的 `panic = "unwind"`，
/// 多数 tokio worker 上的 panic 只会导致该任务失败而非整个进程退出。
fn install_panic_hook() {
    std::panic::set_hook(Box::new(|info| {
        let loc = info
            .location()
            .map(|l| l.to_string())
            .unwrap_or_else(|| "unknown location".to_string());
        let payload = if let Some(s) = info.payload().downcast_ref::<&str>() {
            (*s).to_string()
        } else if let Some(s) = info.payload().downcast_ref::<String>() {
            s.clone()
        } else {
            "unknown panic payload".to_string()
        };
        let ts = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        let report = format!(
            "[player-tauri panic] time={ts} location={loc}\nmessage: {payload}\n{info}\n{sep}\n",
            sep = "----------------------------------------"
        );

        // 优先写到 ~/Library/Logs/player-tauri/panic.log，失败则退回 /tmp
        let home = std::env::var("HOME").unwrap_or_default();
        let log_path = if home.is_empty() {
            "/tmp/player-tauri-panic.log".to_string()
        } else {
            format!("{home}/Library/Logs/player-tauri/panic.log")
        };

        if let Some(parent) = std::path::Path::new(&log_path).parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        let _ = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_path)
            .and_then(|mut f| f.write_all(report.as_bytes()));

        eprintln!("{report}");
    }));
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    install_panic_hook();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_videos,
            get_videos_by_path,
            generate_play_order
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
