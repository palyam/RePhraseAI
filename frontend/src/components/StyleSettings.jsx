import { useState } from 'react';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';

export default function StyleSettings({ config, setConfig, theme }) {
  const [editingStyle, setEditingStyle] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    label: '',
    icon: '',
    description: '',
    prompt: ''
  });

  const handleAddNew = () => {
    setFormData({
      id: '',
      label: '',
      icon: '📝',
      description: '',
      prompt: ''
    });
    setEditingStyle('new');
  };

  const handleEdit = (style, index) => {
    setFormData({ ...style });
    setEditingStyle(index);
  };

  const handleCancel = () => {
    setEditingStyle(null);
    setFormData({
      id: '',
      label: '',
      icon: '',
      description: '',
      prompt: ''
    });
  };

  const handleSave = () => {
    if (!formData.id || !formData.label) {
      alert('ID and Label are required');
      return;
    }

    if (editingStyle === 'new') {
      // Check if ID already exists
      if (config.styles.some(s => s.id === formData.id)) {
        alert('Style ID already exists');
        return;
      }
      // Add new style
      setConfig(prev => ({
        ...prev,
        styles: [...prev.styles, formData]
      }));
    } else {
      // Update existing style
      const newStyles = [...config.styles];
      newStyles[editingStyle] = formData;
      setConfig(prev => ({ ...prev, styles: newStyles }));
    }

    handleCancel();
  };

  const handleDelete = (index) => {
    if (confirm('Delete this style?')) {
      setConfig(prev => ({
        ...prev,
        styles: prev.styles.filter((_, i) => i !== index)
      }));
      if (editingStyle === index) {
        handleCancel();
      }
    }
  };

  return (
    <div className="flex gap-6 h-full max-w-full">
      {/* Left Column - Style List */}
      <div className={`space-y-4 transition-all ${
        editingStyle !== null ? 'w-80 flex-shrink-0' : 'w-full'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Custom Styles</h3>
          <button
            onClick={handleAddNew}
            disabled={editingStyle !== null}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              editingStyle !== null
                ? 'opacity-50 cursor-not-allowed'
                : theme === 'dark'
                ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
          >
            <Plus size={18} />
            Add Style
          </button>
        </div>

        <div className="space-y-3">
          {config.styles.map((style, index) => (
            <div
              key={style.id}
              className={`p-4 rounded-lg border transition-all ${
                editingStyle === index
                  ? theme === 'dark'
                    ? 'bg-slate-700 border-cyan-500 ring-2 ring-cyan-500/50'
                    : 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/50'
                  : theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{style.icon}</span>
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      theme === 'dark' ? 'text-slate-100' : 'text-gray-900'
                    }`}>
                      {style.label}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                    }`}>
                      {style.description}
                    </p>
                    <p className={`text-xs mt-2 font-mono ${
                      theme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                    }`}>
                      ID: {style.id}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(style, index)}
                    disabled={editingStyle !== null && editingStyle !== index}
                    className={`p-2 rounded transition-all ${
                      editingStyle !== null && editingStyle !== index
                        ? 'opacity-50 cursor-not-allowed'
                        : theme === 'dark'
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    disabled={editingStyle !== null}
                    className={`p-2 rounded transition-all ${
                      editingStyle !== null
                        ? 'opacity-50 cursor-not-allowed'
                        : theme === 'dark'
                        ? 'text-red-400 hover:bg-red-900/30'
                        : 'text-red-600 hover:bg-red-100'
                    }`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {config.styles.length === 0 && (
            <div className={`text-center py-12 rounded-lg border-2 border-dashed ${
              theme === 'dark'
                ? 'border-slate-700 text-slate-500'
                : 'border-gray-300 text-gray-500'
            }`}>
              <p>No custom styles yet. Click "Add Style" to create one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Edit Form */}
      {editingStyle !== null && (
        <div className={`flex-1 p-6 rounded-lg border sticky top-0 h-fit max-h-[calc(100vh-12rem)] overflow-y-auto ${
          theme === 'dark'
            ? 'bg-slate-800 border-slate-700'
            : 'bg-white border-gray-200 shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {editingStyle === 'new' ? 'New Style' : 'Edit Style'}
            </h3>
            <button
              onClick={handleCancel}
              className={`p-1 rounded ${
                theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
              }`}>
                Style ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="e.g., professional"
                disabled={editingStyle !== 'new'}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-600 text-slate-100 focus:ring-cyan-500 disabled:opacity-50'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 disabled:bg-gray-100'
                }`}
              />
              <p className={`text-xs mt-1 ${
                theme === 'dark' ? 'text-slate-500' : 'text-gray-500'
              }`}>
                Lowercase, no spaces (use hyphens)
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
              }`}>
                Label <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Professional"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-600 text-slate-100 focus:ring-cyan-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
              }`}>
                Icon (Emoji)
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="📝"
                maxLength={4}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-600 text-slate-100 focus:ring-cyan-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
              }`}>
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-600 text-slate-100 focus:ring-cyan-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
              }`}>
                Prompt Template
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                placeholder="Enter the prompt that will be used for this style..."
                rows={8}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-600 text-slate-100 focus:ring-cyan-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                }`}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium ${
                  theme === 'dark'
                    ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                    : 'bg-blue-600 text-white hover:bg-blue-500'
                }`}
              >
                <Save size={18} />
                Save
              </button>
              <button
                onClick={handleCancel}
                className={`px-4 py-2 rounded-lg font-medium ${
                  theme === 'dark'
                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
