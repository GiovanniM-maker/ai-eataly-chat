import { useState, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { ALL_MODELS, getModelDisplayName } from '../constants/models';

/**
 * Model Settings Panel - Full configuration UI for all models
 */
const ModelSettings = ({ isOpen, onClose }) => {
  const { modelConfigs, loadModelConfig, saveModelConfig, loadAllModelConfigs, debugMode, setDebugMode } = useChatStore();
  const [selectedModel, setSelectedModel] = useState(ALL_MODELS[0]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load all configs on mount
  useEffect(() => {
    if (isOpen) {
      loadAllModelConfigs();
    }
  }, [isOpen, loadAllModelConfigs]);

  // Load config when model changes
  useEffect(() => {
    if (selectedModel && isOpen) {
      loadConfigForModel(selectedModel);
    }
  }, [selectedModel, isOpen]);

  const loadConfigForModel = async (modelId) => {
    setLoading(true);
    try {
      const loadedConfig = await loadModelConfig(modelId);
      setConfig(loadedConfig);
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      await saveModelConfig(config);
      setHasChanges(false);
      alert('Model configuration saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error saving configuration: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset to default values? This will discard all changes.')) {
      loadConfigForModel(selectedModel);
    }
  };

  if (!isOpen) return null;

  const aspectRatios = [
    { value: '1:1', label: '1:1 (Square)' },
    { value: '16:9', label: '16:9 (Landscape)' },
    { value: '9:16', label: '9:16 (Portrait)' },
    { value: '3:2', label: '3:2 (Landscape)' },
    { value: '4:3', label: '4:3 (Landscape)' },
    { value: '21:9', label: '21:9 (Ultrawide)' }
  ];

  const outputTypes = [
    { value: 'TEXT', label: 'Text Only' },
    { value: 'IMAGE', label: 'Image Only' },
    { value: 'TEXT+IMAGE', label: 'Text + Image' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Model Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading configuration...</div>
          ) : !config ? (
            <div className="text-center text-gray-400 py-8">No configuration loaded</div>
          ) : (
            <div className="space-y-6">
              {/* Model Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ALL_MODELS.map(model => (
                    <option key={model} value={model}>
                      {getModelDisplayName(model)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={config.displayName}
                  onChange={(e) => handleConfigChange('displayName', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={config.description}
                  onChange={(e) => handleConfigChange('description', e.target.value)}
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* System Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  System Prompt
                </label>
                <textarea
                  value={config.systemPrompt}
                  onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
                  rows={4}
                  placeholder="Enter system instructions..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                />
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Temperature: {config.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0 (Deterministic)</span>
                  <span>1 (Balanced)</span>
                  <span>2 (Creative)</span>
                </div>
              </div>

              {/* Top P */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Top P: {config.topP}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.topP}
                  onChange={(e) => handleConfigChange('topP', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0 (Focused)</span>
                  <span>1 (Diverse)</span>
                </div>
              </div>

              {/* Max Output Tokens */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Output Tokens
                </label>
                <input
                  type="number"
                  min="1"
                  max="32768"
                  value={config.maxOutputTokens}
                  onChange={(e) => handleConfigChange('maxOutputTokens', parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Output Type (for image models) */}
              {(selectedModel.includes('image') || selectedModel.includes('imagen') || selectedModel.includes('nanobanana')) && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Output Type
                  </label>
                  <select
                    value={config.outputType}
                    onChange={(e) => handleConfigChange('outputType', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {outputTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Aspect Ratio (for image models) */}
              {(selectedModel.includes('image') || selectedModel.includes('imagen')) && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Aspect Ratio
                  </label>
                  <select
                    value={config.aspectRatio}
                    onChange={(e) => handleConfigChange('aspectRatio', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {aspectRatios.map(ratio => (
                      <option key={ratio.value} value={ratio.value}>
                        {ratio.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sample Count (for image models) */}
              {(selectedModel.includes('image') || selectedModel.includes('imagen')) && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sample Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={config.sampleCount}
                    onChange={(e) => handleConfigChange('sampleCount', parseInt(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Enabled Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={config.enabled}
                  onChange={(e) => handleConfigChange('enabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                />
                <label htmlFor="enabled" className="text-sm font-medium text-gray-300">
                  Model Enabled
                </label>
              </div>

              {/* DEBUG MODE Toggle */}
              <div className="border-t border-gray-800 pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="debugMode" className="text-sm font-medium text-gray-300 block mb-1">
                      DEBUG MODE
                    </label>
                    <p className="text-xs text-gray-400">
                      Enable detailed logging in API responses and console
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="debugMode"
                    checked={debugMode}
                    onChange={(e) => setDebugMode(e.target.checked)}
                    className="w-4 h-4 text-yellow-600 bg-gray-800 border-gray-700 rounded focus:ring-yellow-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
          <button
            onClick={handleReset}
            disabled={!hasChanges || saving}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Reset
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving || !config}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSettings;

