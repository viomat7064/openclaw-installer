use serde::Serialize;
use std::process::Command;

#[derive(Debug, Serialize)]
pub struct DoctorCheck {
    pub id: String,
    pub label: String,
    pub ok: bool,
    pub message: String,
}

#[tauri::command]
pub async fn run_doctor() -> Result<Vec<DoctorCheck>, String> {
    let mut checks = Vec::new();

    // Check Node.js
    let node_ok = Command::new("node")
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false);
    checks.push(DoctorCheck {
        id: "nodejs".to_string(),
        label: "Node.js".to_string(),
        ok: node_ok,
        message: if node_ok { "Installed".to_string() } else { "Not found".to_string() },
    });

    // Check openclaw CLI
    let openclaw_cmd = if cfg!(target_os = "windows") {
        let appdata = std::env::var("APPDATA").unwrap_or_default();
        let p = format!("{}\\npm\\openclaw.cmd", appdata);
        if std::path::Path::new(&p).exists() { p } else { "openclaw".to_string() }
    } else {
        "openclaw".to_string()
    };
    let oc_ok = Command::new(&openclaw_cmd)
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false);
    checks.push(DoctorCheck {
        id: "openclaw".to_string(),
        label: "OpenClaw CLI".to_string(),
        ok: oc_ok,
        message: if oc_ok { "Installed".to_string() } else { "Not found".to_string() },
    });

    // Check Gateway port
    let gw_ok = std::net::TcpStream::connect_timeout(
        &"127.0.0.1:18789".parse().unwrap(),
        std::time::Duration::from_secs(2),
    )
    .is_ok();
    checks.push(DoctorCheck {
        id: "gateway".to_string(),
        label: "Gateway (port 18789)".to_string(),
        ok: gw_ok,
        message: if gw_ok { "Running".to_string() } else { "Not responding".to_string() },
    });

    // Check config file
    let home = dirs::home_dir().ok_or("Cannot determine home directory")?;
    let config_path = home.join(".openclaw").join("openclaw.json");
    let config_ok = config_path.exists();
    checks.push(DoctorCheck {
        id: "config".to_string(),
        label: "Config file".to_string(),
        ok: config_ok,
        message: if config_ok {
            config_path.to_string_lossy().to_string()
        } else {
            "Not found".to_string()
        },
    });

    // Check network
    use std::net::{TcpStream, ToSocketAddrs};
    let net_ok = "8.8.8.8:53"
        .to_socket_addrs()
        .ok()
        .and_then(|mut a| a.next())
        .map(|addr| TcpStream::connect_timeout(&addr, std::time::Duration::from_secs(3)).is_ok())
        .unwrap_or(false);
    checks.push(DoctorCheck {
        id: "network".to_string(),
        label: "Network".to_string(),
        ok: net_ok,
        message: if net_ok { "Connected".to_string() } else { "No connection".to_string() },
    });

    Ok(checks)
}
