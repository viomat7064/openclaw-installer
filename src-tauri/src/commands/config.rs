use serde::{Deserialize, Serialize};
use std::fs;
use std::net::{TcpStream, ToSocketAddrs};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformEntry {
    pub platform: String,
    pub token: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenClawConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_provider: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_endpoint: Option<String>,
    pub gateway_port: u16,
    #[serde(default)]
    pub platforms: Vec<PlatformEntry>,
}

impl Default for OpenClawConfig {
    fn default() -> Self {
        Self {
            model_provider: None,
            model_name: None,
            api_key: None,
            api_endpoint: None,
            gateway_port: 18789,
            platforms: Vec::new(),
        }
    }
}

fn get_openclaw_dir() -> Result<std::path::PathBuf, String> {
    let home = dirs::home_dir().ok_or("Cannot determine home directory")?;
    Ok(home.join(".openclaw"))
}

#[tauri::command]
pub async fn write_openclaw_config(config: OpenClawConfig) -> Result<(), String> {
    let dir = get_openclaw_dir()?;
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    let config_path = dir.join("openclaw.json");
    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&config_path, json)
        .map_err(|e| format!("Failed to write config file: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn read_openclaw_config() -> Result<OpenClawConfig, String> {
    let dir = get_openclaw_dir()?;
    let config_path = dir.join("openclaw.json");
    if !config_path.exists() {
        return Ok(OpenClawConfig::default());
    }
    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;
    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse config: {}", e))
}

#[tauri::command]
pub async fn detect_npm_registry() -> Result<String, String> {
    let official = "registry.npmjs.org:443";
    let can_reach_official = if let Ok(mut addrs) = official.to_socket_addrs() {
        if let Some(addr) = addrs.next() {
            TcpStream::connect_timeout(&addr, Duration::from_secs(3)).is_ok()
        } else {
            false
        }
    } else {
        false
    };

    if can_reach_official {
        Ok("https://registry.npmjs.org".to_string())
    } else {
        Ok("https://registry.npmmirror.com".to_string())
    }
}

#[tauri::command]
pub async fn test_api_connection(
    provider: String,
    api_key: String,
    endpoint: String,
    model: String,
) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| format!("HTTP client error: {}", e))?;

    // Build request based on provider type
    let (url, body) = match provider.as_str() {
        "ollama" => {
            let url = format!("{}/api/tags", endpoint.trim_end_matches('/'));
            return match client.get(&url).send().await {
                Ok(resp) if resp.status().is_success() => Ok("Ollama connected".to_string()),
                Ok(resp) => Err(format!("Ollama returned status {}", resp.status())),
                Err(e) => Err(format!("Cannot reach Ollama: {}", e)),
            };
        }
        _ => {
            // OpenAI-compatible API (works for most providers)
            let url = format!("{}/chat/completions", endpoint.trim_end_matches('/'));
            let body = serde_json::json!({
                "model": model,
                "messages": [{"role": "user", "content": "hi"}],
                "max_tokens": 5
            });
            (url, body)
        }
    };

    let resp = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;

    if resp.status().is_success() {
        Ok("Connection successful".to_string())
    } else {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        Err(format!("API returned {} — {}", status, text))
    }
}
