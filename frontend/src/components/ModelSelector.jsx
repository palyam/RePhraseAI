import { useState, useEffect } from 'react';

// Get API URL from environment variable with fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ModelSelector({ selectedModel, onModelChange, theme }) {
  const [models, setModels] = useState([]);
  const [modelCategories, setModelCategories] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/models`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch models');
        }
        return res.json();
      })
      .then(data => {
        setModels(data.models);
        setModelCategories(data.model_categories);
        if (!selectedModel) {
          onModelChange(data.default);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch models:', err);
        setError(err.message);
        // Set fallback models
        setModels(['gpt-4.1', 'claude-sonnet-4-20250514']);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>Loading models...</div>
    );
  }

  // Helper function to get model display name
  const getModelDisplayName = (model) => {
    // Format model names for better readability
    if (model.startsWith('claude')) {
      return model
        .replace('claude-sonnet-4-5-', 'Claude Sonnet 4.5 ')
        .replace('claude-sonnet-4-', 'Claude Sonnet 4 ')
        .replace('claude-opus-4-', 'Claude Opus 4 ')
        .replace('claude-3-7-sonnet-', 'Claude 3.7 Sonnet ')
        .replace('claude-3-5-sonnet-', 'Claude 3.5 Sonnet ')
        .replace('claude-3-5-haiku-', 'Claude 3.5 Haiku ')
        .replace('claude-3-sonnet-', 'Claude 3 Sonnet ')
        .replace('claude-3-opus-', 'Claude 3 Opus ')
        .replace('claude-3-haiku-', 'Claude 3 Haiku ');
    } else if (model.startsWith('gpt') || model.startsWith('o')) {
      return model
        .replace('gpt-', 'GPT-')
        .replace('o3-global', 'O3')
        .replace('o4-mini-global', 'O4 Mini')
        .replace('-global', '')
        .replace('-', ' ')
        .toUpperCase();
    }
    return model;
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>Model:</span>
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        className={`
          px-4 py-2 pr-10
          border-2 rounded-xl
          focus:outline-none focus:ring-4
          font-medium text-sm
          cursor-pointer
          transition-all duration-200
          ${theme === 'dark'
            ? 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-900/30 bg-slate-800 text-slate-200 hover:border-slate-600 hover:shadow-lg hover:shadow-black/20'
            : 'border-blue-200 focus:border-blue-500 focus:ring-blue-200/50 bg-white text-gray-800 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/20'
          }
        `}
      >
        {modelCategories ? (
          <>
            {modelCategories.anthropic && modelCategories.anthropic.length > 0 && (
              <optgroup label="🤖 Anthropic Models">
                {modelCategories.anthropic.map(model => (
                  <option key={model} value={model}>{getModelDisplayName(model)}</option>
                ))}
              </optgroup>
            )}
            {modelCategories.openai && modelCategories.openai.length > 0 && (
              <optgroup label="⚡ OpenAI Models">
                {modelCategories.openai.map(model => (
                  <option key={model} value={model}>{getModelDisplayName(model)}</option>
                ))}
              </optgroup>
            )}
          </>
        ) : (
          models.map(model => (
            <option key={model} value={model}>{getModelDisplayName(model)}</option>
          ))
        )}
      </select>
    </div>
  );
}
