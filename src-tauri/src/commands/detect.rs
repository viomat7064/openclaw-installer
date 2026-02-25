use serde::Serialize;
use std::process::Command;
use sysinfo::{Disks, System};

#[derive(Debug, Serialize)]
pub struct EnvDetectionResult {
    pub os_ok: bool,
    pub os_info: String,
    pub nodejs_installed: bool,
    pub nodejs_version: String,
    pub docker_installed: bool,
    pub docker_version: String,
    pub wsl2_enabled: bool,
    pub disk_ok: bool,
    pub disk_available: String,
    pub memory_ok: bool,
    pub memory_total: String,
    pub network_ok: bool,
}

fn format_bytes(bytes: u64) -> String {
    let gb = bytes as f64 / 1_073_741_824.0;
    if gb >= 1.0 {
        format!("{:.1} GB", gb)
    } else {
        let mb = bytes as f64 / 1_048_576.0;
        format!("{:.0} MB", mb)
    }
}

fn check_os() -> (bool, String) {
    let info = System::long_os_version().unwrap_or_default();

    if cfg!(target_os = "windows") {
        // Check Windows 10+
        let os_ok = System::os_version()
            .and_then(|v| v.split('.').next().map(|s| s.to_string()))
            .and_then(|major| major.parse::<u32>().ok())
            .map(|major| major >= 10)
            .unwrap_or(false);
        (os_ok, info)
    } else {
        // Linux/macOS dev mode — always OK
        (true, format!("{} (dev mode)", info))
    }
}

fn check_nodejs() -> (bool, String) {
    match Command::new("node").arg("--version").output() {
        Ok(output) if output.status.success() => {
            let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
            // Parse major version from "v22.x.x"
            let major = version
                .trim_start_matches('v')
                .split('.')
                .next()
                .and_then(|s| s.parse::<u32>().ok())
                .unwrap_or(0);
            (major >= 22, version)
        }
        _ => (false, String::new()),
    }
}

fn check_docker() -> (bool, String) {
    match Command::new("docker").arg("--version").output() {
        Ok(output) if output.status.success() => {
            let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
            (true, version)
        }
        _ => (false, String::new()),
    }
}

fn check_wsl2() -> bool {
    if !cfg!(target_os = "windows") {
        return false;
    }
    Command::new("wsl")
        .arg("--status")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

fn check_disk() -> (bool, String) {
    let disks = Disks::new_with_refreshed_list();
    let max_available = disks
        .iter()
        .map(|d| d.available_space())
        .max()
        .unwrap_or(0);
    let five_gb = 5 * 1_073_741_824u64;
    (max_available >= five_gb, format_bytes(max_available))
}

fn check_memory() -> (bool, String) {
    let mut sys = System::new();
    sys.refresh_memory();
    let total = sys.total_memory();
    let four_gb = 4 * 1_073_741_824u64;
    (total >= four_gb, format_bytes(total))
}

fn check_network() -> bool {
    use std::net::{TcpStream, ToSocketAddrs};
    use std::time::Duration;

    // Try connecting to Google DNS
    if let Ok(mut addrs) = "8.8.8.8:53".to_socket_addrs() {
        if let Some(addr) = addrs.next() {
            return TcpStream::connect_timeout(&addr, Duration::from_secs(5)).is_ok();
        }
    }
    false
}

#[tauri::command]
pub async fn detect_environment() -> Result<EnvDetectionResult, String> {
    let (os_ok, os_info) = check_os();
    let (nodejs_installed, nodejs_version) = check_nodejs();
    let (docker_installed, docker_version) = check_docker();
    let wsl2_enabled = check_wsl2();
    let (disk_ok, disk_available) = check_disk();
    let (memory_ok, memory_total) = check_memory();
    let network_ok = check_network();

    Ok(EnvDetectionResult {
        os_ok,
        os_info,
        nodejs_installed,
        nodejs_version,
        docker_installed,
        docker_version,
        wsl2_enabled,
        disk_ok,
        disk_available,
        memory_ok,
        memory_total,
        network_ok,
    })
}
