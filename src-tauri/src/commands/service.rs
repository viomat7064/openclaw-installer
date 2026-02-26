use serde::Serialize;
use std::process::Command;

#[derive(Debug, Serialize)]
pub struct GatewayStatusResult {
    pub running: bool,
    pub pid: Option<u32>,
    pub port: u16,
}

fn find_openclaw() -> String {
    if cfg!(target_os = "windows") {
        let appdata = std::env::var("APPDATA").unwrap_or_default();
        let p = format!("{}\\npm\\openclaw.cmd", appdata);
        if std::path::Path::new(&p).exists() {
            return p;
        }
    }
    "openclaw".to_string()
}

#[tauri::command]
pub async fn gateway_start() -> Result<String, String> {
    let openclaw = find_openclaw();
    let output = Command::new(&openclaw)
        .args(["gateway", "start"])
        .output()
        .map_err(|e| format!("Failed to start gateway: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

#[tauri::command]
pub async fn gateway_stop() -> Result<String, String> {
    let openclaw = find_openclaw();
    let output = Command::new(&openclaw)
        .args(["gateway", "stop"])
        .output()
        .map_err(|e| format!("Failed to stop gateway: {}", e))?;

    if output.status.success() {
        Ok("Gateway stopped".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

#[tauri::command]
pub async fn gateway_restart() -> Result<String, String> {
    let openclaw = find_openclaw();
    let _ = Command::new(&openclaw).args(["gateway", "stop"]).output();
    tokio::time::sleep(std::time::Duration::from_secs(1)).await;
    let output = Command::new(&openclaw)
        .args(["gateway", "start"])
        .output()
        .map_err(|e| format!("Failed to restart gateway: {}", e))?;

    if output.status.success() {
        Ok("Gateway restarted".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

#[tauri::command]
pub async fn gateway_status() -> Result<GatewayStatusResult, String> {
    let port: u16 = 18789;
    let running = std::net::TcpStream::connect_timeout(
        &format!("127.0.0.1:{}", port).parse().unwrap(),
        std::time::Duration::from_secs(2),
    )
    .is_ok();

    Ok(GatewayStatusResult {
        running,
        pid: None,
        port,
    })
}
