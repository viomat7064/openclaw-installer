use serde::Serialize;
use std::process::Command;
use tauri::{AppHandle, Emitter};

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
    let desktop = dirs::desktop_dir().ok_or("Cannot find desktop directory")?;
    let lnk_path = desktop.join(format!("{}.lnk", name));
    let ps_script = format!(
        "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('{}'); $s.TargetPath = '{}'; $s.WorkingDirectory = '%USERPROFILE%'; $s.Save()",
        lnk_path.to_string_lossy().replace('\'', "''"),
        target.replace('\'', "''")
    );
    Command::new("powershell")
        .args(["-NoProfile", "-Command", &ps_script])
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

    // Step 5: Verify Gateway
    emit_step(app, "verify_gateway", "running", "Verifying Gateway...", None);

    // Wait a moment for gateway to start
    tokio::time::sleep(std::time::Duration::from_secs(3)).await;

    let gateway_ok = std::net::TcpStream::connect_timeout(
        &"127.0.0.1:18789".parse().unwrap(),
        std::time::Duration::from_secs(5),
    )
    .is_ok();

    if gateway_ok {
        emit_step(app, "verify_gateway", "done", "Gateway is running on port 18789", None);
    } else {
        emit_step(app, "verify_gateway", "error", "Gateway is not responding on port 18789", None);
        return Err("Gateway verification failed".to_string());
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

    // Step 4: Verify
    emit_step(app, "verify_gateway", "running", "Verifying Gateway...", None);

    tokio::time::sleep(std::time::Duration::from_secs(5)).await;

    let gateway_ok = std::net::TcpStream::connect_timeout(
        &"127.0.0.1:18789".parse().unwrap(),
        std::time::Duration::from_secs(5),
    )
    .is_ok();

    if gateway_ok {
        emit_step(app, "verify_gateway", "done", "Gateway is running on port 18789", None);
        Ok(())
    } else {
        emit_step(app, "verify_gateway", "error", "Gateway is not responding", None);
        Err("Gateway verification failed".to_string())
    }
}
