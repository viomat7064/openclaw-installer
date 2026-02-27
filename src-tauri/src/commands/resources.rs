use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
pub struct MirrorConfig {
    pub npm: String,
    pub github: String,
}

#[derive(Debug, Serialize)]
pub struct BundledResource {
    pub name: String,
    pub path: PathBuf,
    pub size: u64,
    pub exists: bool,
}

/// Get the bundled resources directory
pub fn get_resources_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))
}

/// Check if a bundled resource exists
pub fn check_bundled_resource(
    app: &tauri::AppHandle,
    relative_path: &str,
) -> Result<BundledResource, String> {
    let resources_dir = get_resources_dir(app)?;
    let resource_path = resources_dir.join(relative_path);

    let exists = resource_path.exists();
    let size = if exists {
        std::fs::metadata(&resource_path)
            .map(|m| m.len())
            .unwrap_or(0)
    } else {
        0
    };

    Ok(BundledResource {
        name: relative_path.to_string(),
        path: resource_path,
        size,
        exists,
    })
}

/// Load mirror configuration
pub fn load_mirrors(app: &tauri::AppHandle) -> Result<MirrorConfig, String> {
    let resources_dir = get_resources_dir(app)?;
    let mirrors_path = resources_dir.join("mirrors.json");

    if !mirrors_path.exists() {
        return Ok(MirrorConfig {
            npm: "https://registry.npmjs.org".to_string(),
            github: "https://github.com".to_string(),
        });
    }

    let content = std::fs::read_to_string(&mirrors_path)
        .map_err(|e| format!("Failed to read mirrors.json: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse mirrors.json: {}", e))
}

#[tauri::command]
pub async fn list_bundled_resources(app: tauri::AppHandle) -> Result<Vec<BundledResource>, String> {
    let resources_dir = get_resources_dir(&app)?;

    let mut resources = Vec::new();

    // Check for OpenClaw source
    if let Ok(entries) = std::fs::read_dir(resources_dir.join("openclaw")) {
        for entry in entries.flatten() {
            if let Some(name) = entry.file_name().to_str() {
                if name.ends_with(".tar.gz") {
                    resources.push(check_bundled_resource(&app, &format!("openclaw/{}", name))?);
                }
            }
        }
    }

    // Check for Node.js installers
    let node_installers = vec![
        "installers/node-v22.12.0-win-x64.msi",
        "installers/node-v22.12.0-darwin-x64.pkg",
        "installers/node-v22.12.0-darwin-arm64.pkg",
    ];

    for installer in node_installers {
        resources.push(check_bundled_resource(&app, installer)?);
    }

    // Check for Docker Desktop
    resources.push(check_bundled_resource(&app, "installers/DockerDesktop-win.exe")?);

    // Check for npm cache
    if let Ok(entries) = std::fs::read_dir(resources_dir.join("npm-cache")) {
        for entry in entries.flatten() {
            if let Some(name) = entry.file_name().to_str() {
                resources.push(check_bundled_resource(&app, &format!("npm-cache/{}", name))?);
            }
        }
    }

    Ok(resources)
}

#[tauri::command]
pub async fn get_mirrors(app: tauri::AppHandle) -> Result<MirrorConfig, String> {
    load_mirrors(&app)
}

#[tauri::command]
pub async fn extract_bundled_openclaw(
    app: tauri::AppHandle,
    target_dir: String,
) -> Result<String, String> {
    let resources_dir = get_resources_dir(&app)?;
    let openclaw_dir = resources_dir.join("openclaw");

    // Find the OpenClaw tarball
    let entries = std::fs::read_dir(&openclaw_dir)
        .map_err(|e| format!("Failed to read openclaw directory: {}", e))?;

    let mut tarball_path = None;
    for entry in entries.flatten() {
        if let Some(name) = entry.file_name().to_str() {
            if name.starts_with("openclaw-") && name.ends_with(".tar.gz") {
                tarball_path = Some(entry.path());
                break;
            }
        }
    }

    let tarball = tarball_path.ok_or("No OpenClaw tarball found in bundle")?;

    // Extract using tar command
    let output = std::process::Command::new("tar")
        .args(&[
            "-xzf",
            tarball.to_str().unwrap(),
            "-C",
            &target_dir,
        ])
        .output()
        .map_err(|e| format!("Failed to extract tarball: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "Extraction failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    Ok(format!("Extracted OpenClaw to {}", target_dir))
}
