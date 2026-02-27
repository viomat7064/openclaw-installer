use futures_util::StreamExt;
use serde::Serialize;
use std::io::Write;
use std::time::Instant;
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize)]
pub struct DownloadProgress {
    pub id: String,
    pub downloaded: u64,
    pub total: u64,
    pub speed: u64,
    pub phase: String,
    pub error: Option<String>,
}

fn get_download_url(dep_id: &str) -> Result<String, String> {
    match dep_id {
        "nodejs" => {
            #[cfg(target_os = "windows")]
            {
                Ok("https://nodejs.org/dist/v22.12.0/node-v22.12.0-x64.msi".to_string())
            }
            #[cfg(target_os = "macos")]
            {
                // Detect architecture
                let arch = std::env::consts::ARCH;
                match arch {
                    "x86_64" => Ok("https://nodejs.org/dist/v22.12.0/node-v22.12.0.pkg".to_string()),
                    "aarch64" => Ok("https://nodejs.org/dist/v22.12.0/node-v22.12.0-arm64.pkg".to_string()),
                    _ => Err(format!("Unsupported architecture: {}", arch)),
                }
            }
            #[cfg(not(any(target_os = "windows", target_os = "macos")))]
            {
                Err("Node.js download not supported on this platform".to_string())
            }
        }
        "docker" => {
            #[cfg(target_os = "windows")]
            {
                Ok("https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe".to_string())
            }
            #[cfg(target_os = "macos")]
            {
                // Docker Desktop for Mac (Universal)
                Ok("https://desktop.docker.com/mac/main/amd64/Docker.dmg".to_string())
            }
            #[cfg(not(any(target_os = "windows", target_os = "macos")))]
            {
                Err("Docker Desktop download not supported on this platform".to_string())
            }
        }
        _ => Err(format!("Unknown dependency: {}", dep_id)),
    }
}

#[tauri::command]
pub async fn download_dependency(
    app: AppHandle,
    dep_id: String,
) -> Result<String, String> {
    let url = get_download_url(&dep_id)?;

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(600))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| {
            let _ = app.emit("download-progress", DownloadProgress {
                id: dep_id.clone(),
                downloaded: 0,
                total: 0,
                speed: 0,
                phase: "error".to_string(),
                error: Some(format!("Download failed: {}", e)),
            });
            format!("Download failed: {}", e)
        })?;

    if !response.status().is_success() {
        let msg = format!("HTTP error: {}", response.status());
        let _ = app.emit("download-progress", DownloadProgress {
            id: dep_id.clone(),
            downloaded: 0,
            total: 0,
            speed: 0,
            phase: "error".to_string(),
            error: Some(msg.clone()),
        });
        return Err(msg);
    }

    let total = response.content_length().unwrap_or(0);

    let ext = if dep_id == "nodejs" { ".msi" } else { ".exe" };
    let temp_dir = std::env::temp_dir();
    let temp_path = temp_dir.join(format!("openclaw-installer-{}{}", dep_id, ext));
    let mut file = std::fs::File::create(&temp_path)
        .map_err(|e| format!("Failed to create temp file: {}", e))?;

    let mut downloaded: u64 = 0;
    let start_time = Instant::now();
    let mut last_emit = Instant::now();
    let mut stream = response.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Download stream error: {}", e))?;
        file.write_all(&chunk)
            .map_err(|e| format!("Failed to write file: {}", e))?;
        downloaded += chunk.len() as u64;

        // Emit progress every 200ms
        if last_emit.elapsed().as_millis() >= 200 {
            let elapsed = start_time.elapsed().as_secs_f64();
            let speed = if elapsed > 0.0 {
                (downloaded as f64 / elapsed) as u64
            } else {
                0
            };

            let _ = app.emit("download-progress", DownloadProgress {
                id: dep_id.clone(),
                downloaded,
                total,
                speed,
                phase: "downloading".to_string(),
                error: None,
            });
            last_emit = Instant::now();
        }
    }

    // Final progress emit
    let _ = app.emit("download-progress", DownloadProgress {
        id: dep_id.clone(),
        downloaded,
        total,
        speed: 0,
        phase: "done".to_string(),
        error: None,
    });

    Ok(temp_path.to_string_lossy().to_string())
}
