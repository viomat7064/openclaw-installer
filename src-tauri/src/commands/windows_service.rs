use serde::Serialize;
#[cfg(target_os = "windows")]
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize)]
pub struct ServiceStatus {
    pub installed: bool,
    pub running: bool,
    pub service_name: String,
    pub startup_type: String,
}

#[cfg(target_os = "windows")]
fn get_nssm_path() -> Result<PathBuf, String> {
    let appdata = std::env::var("APPDATA").map_err(|_| "Cannot find APPDATA")?;
    let nssm_path = PathBuf::from(appdata)
        .join("OpenClaw")
        .join("tools")
        .join("nssm.exe");
    if nssm_path.exists() {
        return Ok(nssm_path);
    }
    Err("NSSM not found. Please reinstall OpenClaw Installer.".to_string())
}

#[cfg(target_os = "windows")]
fn get_openclaw_cmd_path() -> Result<PathBuf, String> {
    let appdata = std::env::var("APPDATA").map_err(|_| "Cannot find APPDATA")?;
    let p = PathBuf::from(appdata).join("npm").join("openclaw.cmd");
    if p.exists() {
        return Ok(p);
    }
    Err("openclaw.cmd not found".to_string())
}

const SERVICE_NAME: &str = "OpenClawGateway";

#[tauri::command]
pub async fn check_service_status() -> Result<ServiceStatus, String> {
    #[cfg(not(target_os = "windows"))]
    {
        Ok(ServiceStatus {
            installed: false,
            running: false,
            service_name: SERVICE_NAME.to_string(),
            startup_type: "Unsupported".to_string(),
        })
    }

    #[cfg(target_os = "windows")]
    {
        let output = std::process::Command::new("sc")
            .args(["query", SERVICE_NAME])
            .output()
            .map_err(|e| format!("Failed to query service: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let installed = output.status.success();
        let running = stdout.contains("RUNNING");

        let startup_type = if installed {
            let config_output = std::process::Command::new("sc")
                .args(["qc", SERVICE_NAME])
                .output()
                .ok();
            if let Some(out) = config_output {
                let s = String::from_utf8_lossy(&out.stdout);
                if s.contains("AUTO_START") {
                    "Automatic".to_string()
                } else if s.contains("DEMAND_START") {
                    "Manual".to_string()
                } else {
                    "Unknown".to_string()
                }
            } else {
                "Unknown".to_string()
            }
        } else {
            "Not Installed".to_string()
        };

        Ok(ServiceStatus {
            installed,
            running,
            service_name: SERVICE_NAME.to_string(),
            startup_type,
        })
    }
}

#[tauri::command]
pub async fn register_service() -> Result<String, String> {
    #[cfg(not(target_os = "windows"))]
    {
        Err("Windows Service is only supported on Windows".to_string())
    }

    #[cfg(target_os = "windows")]
    {
        // Check if already registered
        let status = check_service_status().await?;
        if status.installed {
            return Err("Service is already registered".to_string());
        }

        let nssm = get_nssm_path()?;
        let openclaw_cmd = get_openclaw_cmd_path()?;
        let home = dirs::home_dir().ok_or("Cannot find home directory")?;
        let config_dir = home.join(".openclaw");
        let log_dir = config_dir.join("logs");

        std::fs::create_dir_all(&log_dir)
            .map_err(|e| format!("Failed to create log directory: {}", e))?;

        // Install service
        let install_output = std::process::Command::new(&nssm)
            .args([
                "install",
                SERVICE_NAME,
                openclaw_cmd.to_str().unwrap_or("openclaw.cmd"),
                "gateway",
                "start",
            ])
            .output()
            .map_err(|e| format!("Failed to install service: {}", e))?;

        if !install_output.status.success() {
            let stderr = String::from_utf8_lossy(&install_output.stderr);
            return Err(format!("NSSM install failed: {}", stderr));
        }

        // Configure service
        let log_stdout = log_dir.join("gateway-service.log");
        let log_stderr = log_dir.join("gateway-service-error.log");

        let configs: Vec<(&str, String)> = vec![
            ("AppDirectory", config_dir.to_string_lossy().to_string()),
            ("DisplayName", "OpenClaw Gateway Service".to_string()),
            ("Description", "OpenClaw AI Agent Gateway - Auto-start service".to_string()),
            ("Start", "SERVICE_AUTO_START".to_string()),
            ("AppStdout", log_stdout.to_string_lossy().to_string()),
            ("AppStderr", log_stderr.to_string_lossy().to_string()),
            ("AppRotateFiles", "1".to_string()),
            ("AppRotateBytes", "10485760".to_string()),
        ];

        for (key, value) in &configs {
            let _ = std::process::Command::new(&nssm)
                .args(["set", SERVICE_NAME, key, value])
                .output();
        }

        // Start service
        let start_output = std::process::Command::new(&nssm)
            .args(["start", SERVICE_NAME])
            .output()
            .map_err(|e| format!("Failed to start service: {}", e))?;

        if !start_output.status.success() {
            let stderr = String::from_utf8_lossy(&start_output.stderr);
            return Err(format!("Failed to start service: {}", stderr));
        }

        Ok("Service registered and started successfully".to_string())
    }
}

#[tauri::command]
pub async fn unregister_service() -> Result<String, String> {
    #[cfg(not(target_os = "windows"))]
    {
        Err("Windows Service is only supported on Windows".to_string())
    }

    #[cfg(target_os = "windows")]
    {
        let status = check_service_status().await?;
        if !status.installed {
            return Err("Service is not registered".to_string());
        }

        let nssm = get_nssm_path()?;

        // Stop service first
        let _ = std::process::Command::new(&nssm)
            .args(["stop", SERVICE_NAME])
            .output();

        tokio::time::sleep(std::time::Duration::from_secs(2)).await;

        // Remove service
        let remove_output = std::process::Command::new(&nssm)
            .args(["remove", SERVICE_NAME, "confirm"])
            .output()
            .map_err(|e| format!("Failed to remove service: {}", e))?;

        if !remove_output.status.success() {
            let stderr = String::from_utf8_lossy(&remove_output.stderr);
            return Err(format!("NSSM remove failed: {}", stderr));
        }

        Ok("Service unregistered successfully".to_string())
    }
}

#[tauri::command]
pub async fn start_windows_service() -> Result<String, String> {
    #[cfg(not(target_os = "windows"))]
    {
        Err("Windows Service is only supported on Windows".to_string())
    }

    #[cfg(target_os = "windows")]
    {
        let nssm = get_nssm_path()?;
        let output = std::process::Command::new(&nssm)
            .args(["start", SERVICE_NAME])
            .output()
            .map_err(|e| format!("Failed to start service: {}", e))?;

        if output.status.success() {
            Ok("Service started".to_string())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }
}

#[tauri::command]
pub async fn stop_windows_service() -> Result<String, String> {
    #[cfg(not(target_os = "windows"))]
    {
        Err("Windows Service is only supported on Windows".to_string())
    }

    #[cfg(target_os = "windows")]
    {
        let nssm = get_nssm_path()?;
        let output = std::process::Command::new(&nssm)
            .args(["stop", SERVICE_NAME])
            .output()
            .map_err(|e| format!("Failed to stop service: {}", e))?;

        if output.status.success() {
            Ok("Service stopped".to_string())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }
}
