import { invoke } from '@tauri-apps/api/core';
import { useState, useEffect } from 'react';

export interface ModelProvider {
  id: string;
  name: string;
  models: string[];
  default_model: string;
  supports_streaming: boolean;
  max_tokens: number;
}

export interface ModelParameters {
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  stream: boolean;
}

export interface ModelPreset {
  name: string;
  description: string;
  parameters: ModelParameters;
}

export interface ModelUsageStats {
  provider: string;
  model: string;
  total_requests: number;
  total_tokens: number;
  avg_response_time_ms: number;
  success_rate: number;
}

export function useModelManagement() {
  const [providers, setProviders] = useState<ModelProvider[]>([]);
  const [presets, setPresets] = useState<ModelPreset[]>([]);
  const [stats, setStats] = useState<ModelUsageStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<ModelProvider[]>('get_available_providers');
      setProviders(result);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const loadPresets = async () => {
    try {
      const result = await invoke<ModelPreset[]>('get_model_presets');
      setPresets(result);
    } catch (err) {
      console.error('Failed to load presets:', err);
    }
  };

  const loadStats = async () => {
    try {
      const result = await invoke<ModelUsageStats[]>('get_model_usage_stats');
      setStats(result);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const validateParameters = async (params: ModelParameters): Promise<boolean> => {
    try {
      await invoke<boolean>('validate_model_parameters', { params });
      return true;
    } catch (err) {
      setError(err as string);
      return false;
    }
  };

  useEffect(() => {
    loadProviders();
    loadPresets();
    loadStats();
  }, []);

  return {
    providers,
    presets,
    stats,
    loading,
    error,
    loadProviders,
    loadPresets,
    loadStats,
    validateParameters,
  };
}
