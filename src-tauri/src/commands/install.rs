use serde::Serialize;
use std::process::Command;
#[allow(unused_imports)]
use tauri::{AppHandle, Emitter, Manager};

#[derive(Clone, Serialize)]
pub struct InstallStep {
    pub id: String,
    pub status: String, // "pending" | "running" | "done" | "error"
    pub message: String,
    pub log: Option<String>,
}

fn emit_step(app: &AppHandle, id: &str, status: &str, message: &str, log: Option<String>) {
    let _ = app.emit(
        "install-step",
        InstallStep {
            id: id.to_string(),
            status: status.to_string(),
            message: message.to_string(),
            log,
        },
    );
}

fn dev_mode_output() -> std::io::Result<std::process::Output> {
    Command::new("echo").arg("dev mode: skipped").output()
}

fn find_npm() -> String {
    if cfg!(target_os = "windows") {
        let program_files = std::env::var("ProgramFiles").unwrap_or_else(|_| "C:\\Program Files".to_string());
        let npm_path = format!("{}\\nodejs\\npm.cmd", program_files);
        if std::path::Path::new(&npm_path).exists() {
            return npm_path;
        }
    }
    "npm".to_string()
}

fn find_openclaw() -> String {
    if cfg!(target_os = "windows") {
        let appdata = std::env::var("APPDATA").unwrap_or_default();
        let openclaw_path = format!("{}\\npm\\openclaw.cmd", appdata);
        if std::path::Path::new(&openclaw_path).exists() {
            return openclaw_path;
        }
    }
    "openclaw".to_string()
}

#[cfg(target_os = "windows")]
fn refresh_path() {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    unsafe {
        let env: Vec<u16> = OsStr::new("Environment\0").encode_wide().collect();
        winapi::um::winuser::SendMessageTimeoutW(
            winapi::um::winuser::HWND_BROADCAST,
            winapi::um::winuser::WM_SETTINGCHANGE,
            0,
            env.as_ptr() as winapi::shared::minwindef::LPARAM,
            winapi::um::winuser::SMTO_ABORTIFHUNG,
            5000,
            std::ptr::null_mut(),
        );
    }
}

#[cfg(not(target_os = "windows"))]
fn refresh_path() {
    // No-op on non-Windows
}

#[cfg(target_os = "windows")]
fn create_desktop_shortcut(target: &str, name: &str) -> Result<(), String> {
    use base64::{Engine as _, engine::general_purpose};

    let desktop = dirs::desktop_dir().ok_or("Cannot find desktop directory")?;
    let lnk_path = desktop.join(format!("{}.lnk", name));

    // Validate target path (whitelist)
    let valid_targets = vec!["openclaw", "openclaw.cmd"];
    let target_name = std::path::Path::new(target)
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or("Invalid target path")?;

    if !valid_targets.contains(&target_name) {
        return Err(format!("Invalid shortcut target: {}", target_name));
    }

    // Use Base64 encoding to prevent PowerShell injection
    let ps_script = format!(
        "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('{}'); $s.TargetPath = '{}'; $s.WorkingDirectory = '%USERPROFILE%'; $s.Save()",
        lnk_path.to_string_lossy(),
        target
    );
    let encoded = general_purpose::STANDARD.encode(ps_script.encode_utf16().flat_map(|c| c.to_le_bytes()).collect::<Vec<u8>>());

    Command::new("powershell")
        .args(["-NoProfile", "-EncodedCommand", &encoded])
        .output()
        .map_err(|e| format!("Failed to create shortcut: {}", e))?;
    Ok(())
}

#[cfg(not(target_os = "windows"))]
fn create_desktop_shortcut(_target: &str, _name: &str) -> Result<(), String> {
    Ok(()) // No-op on non-Windows
}

#[tauri::command]
pub async fn install_dependency(
    app: AppHandle,
    dep_id: String,
    installer_path: String,
) -> Result<(), String> {
    emit_step(&app, &dep_id, "running", "Installing...", None);

    // Validate installer path (must be in temp directory)
    let temp_dir = std::env::temp_dir();
    let path = std::path::Path::new(&installer_path);
    if !path.starts_with(&temp_dir) {
        return Err("Invalid installer path: must be in temp directory".to_string());
    }

    // Validate file extension
    let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
    let valid_exts = ["msi", "exe", "pkg", "dmg"];
    if !valid_exts.contains(&ext) {
        return Err(format!("Invalid installer file type: {}", ext));
    }

    let output = if dep_id == "nodejs" {
        if cfg!(target_os = "windows") {
            Command::new("msiexec")
                .args(["/i", &installer_path, "/qn", "/norestart"])
                .output()
        } else {
            dev_mode_output()
        }
    } else if dep_id == "docker" {
        if cfg!(target_os = "windows") {
            // Validate Docker installer path
            if !installer_path.contains("openclaw-installer-docker") {
                return Err("Invalid Docker installer path".to_string());
            }
            Command::new(&installer_path)
                .args(["install", "--quiet", "--accept-license"])
                .output()
        } else {
            dev_mode_output()
        }
    } else {
        return Err(format!("Unknown dependency: {}", dep_id));
    };

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            let log = if stderr.is_empty() { stdout } else { format!("{}\n{}", stdout, stderr) };

            if out.status.success() {
                // Refresh PATH after installing Node.js or Docker
                if dep_id == "nodejs" || dep_id == "docker" {
                    refresh_path();
                }
                // Docker Desktop requires restart
                if dep_id == "docker" {
                    emit_step(&app, &dep_id, "done", "Installed — restart required for Docker Desktop", Some(log));
                } else {
                    emit_step(&app, &dep_id, "done", "Installed successfully", Some(log));
                }
                Ok(())
            } else {
                let msg = format!("Installation failed (exit code: {:?})", out.status.code());
                emit_step(&app, &dep_id, "error", &msg, Some(log));
                Err(msg)
            }
        }
        Err(e) => {
            let msg = format!("Failed to run installer: {}", e);
            emit_step(&app, &dep_id, "error", &msg, None);
            Err(msg)
        }
    }
}

#[tauri::command]
pub async fn install_openclaw(
    app: AppHandle,
    mode: String,
    use_mirror: bool,
) -> Result<(), String> {
    if mode == "npm" {
        install_openclaw_npm(&app, use_mirror).await
    } else if mode == "docker" {
        install_openclaw_docker(&app).await
    } else if mode == "bundled" {
        install_openclaw_bundled(&app).await
    } else {
        Err(format!("Unknown install mode: {}", mode))
    }
}

async fn install_openclaw_npm(app: &AppHandle, use_mirror: bool) -> Result<(), String> {
    // Step 1: npm install -g openclaw
    emit_step(app, "npm_install", "running", "Installing OpenClaw via npm...", None);

    let npm = find_npm();
    let mut args = vec!["install", "-g", "openclaw@latest"];
    let registry_arg;
    if use_mirror {
        registry_arg = "--registry=https://registry.npmmirror.com".to_string();
        args.push(&registry_arg);
    }

    let output = Command::new(&npm)
        .args(&args)
        .output()
        .map_err(|e| {
            let msg = format!("Failed to run npm: {}", e);
            emit_step(app, "npm_install", "error", &msg, None);
            msg
        })?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let log = format!("{}\n{}", stdout, stderr);

    if !output.status.success() {
        let msg = "npm install failed".to_string();
        emit_step(app, "npm_install", "error", &msg, Some(log));
        return Err(msg);
    }
    emit_step(app, "npm_install", "done", "OpenClaw installed", Some(log));

    // Step 2: Verify openclaw version
    emit_step(app, "verify_version", "running", "Verifying installation...", None);

    let openclaw = find_openclaw();
    let ver_output = Command::new(&openclaw)
        .arg("--version")
        .output();

    match ver_output {
        Ok(out) if out.status.success() => {
            let version = String::from_utf8_lossy(&out.stdout).trim().to_string();
            emit_step(app, "verify_version", "done", &format!("OpenClaw {}", version), None);
        }
        _ => {
            emit_step(app, "verify_version", "error", "Could not verify OpenClaw version", None);
            return Err("OpenClaw verification failed".to_string());
        }
    }

    // Step 3: Write minimal config
    emit_step(app, "write_config", "running", "Writing configuration...", None);

    let home = dirs::home_dir().ok_or("Cannot determine home directory")?;
    let config_dir = home.join(".openclaw");
    std::fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config dir: {}", e))?;

    let config_path = config_dir.join("openclaw.json");
    if !config_path.exists() {
        let default_config = r#"{
  "agent": {}
}"#;
        std::fs::write(&config_path, default_config)
            .map_err(|e| format!("Failed to write config: {}", e))?;
    }
    emit_step(app, "write_config", "done", "Configuration saved", None);

    // Step 4: Start Gateway
    emit_step(app, "start_gateway", "running", "Starting Gateway service...", None);

    let gw_result = Command::new(&openclaw)
        .args(["gateway", "start"])
        .output();

    match gw_result {
        Ok(out) => {
            let log = String::from_utf8_lossy(&out.stdout).to_string();
            if out.status.success() {
                emit_step(app, "start_gateway", "done", "Gateway started", Some(log));
            } else {
                let stderr = String::from_utf8_lossy(&out.stderr).to_string();
                emit_step(app, "start_gateway", "error", "Gateway failed to start", Some(stderr));
                return Err("Gateway failed to start".to_string());
            }
        }
        Err(e) => {
            emit_step(app, "start_gateway", "error", &format!("Failed to start Gateway: {}", e), None);
            return Err(format!("Failed to start Gateway: {}", e));
        }
    }

    // Step 5: Verify Gateway with retry logic
    emit_step(app, "verify_gateway", "running", "Verifying Gateway...", None);

    // Wait longer for gateway to start
    tokio::time::sleep(std::time::Duration::from_secs(5)).await;

    // Implement exponential backoff retry (3 attempts)
    let mut gateway_ok = false;
    let mut attempt = 0;
    let max_attempts = 3;

    while attempt < max_attempts && !gateway_ok {
        attempt += 1;
        let wait_secs = 2u64.pow(attempt as u32); // Exponential: 2, 4, 8

        match std::net::TcpStream::connect_timeout(
            &"127.0.0.1:18789".parse().unwrap(),
            std::time::Duration::from_secs(5),
        ) {
            Ok(_) => {
                gateway_ok = true;
                emit_step(app, "verify_gateway", "done", "Gateway is running on port 18789", None);
            }
            Err(_) if attempt < max_attempts => {
                emit_step(
                    app,
                    "verify_gateway",
                    "running",
                    &format!("Gateway not responding, retrying... (attempt {}/{})", attempt, max_attempts),
                    None,
                );
                tokio::time::sleep(std::time::Duration::from_secs(wait_secs)).await;
            }
            Err(_) => {
                emit_step(app, "verify_gateway", "error", "Gateway is not responding on port 18789", None);
                return Err("Gateway verification failed".to_string());
            }
        }
    }

    // Step 6: Create desktop shortcut
    emit_step(app, "create_shortcut", "running", "Creating desktop shortcut...", None);
    let openclaw_for_shortcut = find_openclaw();
    match create_desktop_shortcut(&openclaw_for_shortcut, "OpenClaw Gateway") {
        Ok(()) => emit_step(app, "create_shortcut", "done", "Desktop shortcut created", None),
        Err(e) => emit_step(app, "create_shortcut", "done", &format!("Shortcut skipped: {}", e), None),
    }

    Ok(())
}

async fn install_openclaw_docker(app: &AppHandle) -> Result<(), String> {
    // Step 1: Create directory
    emit_step(app, "docker_setup", "running", "Setting up Docker environment...", None);

    let home = dirs::home_dir().ok_or("Cannot determine home directory")?;
    let openclaw_dir = home.join("openclaw");
    std::fs::create_dir_all(&openclaw_dir)
        .map_err(|e| format!("Failed to create directory: {}", e))?;

    // Step 2: Write docker-compose.yml
    let compose_path = openclaw_dir.join("docker-compose.yml");
    let compose_content = r#"version: '3.8'
services:
  openclaw:
    image: openclaw/openclaw:latest
    container_name: openclaw
    restart: unless-stopped
    ports:
      - "18789:18789"
      - "18791:18791"
    volumes:
      - ~/.openclaw:/root/.openclaw
      - ./workspace:/root/openclaw/workspace
    environment:
      - NODE_ENV=production
"#;
    std::fs::write(&compose_path, compose_content)
        .map_err(|e| format!("Failed to write docker-compose.yml: {}", e))?;

    emit_step(app, "docker_setup", "done", "Docker environment ready", None);

    // Step 3: docker compose up
    emit_step(app, "docker_start", "running", "Starting Docker containers...", None);

    let output = Command::new("docker")
        .args(["compose", "up", "-d"])
        .current_dir(&openclaw_dir)
        .output()
        .map_err(|e| {
            let msg = format!("Failed to run docker compose: {}", e);
            emit_step(app, "docker_start", "error", &msg, None);
            msg
        })?;

    let log = format!(
        "{}\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );

    if !output.status.success() {
        emit_step(app, "docker_start", "error", "Docker compose failed", Some(log));
        return Err("Docker compose failed".to_string());
    }
    emit_step(app, "docker_start", "done", "Containers started", Some(log));

    // Step 4: Verify Gateway with retry logic
    emit_step(app, "verify_gateway", "running", "Verifying Gateway...", None);

    tokio::time::sleep(std::time::Duration::from_secs(5)).await;

    // Implement exponential backoff retry (3 attempts)
    let mut gateway_ok = false;
    let mut attempt = 0;
    let max_attempts = 3;

    while attempt < max_attempts && !gateway_ok {
        attempt += 1;
        let wait_secs = 2u64.pow(attempt as u32); // Exponential: 2, 4, 8

        match std::net::TcpStream::connect_timeout(
            &"127.0.0.1:18789".parse().unwrap(),
            std::time::Duration::from_secs(5),
        ) {
            Ok(_) => {
                gateway_ok = true;
                emit_step(app, "verify_gateway", "done", "Gateway is running on port 18789", None);
            }
            Err(_) if attempt < max_attempts => {
                emit_step(
                    app,
                    "verify_gateway",
                    "running",
                    &format!("Gateway not responding, retrying... (attempt {}/{})", attempt, max_attempts),
                    None,
                );
                tokio::time::sleep(std::time::Duration::from_secs(wait_secs)).await;
            }
            Err(_) => {
                emit_step(app, "verify_gateway", "error", "Gateway is not responding on port 18789", None);
                return Err("Gateway verification failed".to_string());
            }
        }
    }

    if gateway_ok {
        Ok(())
    } else {
        Err("Gateway verification failed".to_string())
    }
}

async fn install_openclaw_bundled(app: &AppHandle) -> Result<(), String> {
    use crate::commands::resources::get_resources_dir;

    // Step 1: Extract bundled OpenClaw binary
    emit_step(app, "extract_bundled", "running", "Extracting bundled OpenClaw...", None);

    let resources_dir = get_resources_dir(app)?;
    let bundled_path = resources_dir.join("openclaw");

    if !bundled_path.exists() {
        emit_step(app, "extract_bundled", "error", "Bundled OpenClaw not found", None);
        return Err("Bundled OpenClaw not found in resources".to_string());
    }

    // Copy to installation directory
    let install_dir = if cfg!(target_os = "windows") {
        let program_files = std::env::var("ProgramFiles").unwrap_or_else(|_| "C:\\Program Files".to_string());
        std::path::PathBuf::from(program_files).join("OpenClaw")
    } else if cfg!(target_os = "macos") {
        std::path::PathBuf::from("/Applications/OpenClaw.app")
    } else {
        return Err("Bundled mode not supported on this platform".to_string());
    };

    std::fs::create_dir_all(&install_dir)
        .map_err(|e| format!("Failed to create install directory: {}", e))?;

    // Copy bundled files
    let copy_options = fs_extra::dir::CopyOptions::new();
    fs_extra::dir::copy(&bundled_path, &install_dir, &copy_options)
        .map_err(|e| format!("Failed to copy bundled files: {}", e))?;

    emit_step(app, "extract_bundled", "done", "Bundled OpenClaw extracted", None);

    // Step 2: Write config
    emit_step(app, "write_config", "running", "Writing configuration...", None);

    let config_dir = if cfg!(target_os = "windows") {
        dirs::home_dir()
            .ok_or("Cannot find home directory")?
            .join(".openclaw")
    } else if cfg!(target_os = "macos") {
        dirs::home_dir()
            .ok_or("Cannot find home directory")?
            .join("Library")
            .join("Application Support")
            .join("OpenClaw")
    } else {
        return Err("Bundled mode not supported on this platform".to_string());
    };

    std::fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    let config_path = config_dir.join("openclaw.json");
    let config_content = r#"{
  "gateway": {
    "port": 18789,
    "host": "127.0.0.1"
  },
  "models": [],
  "platforms": []
}"#;

    std::fs::write(&config_path, config_content)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    emit_step(app, "write_config", "done", "Configuration written", None);

    // Step 3: Start Gateway
    emit_step(app, "start_gateway", "running", "Starting Gateway...", None);

    let openclaw_bin = if cfg!(target_os = "windows") {
        install_dir.join("openclaw.exe")
    } else {
        install_dir.join("openclaw")
    };

    let output = Command::new(&openclaw_bin)
        .args(["gateway", "start"])
        .output()
        .map_err(|e| format!("Failed to start gateway: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let log = format!("{}\n{}", stdout, stderr);

    if !output.status.success() {
        emit_step(app, "start_gateway", "error", "Failed to start gateway", Some(log));
        return Err("Failed to start gateway".to_string());
    }

    emit_step(app, "start_gateway", "done", "Gateway started", Some(log));

    // Step 4: Verify Gateway
    emit_step(app, "verify_gateway", "running", "Verifying Gateway...", None);

    tokio::time::sleep(std::time::Duration::from_secs(5)).await;

    let mut gateway_ok = false;
    let mut attempt = 0;
    let max_attempts = 3;

    while attempt < max_attempts && !gateway_ok {
        attempt += 1;
        let wait_secs = 2u64.pow(attempt as u32);

        match std::net::TcpStream::connect_timeout(
            &"127.0.0.1:18789".parse().unwrap(),
            std::time::Duration::from_secs(5),
        ) {
            Ok(_) => {
                gateway_ok = true;
                emit_step(app, "verify_gateway", "done", "Gateway is running on port 18789", None);
            }
            Err(_) if attempt < max_attempts => {
                emit_step(
                    app,
                    "verify_gateway",
                    "running",
                    &format!("Gateway not responding, retrying... (attempt {}/{})", attempt, max_attempts),
                    None,
                );
                tokio::time::sleep(std::time::Duration::from_secs(wait_secs)).await;
            }
            Err(_) => {
                emit_step(app, "verify_gateway", "error", "Gateway is not responding on port 18789", None);
                return Err("Gateway verification failed".to_string());
            }
        }
    }

    // Step 5: Create desktop shortcut
    emit_step(app, "create_shortcut", "running", "Creating desktop shortcut...", None);

    let target = openclaw_bin.to_string_lossy().to_string();
    if let Err(e) = create_desktop_shortcut(&target, "OpenClaw") {
        emit_step(app, "create_shortcut", "error", &format!("Failed to create shortcut: {}", e), None);
        // Non-fatal, continue
    } else {
        emit_step(app, "create_shortcut", "done", "Desktop shortcut created", None);
    }

    // Step 6: Copy NSSM tool for optional service registration
    emit_step(app, "copy_nssm", "running", "Preparing service tools...", None);
    #[cfg(target_os = "windows")]
    {
        let resource_dir = app.path().resource_dir().unwrap_or_default();
        let nssm_source = resource_dir.join("resources").join("tools").join("nssm.exe");
        let appdata = std::env::var("APPDATA").unwrap_or_default();
        let nssm_dest_dir = std::path::PathBuf::from(&appdata).join("OpenClaw").join("tools");
        let nssm_dest = nssm_dest_dir.join("nssm.exe");
        if nssm_source.exists() {
            if let Err(e) = std::fs::create_dir_all(&nssm_dest_dir) {
                emit_step(app, "copy_nssm", "done", &format!("Skipped NSSM setup: {}", e), None);
            } else if let Err(e) = std::fs::copy(&nssm_source, &nssm_dest) {
                emit_step(app, "copy_nssm", "done", &format!("Skipped NSSM setup: {}", e), None);
            } else {
                emit_step(app, "copy_nssm", "done", "Service tools ready", None);
            }
        } else {
            emit_step(app, "copy_nssm", "done", "NSSM not bundled, skipping", None);
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        emit_step(app, "copy_nssm", "done", "Skipped (not Windows)", None);
    }

    if gateway_ok {
        Ok(())
    } else {
        Err("Gateway verification failed".to_string())
    }
}
