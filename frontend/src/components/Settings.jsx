import { useState, useEffect } from 'react';
import { Save, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import LLMSettings from './LLMSettings';
import ModelSettings from './ModelSettings';
import StyleSettings from './StyleSettings';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Settings({ theme, onClose }) {
  const [activeTab, setActiveTab] = useState('llm');
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/config`);
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch(`${API_URL}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Configuration saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to save configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to the last saved configuration?')) {
      fetchConfig();
      setMessage({ type: 'success', text: 'Configuration reset' });
      setTimeout(() => setMessage(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full ${
        theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'llm', label: 'LLM & API Keys', icon: '🔑' },
    { id: 'models', label: 'Models', icon: '🤖' },
    { id: 'styles', label: 'Styles', icon: '✨' }
  ];

  return (
    <div className={`h-full flex flex-col ${
      theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-white text-gray-900'
    }`}>
      {/* Header */}
      <div className={`border-b px-6 py-4 ${
        theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Close
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex border-b ${
        theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
      }`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? theme === 'dark'
                  ? 'border-cyan-500 text-cyan-400 bg-slate-800/50'
                  : 'border-blue-500 text-blue-600 bg-blue-50/50'
                : theme === 'dark'
                  ? 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100/30'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`mx-6 mt-4 px-4 py-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success'
            ? theme === 'dark'
              ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : theme === 'dark'
              ? 'bg-red-900/30 text-red-300 border border-red-700'
              : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'llm' && (
          <LLMSettings
            config={config}
            setConfig={setConfig}
            theme={theme}
          />
        )}
        {activeTab === 'models' && (
          <ModelSettings
            config={config}
            setConfig={setConfig}
            theme={theme}
          />
        )}
        {activeTab === 'styles' && (
          <StyleSettings
            config={config}
            setConfig={setConfig}
            theme={theme}
          />
        )}
      </div>

      {/* Footer Actions */}
      <div className={`border-t px-6 py-4 flex justify-end gap-3 ${
        theme === 'dark' ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'
      }`}>
        <button
          onClick={handleReset}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            theme === 'dark'
              ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-700 disabled:opacity-40'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-40'
          }`}
        >
          <RotateCcw size={18} />
          <span>Reset</span>
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-40 ${
            theme === 'dark'
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          <Save size={18} />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );
}
