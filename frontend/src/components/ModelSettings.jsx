import { Plus, Trash2 } from 'lucide-react';

export default function ModelSettings({ config, setConfig, theme }) {
  const handleDefaultChange = (model) => {
    setConfig(prev => ({
      ...prev,
      models: { ...prev.models, default: model }
    }));
  };

  const handleAddModel = (provider) => {
    const modelName = prompt(`Enter ${provider} model name:`);
    if (modelName && modelName.trim()) {
      setConfig(prev => ({
        ...prev,
        models: {
          ...prev.models,
          available: {
            ...prev.models.available,
            [provider]: [...(prev.models.available[provider] || []), modelName.trim()]
          }
        }
      }));
    }
  };

  const handleRemoveModel = (provider, model) => {
    if (confirm(`Remove ${model}?`)) {
      setConfig(prev => ({
        ...prev,
        models: {
          ...prev.models,
          available: {
            ...prev.models.available,
            [provider]: prev.models.available[provider].filter(m => m !== model)
          }
        }
      }));
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Model Configuration</h3>

        {/* Available Models by Provider */}
        {['anthropic', 'openai', 'google'].map(provider => (
          <div key={provider} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className={`font-medium ${
                theme === 'dark' ? 'text-slate-200' : 'text-gray-800'
              }`}>
                {provider.charAt(0).toUpperCase() + provider.slice(1)} Models
              </h4>
              <button
                onClick={() => handleAddModel(provider)}
                className={`flex items-center gap-2 px-3 py-1 rounded text-sm ${
                  theme === 'dark'
                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Plus size={16} />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {(config.models.available[provider] || []).map(model => (
                <div
                  key={model}
                  className={`flex items-center justify-between px-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="radio"
                      id={`model-${model}`}
                      name="default-model"
                      checked={config.models.default === model}
                      onChange={() => handleDefaultChange(model)}
                      className={`w-4 h-4 cursor-pointer ${
                        theme === 'dark'
                          ? 'accent-cyan-500'
                          : 'accent-blue-600'
                      }`}
                    />
                    <label htmlFor={`model-${model}`} className="cursor-pointer flex-1">
                      {model}
                      {config.models.default === model && (
                        <span className={`ml-2 text-xs font-medium ${
                          theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                        }`}>
                          (Default)
                        </span>
                      )}
                    </label>
                  </div>
                  <button
                    onClick={() => handleRemoveModel(provider, model)}
                    className={`p-1 rounded ${
                      theme === 'dark'
                        ? 'text-red-400 hover:bg-red-900/30'
                        : 'text-red-600 hover:bg-red-100'
                    }`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {(!config.models.available[provider] || config.models.available[provider].length === 0) && (
                <p className={`text-sm italic ${
                  theme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                }`}>
                  No models configured
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
