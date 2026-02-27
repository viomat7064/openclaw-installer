import { useState } from 'react';
import { useModelManagement, ModelParameters, ModelPreset } from '../hooks/useModelManagement';
import { useTranslation } from 'react-i18next';

export function ModelManagement() {
  const { t } = useTranslation();
  const { providers, presets, stats, loading, validateParameters } = useModelManagement();
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [parameters, setParameters] = useState<ModelParameters>({
    temperature: 0.7,
    max_tokens: 4096,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    stream: true,
  });

  const handlePresetSelect = (preset: ModelPreset) => {
    setParameters(preset.parameters);
  };

  const handleParameterChange = (key: keyof ModelParameters, value: number | boolean) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const isValid = await validateParameters(parameters);
    if (isValid) {
      // TODO: Save to config
      alert('Parameters saved successfully!');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Provider Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Model Provider</label>
        <select
          value={selectedProvider}
          onChange={(e) => {
            setSelectedProvider(e.target.value);
            const provider = providers.find(p => p.id === e.target.value);
            if (provider) {
              setSelectedModel(provider.default_model);
            }
          }}
          className="w-full p-2 border rounded-md"
        >
          <option value="">Select a provider...</option>
          {providers.map(provider => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
      </div>

      {/* Model Selection */}
      {selectedProvider && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Model</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            {providers
              .find(p => p.id === selectedProvider)
              ?.models.map(model => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Presets */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Parameter Presets</label>
        <div className="grid grid-cols-3 gap-2">
          {presets.map(preset => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(preset)}
              className="p-3 border rounded-md hover:bg-gray-50 text-left"
            >
              <div className="font-medium">{preset.name}</div>
              <div className="text-xs text-gray-500">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Parameter Sliders */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium flex justify-between">
            <span>Temperature</span>
            <span className="text-gray-500">{parameters.temperature.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={parameters.temperature}
            onChange={(e) => handleParameterChange('temperature', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex justify-between">
            <span>Max Tokens</span>
            <span className="text-gray-500">{parameters.max_tokens}</span>
          </label>
          <input
            type="range"
            min="256"
            max="8192"
            step="256"
            value={parameters.max_tokens}
            onChange={(e) => handleParameterChange('max_tokens', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex justify-between">
            <span>Top P</span>
            <span className="text-gray-500">{parameters.top_p.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={parameters.top_p}
            onChange={(e) => handleParameterChange('top_p', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex justify-between">
            <span>Frequency Penalty</span>
            <span className="text-gray-500">{parameters.frequency_penalty.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={parameters.frequency_penalty}
            onChange={(e) => handleParameterChange('frequency_penalty', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex justify-between">
            <span>Presence Penalty</span>
            <span className="text-gray-500">{parameters.presence_penalty.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={parameters.presence_penalty}
            onChange={(e) => handleParameterChange('presence_penalty', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="stream"
            checked={parameters.stream}
            onChange={(e) => handleParameterChange('stream', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="stream" className="text-sm font-medium">
            Enable Streaming
          </label>
        </div>
      </div>

      {/* Usage Stats */}
      {stats.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Usage Statistics</label>
          <div className="border rounded-md p-4 space-y-2">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{stat.provider} / {stat.model}</span>
                <span className="text-gray-500">
                  {stat.total_requests} requests, {stat.total_tokens} tokens
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Save Parameters
      </button>
    </div>
  );
}
