use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelProvider {
    pub id: String,
    pub name: String,
    pub models: Vec<String>,
    pub default_model: String,
    pub supports_streaming: bool,
    pub max_tokens: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelParameters {
    pub temperature: f32,
    pub max_tokens: u32,
    pub top_p: f32,
    pub frequency_penalty: f32,
    pub presence_penalty: f32,
    pub stream: bool,
}

impl Default for ModelParameters {
    fn default() -> Self {
        Self {
            temperature: 0.7,
            max_tokens: 4096,
            top_p: 1.0,
            frequency_penalty: 0.0,
            presence_penalty: 0.0,
            stream: true,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModelPreset {
    pub name: String,
    pub description: String,
    pub parameters: ModelParameters,
}

#[tauri::command]
pub async fn get_available_providers() -> Result<Vec<ModelProvider>, String> {
    Ok(vec![
        ModelProvider {
            id: "alibaba".to_string(),
            name: "阿里云百炼 / 通义千问".to_string(),
            models: vec![
                "qwen-max".to_string(),
                "qwen-plus".to_string(),
                "qwen-turbo".to_string(),
            ],
            default_model: "qwen-plus".to_string(),
            supports_streaming: true,
            max_tokens: 8192,
        },
        ModelProvider {
            id: "deepseek".to_string(),
            name: "深度求索 DeepSeek".to_string(),
            models: vec![
                "deepseek-chat".to_string(),
                "deepseek-coder".to_string(),
            ],
            default_model: "deepseek-chat".to_string(),
            supports_streaming: true,
            max_tokens: 4096,
        },
        ModelProvider {
            id: "zhipu".to_string(),
            name: "智谱 AI / GLM".to_string(),
            models: vec![
                "glm-4".to_string(),
                "glm-4-air".to_string(),
                "glm-3-turbo".to_string(),
            ],
            default_model: "glm-4".to_string(),
            supports_streaming: true,
            max_tokens: 8192,
        },
        ModelProvider {
            id: "anthropic".to_string(),
            name: "Anthropic Claude".to_string(),
            models: vec![
                "claude-3-5-sonnet-20241022".to_string(),
                "claude-3-opus-20240229".to_string(),
                "claude-3-haiku-20240307".to_string(),
            ],
            default_model: "claude-3-5-sonnet-20241022".to_string(),
            supports_streaming: true,
            max_tokens: 8192,
        },
        ModelProvider {
            id: "openai".to_string(),
            name: "OpenAI".to_string(),
            models: vec![
                "gpt-4-turbo".to_string(),
                "gpt-4".to_string(),
                "gpt-3.5-turbo".to_string(),
            ],
            default_model: "gpt-4-turbo".to_string(),
            supports_streaming: true,
            max_tokens: 4096,
        },
    ])
}

#[tauri::command]
pub async fn get_model_presets() -> Result<Vec<ModelPreset>, String> {
    Ok(vec![
        ModelPreset {
            name: "Creative".to_string(),
            description: "高创造力，适合创意写作和头脑风暴".to_string(),
            parameters: ModelParameters {
                temperature: 1.0,
                max_tokens: 4096,
                top_p: 0.95,
                frequency_penalty: 0.5,
                presence_penalty: 0.5,
                stream: true,
            },
        },
        ModelPreset {
            name: "Balanced".to_string(),
            description: "平衡模式，适合日常对话".to_string(),
            parameters: ModelParameters::default(),
        },
        ModelPreset {
            name: "Precise".to_string(),
            description: "精确模式，适合技术问答和代码生成".to_string(),
            parameters: ModelParameters {
                temperature: 0.3,
                max_tokens: 4096,
                top_p: 0.9,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                stream: true,
            },
        },
    ])
}

#[tauri::command]
pub async fn validate_model_parameters(params: ModelParameters) -> Result<bool, String> {
    if params.temperature < 0.0 || params.temperature > 2.0 {
        return Err("Temperature must be between 0.0 and 2.0".to_string());
    }
    if params.max_tokens < 1 || params.max_tokens > 32768 {
        return Err("Max tokens must be between 1 and 32768".to_string());
    }
    if params.top_p < 0.0 || params.top_p > 1.0 {
        return Err("Top P must be between 0.0 and 1.0".to_string());
    }
    if params.frequency_penalty < -2.0 || params.frequency_penalty > 2.0 {
        return Err("Frequency penalty must be between -2.0 and 2.0".to_string());
    }
    if params.presence_penalty < -2.0 || params.presence_penalty > 2.0 {
        return Err("Presence penalty must be between -2.0 and 2.0".to_string());
    }
    Ok(true)
}

#[derive(Debug, Serialize)]
pub struct ModelUsageStats {
    pub provider: String,
    pub model: String,
    pub total_requests: u64,
    pub total_tokens: u64,
    pub avg_response_time_ms: u64,
    pub success_rate: f32,
}

#[tauri::command]
pub async fn get_model_usage_stats() -> Result<Vec<ModelUsageStats>, String> {
    // TODO: Implement actual stats tracking
    // For now, return mock data
    Ok(vec![
        ModelUsageStats {
            provider: "alibaba".to_string(),
            model: "qwen-plus".to_string(),
            total_requests: 42,
            total_tokens: 15234,
            avg_response_time_ms: 1250,
            success_rate: 0.98,
        },
    ])
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_model_parameters_default() {
        let params = ModelParameters::default();
        assert_eq!(params.temperature, 0.7);
        assert_eq!(params.max_tokens, 4096);
        assert_eq!(params.top_p, 1.0);
        assert!(params.stream);
    }

    #[tokio::test]
    async fn test_validate_model_parameters_valid() {
        let params = ModelParameters {
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 0.9,
            frequency_penalty: 0.0,
            presence_penalty: 0.0,
            stream: true,
        };
        let result = validate_model_parameters(params).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_validate_model_parameters_invalid_temperature() {
        let params = ModelParameters {
            temperature: 3.0, // Invalid: > 2.0
            max_tokens: 2048,
            top_p: 0.9,
            frequency_penalty: 0.0,
            presence_penalty: 0.0,
            stream: true,
        };
        let result = validate_model_parameters(params).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_get_available_providers() {
        let result = get_available_providers().await;
        assert!(result.is_ok());
        let providers = result.unwrap();
        assert!(!providers.is_empty());
        assert!(providers.iter().any(|p| p.id == "alibaba"));
    }

    #[tokio::test]
    async fn test_get_model_presets() {
        let result = get_model_presets().await;
        assert!(result.is_ok());
        let presets = result.unwrap();
        assert_eq!(presets.len(), 3);
        assert!(presets.iter().any(|p| p.name == "Creative"));
        assert!(presets.iter().any(|p| p.name == "Balanced"));
        assert!(presets.iter().any(|p| p.name == "Precise"));
    }
}
