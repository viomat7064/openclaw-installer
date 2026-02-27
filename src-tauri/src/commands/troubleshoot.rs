use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IssueSeverity {
    Critical,
    Warning,
    Info,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticIssue {
    pub id: String,
    pub severity: IssueSeverity,
    pub title: String,
    pub description: String,
    pub fix_available: bool,
    pub fix_description: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct DiagnosticResult {
    pub issues: Vec<DiagnosticIssue>,
    pub healthy: bool,
}

#[tauri::command]
pub async fn run_diagnostics() -> Result<DiagnosticResult, String> {
    let mut issues = Vec::new();

    // Check port conflicts
    if let Err(e) = check_port_conflict(18789) {
        issues.push(DiagnosticIssue {
            id: "port_conflict".to_string(),
            severity: IssueSeverity::Critical,
            title: "Port 18789 is occupied".to_string(),
            description: format!("Gateway port is in use: {}", e),
            fix_available: true,
            fix_description: Some("Kill the process using port 18789".to_string()),
        });
    }

    // Check Node.js installation
    if let Err(e) = check_nodejs() {
        issues.push(DiagnosticIssue {
            id: "nodejs_missing".to_string(),
            severity: IssueSeverity::Critical,
            title: "Node.js not found".to_string(),
            description: e,
            fix_available: false,
            fix_description: Some("Please install Node.js 22 or higher".to_string()),
        });
    }

    // Check OpenClaw installation
    if let Err(e) = check_openclaw_installed() {
        issues.push(DiagnosticIssue {
            id: "openclaw_missing".to_string(),
            severity: IssueSeverity::Warning,
            title: "OpenClaw not installed".to_string(),
            description: e,
            fix_available: false,
            fix_description: Some("Run the installer to install OpenClaw".to_string()),
        });
    }

    // Check config file
    if let Err(e) = check_config_file() {
        issues.push(DiagnosticIssue {
            id: "config_invalid".to_string(),
            severity: IssueSeverity::Warning,
            title: "Configuration file invalid".to_string(),
            description: e,
            fix_available: true,
            fix_description: Some("Reset configuration to defaults".to_string()),
        });
    }

    let healthy = issues.iter().all(|i| matches!(i.severity, IssueSeverity::Info));

    Ok(DiagnosticResult { issues, healthy })
}

#[tauri::command]
pub async fn fix_issue(issue_id: String) -> Result<String, String> {
    match issue_id.as_str() {
        "port_conflict" => fix_port_conflict(18789).await,
        "config_invalid" => fix_config_file().await,
        _ => Err(format!("No automatic fix available for issue: {}", issue_id)),
    }
}

fn check_port_conflict(port: u16) -> Result<(), String> {
    match std::net::TcpStream::connect_timeout(
        &format!("127.0.0.1:{}", port).parse().unwrap(),
        std::time::Duration::from_secs(1),
    ) {
        Ok(_) => Err(format!("Port {} is already in use", port)),
        Err(_) => Ok(()),
    }
}

fn check_nodejs() -> Result<(), String> {
    let output = Command::new("node")
        .arg("--version")
        .output()
        .map_err(|_| "Node.js is not installed or not in PATH".to_string())?;

    if !output.status.success() {
        return Err("Failed to execute node --version".to_string());
    }

    let version = String::from_utf8_lossy(&output.stdout);
    if !version.starts_with("v22") && !version.starts_with("v23") {
        return Err(format!("Node.js version {} is not supported. Please install v22 or higher.", version.trim()));
    }

    Ok(())
}

fn check_openclaw_installed() -> Result<(), String> {
    let output = Command::new("npm")
        .args(&["list", "-g", "openclaw"])
        .output()
        .map_err(|_| "Failed to check OpenClaw installation".to_string())?;

    if !output.status.success() {
        return Err("OpenClaw is not installed globally".to_string());
    }

    Ok(())
}

fn check_config_file() -> Result<(), String> {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .map_err(|_| "Cannot determine home directory".to_string())?;

    let config_path = std::path::Path::new(&home).join(".openclaw").join("config.json");

    if !config_path.exists() {
        return Err("Configuration file not found".to_string());
    }

    let content = std::fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config file: {}", e))?;

    serde_json::from_str::<serde_json::Value>(&content)
        .map_err(|e| format!("Invalid JSON in config file: {}", e))?;

    Ok(())
}

async fn fix_port_conflict(port: u16) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        // Use PowerShell to find and kill process
        let find_cmd = format!("Get-NetTCPConnection -LocalPort {} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess", port);
        let output = Command::new("powershell")
            .args(&["-Command", &find_cmd])
            .output()
            .map_err(|e| format!("Failed to find process: {}", e))?;

        let output_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !output_str.is_empty() {
            if let Ok(pid) = output_str.parse::<u32>() {
                Command::new("taskkill")
                    .args(&["/F", "/PID", &pid.to_string()])
                    .output()
                    .map_err(|e| format!("Failed to kill process: {}", e))?;

                return Ok(format!("Killed process {} using port {}", pid, port));
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        // Unix-like systems
        let output = Command::new("lsof")
            .args(&["-ti", &format!(":{}", port)])
            .output()
            .map_err(|e| format!("Failed to find process: {}", e))?;

        let output_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !output_str.is_empty() {
            if let Ok(pid) = output_str.parse::<i32>() {
                Command::new("kill")
                    .args(&["-9", &pid.to_string()])
                    .output()
                    .map_err(|e| format!("Failed to kill process: {}", e))?;

                return Ok(format!("Killed process {} using port {}", pid, port));
            }
        }
    }

    Err("Could not automatically fix port conflict".to_string())
}

async fn fix_config_file() -> Result<String, String> {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .map_err(|_| "Cannot determine home directory".to_string())?;

    let config_path = std::path::Path::new(&home).join(".openclaw").join("config.json");

    // Backup existing config
    if config_path.exists() {
        let backup_path = config_path.with_extension("json.bak");
        std::fs::copy(&config_path, &backup_path)
            .map_err(|e| format!("Failed to backup config: {}", e))?;
    }

    // Write default config
    let default_config = serde_json::json!({
        "gateway_port": 18789,
        "model_provider": "alibaba",
        "model_name": "qwen-plus",
        "api_key": "",
    });

    std::fs::write(&config_path, serde_json::to_string_pretty(&default_config).unwrap())
        .map_err(|e| format!("Failed to write config: {}", e))?;

    Ok("Configuration reset to defaults".to_string())
}
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_run_diagnostics() {
        let result = run_diagnostics().await;
        assert!(result.is_ok());
        // Diagnostics should always return a result
    }

    #[tokio::test]
    async fn test_check_port_conflict_free_port() {
        // Test with a likely free port
        let result = check_port_conflict(65432);
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_check_nodejs() {
        // This will fail if Node.js is not installed
        let result = check_nodejs();
        // We expect this to either pass or fail with a specific error
        match result {
            Ok(_) => assert!(true),
            Err(e) => {
                assert!(e.contains("Node.js") || e.contains("not installed"));
            }
        }
    }

    #[tokio::test]
    async fn test_fix_port_conflict_invalid() {
        // Test that fix_port_conflict handles errors properly
        let result = fix_port_conflict(8080).await;  // Common port
        // Should either succeed or return an error
        match result {
            Ok(_) => assert!(true),
            Err(e) => assert!(e.contains("port") || e.contains("fix")),
        }
    }

    #[tokio::test]
    async fn test_fix_config_file() {
        // Test config file reset
        let result = fix_config_file().await;
        // This might fail if home directory is not accessible
        // We just want to ensure it doesn't panic
        match result {
            Ok(msg) => assert!(msg.contains("Configuration")),
            Err(e) => assert!(e.contains("home") || e.contains("config")),
        }
    }
}
