import { useChatStore } from '../store/chatStore';
import { MODELS } from '../constants/models';

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
      title={MODELS.find(m => m.id === currentModel)?.description}
    >
      {MODELS.map((model) => (
        <option key={model.id} value={model.id} className="bg-gray-800">
          {model.label}
        </option>
      ))}
    </select>
  );
};

export default ModelSelector;

