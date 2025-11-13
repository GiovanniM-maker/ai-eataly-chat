import { useChatStore, MODELS } from '../store/chatStore';

/**
 * ModelSelector Component
 * Dropdown to select between different AI models
 */
const ModelSelector = ({ className = '' }) => {
  const { currentModel, switchModel } = useChatStore();

  return (
    <select
      value={currentModel}
      onChange={(e) => switchModel(e.target.value)}
      className={`bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${className}`}
    >
      {MODELS.map((model) => (
        <option key={model} value={model} className="bg-gray-800">
          {model}
        </option>
      ))}
    </select>
  );
};

export default ModelSelector;

