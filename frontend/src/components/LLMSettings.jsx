import { useState } from 'react';
import { Eye, EyeOff, TestTube, CheckCircle, XCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function LLMSettings({ config, setConfig, theme }) {
  const [showKeys, setShowKeys] = useState({});
  const [testing, setTesting] = useState({});
  const [testResults, setTestResults] = useState({});

  const toggleShowKey = (keyName) => {
    setShowKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const handleModeChange = (mode) => {
    setConfig(prev => ({
      ...prev,
      llm: { ...prev.llm, mode }
    }));
  };

  const handleKeyChange = (keyName, value) => {
    setConfig(prev => ({
      ...prev,
      llm: { ...prev.llm, [keyName]: value }
    }));
  };

  const testKey = async (provider, keyName) => {
    const apiKey = config.llm[keyName];
    if (!apiKey || apiKey.startsWith('*')) {
      setTestResults(prev => ({
        ...prev,
        [keyName]: { success: false, message: 'Please enter a valid API key' }
      }));
      return;
    }

    setTesting(prev => ({ ...prev, [keyName]: true }));
    setTestResults(prev => ({ ...prev, [keyName]: null }));

    try {
      const response = await fetch(`${API_URL}/api/config/test-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, api_key: apiKey })
      });

      const result = await response.json();
      setTestResults(prev => ({ ...prev, [keyName]: result }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [keyName]: { success: false, message: 'Failed to test API key' }
      }));
    } finally {
      setTesting(prev => ({ ...prev, [keyName]: false }));
    }
  };

  const KeyInput = ({ label, keyName, provider, placeholder }) => {
    const value = config.llm[keyName] || '';
    const isVisible = showKeys[keyName];
    const isTesting = testing[keyName];
    const testResult = testResults[keyName];

    return (
      <div className="space-y-2">
        <label className={`block text-sm font-medium ${
          theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
        }`}>
          {label}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={isVisible ? 'text' : 'password'}
              value={value}
              onChange={(e) => handleKeyChange(keyName, e.target.value)}
              placeholder={placeholder}
              className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-600 text-slate-100 focus:ring-cyan-500 focus:border-cyan-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            <button
              type="button"
              onClick={() => toggleShowKey(keyName)}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded ${
                theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button
            type="button"
            onClick={() => testKey(provider, keyName)}
            disabled={isTesting || !value || value.startsWith('*')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              theme === 'dark'
                ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <TestTube size={18} />
            {isTesting ? 'Testing...' : 'Test'}
          </button>
        </div>
        {testResult && (
          <div className={`flex items-center gap-2 text-sm ${
            testResult.success
              ? theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
              : theme === 'dark' ? 'text-red-400' : 'text-red-600'
          }`}>
            {testResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">LLM Configuration</h3>

        {/* Mode Selection */}
        <div className="space-y-2 mb-6">
          <label className={`block text-sm font-medium ${
            theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
          }`}>
            Mode
          </label>
          <div className="flex gap-3">
            {['direct', 'gateway'].map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  config.llm.mode === mode
                    ? theme === 'dark'
                      ? 'border-cyan-500 bg-cyan-900/30 text-cyan-300'
                      : 'border-blue-500 bg-blue-50 text-blue-700'
                    : theme === 'dark'
                      ? 'border-slate-600 text-slate-400 hover:border-slate-500 hover:bg-slate-800'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {mode === 'direct' ? '🔗 Direct' : '🌐 Gateway'}
              </button>
            ))}
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
            {config.llm.mode === 'direct'
              ? 'Connect directly to LLM provider APIs'
              : 'Route through corporate API gateway'}
          </p>
        </div>

        {/* Gateway Mode Keys */}
        {config.llm.mode === 'gateway' && (
          <div className="space-y-4">
            <KeyInput
              label="Gateway API Key"
              keyName="gateway_api_key"
              provider="gateway"
              placeholder="Enter your gateway API key"
            />
          </div>
        )}

        {/* Direct Mode Keys */}
        {config.llm.mode === 'direct' && (
          <div className="space-y-4">
            <KeyInput
              label="OpenAI API Key"
              keyName="openai_api_key"
              provider="openai"
              placeholder="sk-..."
            />
            <KeyInput
              label="Anthropic API Key"
              keyName="anthropic_api_key"
              provider="anthropic"
              placeholder="sk-ant-..."
            />
            <KeyInput
              label="Google API Key"
              keyName="google_api_key"
              provider="google"
              placeholder="Enter your Google API key"
            />
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className={`p-4 rounded-lg border ${
        theme === 'dark'
          ? 'bg-slate-800/50 border-slate-700 text-slate-300'
          : 'bg-blue-50 border-blue-200 text-gray-700'
      }`}>
        <p className="text-sm">
          <strong>Note:</strong> API keys are stored securely and masked in the interface.
          Only provide new keys when updating. Leave masked values unchanged to keep existing keys.
        </p>
      </div>
    </div>
  );
}
