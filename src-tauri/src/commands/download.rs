use futures_util::StreamExt;
use serde::Serialize;
use std::io::Write;
use std::time::Instant;
use tauri::{AppHandle, Emitter};
use sha2::{Sha256, Digest};

#[derive(Clone, Serialize)]
pub struct DownloadProgress {
    pub id: String,
    pub downloaded: u64,
    pub total: u64,
    pub speed: u64,
    pub phase: String,
    pub error: Option<String>,
}

struct DownloadConfig {
    url: String,
    sha256: String,
}

#[allow(unused_variables)]
fn get_download_config(dep_id: &str, use_mirror: bool) -> Result<DownloadConfig, String> {
    let mirrors_json = include_str!("../../resources/mirrors.json");
    let mirrors: serde_json::Value = serde_json::from_str(mirrors_json)
        .map_err(|e| format!("Failed to parse mirrors.json: {}", e))?;

    let source = if use_mirror { "mirrors" } else { "official" };

    match dep_id {
        "nodejs" => {
            #[cfg(target_os = "windows")]
            {
                let config = &mirrors[source]["nodejs"]["windows_x64"];
                Ok(DownloadConfig {
                    url: config["url"].as_str().ok_or("Missing nodejs URL")?.to_string(),
                    sha256: config["sha256"].as_str().ok_or("Missing nodejs checksum")?.to_string(),
                })
            }
            #[cfg(target_os = "macos")]
            {
                let arch = std::env::consts::ARCH;
                let key = match arch {
                    "x86_64" => "macos_x64",
                    "aarch64" => "macos_arm64",
                    _ => return Err(format!("Unsupported architecture: {}", arch)),
                };
                let config = &mirrors[source]["nodejs"][key];
                Ok(DownloadConfig {
                    url: config["url"].as_str().ok_or(format!("Missing nodejs URL for {}", key))?.to_string(),
                    sha256: config["sha256"].as_str().ok_or(format!("Missing nodejs checksum for {}", key))?.to_string(),
                })
            }
            #[cfg(not(any(target_os = "windows", target_os = "macos")))]
            {
                Err("Node.js download not supported on this platform".to_string())
            }
        }
        "docker" => {
            #[cfg(target_os = "windows")]
            {
                let config = &mirrors[source]["docker"]["windows"];
                Ok(DownloadConfig {
                    url: config["url"].as_str().ok_or("Missing docker URL")?.to_string(),
                    sha256: config["sha256"].as_str().ok_or("Missing docker checksum")?.to_string(),
                })
            }
            #[cfg(target_os = "macos")]
            {
                let config = &mirrors[source]["docker"]["macos"];
                Ok(DownloadConfig {
                    url: config["url"].as_str().ok_or("Missing docker URL")?.to_string(),
                    sha256: config["sha256"].as_str().ok_or("Missing docker checksum")?.to_string(),
                })
            }
            #[cfg(not(any(target_os = "windows", target_os = "macos")))]
            {
                Err("Docker Desktop download not supported on this platform".to_string())
            }
        }
        _ => Err(format!("Unknown dependency: {}", dep_id)),
    }
}

fn verify_checksum(file_path: &std::path::Path, expected: &str) -> Result<(), String> {
    let mut file = std::fs::File::open(file_path)
        .map_err(|e| format!("Failed to open file for checksum: {}", e))?;
    let mut hasher = Sha256::new();
    std::io::copy(&mut file, &mut hasher)
        .map_err(|e| format!("Failed to compute checksum: {}", e))?;
    let hash = format!("{:x}", hasher.finalize());

    if hash != expected {
        return Err(format!("Checksum mismatch: expected {}, got {}", expected, hash));
    }
    Ok(())
}

#[tauri::command]
pub async fn download_dependency(
    app: AppHandle,
    dep_id: String,
    use_mirror: bool,
) -> Result<String, String> {
    let config = get_download_config(&dep_id, use_mirror)?;

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(600))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let response = client
        .get(&config.url)
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

    // Verify checksum
    drop(file); // Close file before verification
    let _ = app.emit("download-progress", DownloadProgress {
        id: dep_id.clone(),
        downloaded,
        total,
        speed: 0,
        phase: "verifying".to_string(),
        error: None,
    });

    if let Err(e) = verify_checksum(&temp_path, &config.sha256) {
        let _ = app.emit("download-progress", DownloadProgress {
            id: dep_id.clone(),
            downloaded: 0,
            total: 0,
            speed: 0,
            phase: "error".to_string(),
            error: Some(e.clone()),
        });
        // Delete corrupted file
        let _ = std::fs::remove_file(&temp_path);
        return Err(e);
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
