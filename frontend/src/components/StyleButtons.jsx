import { useState, useEffect } from 'react';

// Get API URL from environment variable with fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function StyleButtons({ onStyleSelect, disabled, compact = false }) {
  const [styles, setStyles] = useState([]);
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch styles from backend
    fetch(`${API_URL}/api/styles`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch styles');
        }
        return response.json();
      })
      .then(data => {
        // Filter out 'default' style - it's only used when Enter is pressed without selecting a style
        const filteredStyles = data.styles.filter(style => style.id !== 'default');
        setStyles(filteredStyles);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching styles:', error);
        // Fallback to default styles if fetch fails
        setStyles([
          { id: 'office', label: 'Professional', icon: '💼', description: 'Formal & polished' },
          { id: 'whatsapp', label: 'Casual', icon: '💬', description: 'Friendly & relaxed' },
          { id: 'slack', label: 'Business', icon: '🤝', description: 'Clear & direct' },
          { id: 'fun', label: 'Creative', icon: '✨', description: 'Bold & playful' },
        ]);
        setLoading(false);
      });
  }, []);

  const handleStyleClick = (styleId) => {
    if (selectedStyles.includes(styleId)) {
      // Deselect
      const newSelection = selectedStyles.filter(id => id !== styleId);
      setSelectedStyles(newSelection);
    } else {
      // Select and immediately apply in compact mode
      const newSelection = [...selectedStyles, styleId];
      setSelectedStyles(newSelection);

      if (compact) {
        // In compact mode, apply immediately
        onStyleSelect(newSelection.length === 1 ? newSelection[0] : newSelection);
        setSelectedStyles([]); // Clear selection after applying
      }
    }
  };

  const handleApply = () => {
    if (selectedStyles.length > 0) {
      // Pass array if multiple, single string if one
      onStyleSelect(selectedStyles.length === 1 ? selectedStyles[0] : selectedStyles);
      setSelectedStyles([]); // Clear selection after applying
    }
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          {styles.map((style) => {
            const isSelected = selectedStyles.includes(style.id);
            return (
              <button
                key={style.id}
                onClick={() => handleStyleClick(style.id)}
                disabled={disabled}
                className={`
                  px-3 py-1.5 rounded-lg
                  border-2
                  text-sm
                  hover:scale-[1.02]
                  active:scale-95
                  transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed
                  flex items-center gap-1.5
                  shadow-sm
                  ${isSelected
                    ? 'bg-gradient-to-br from-cyan-600 to-cyan-700 border-cyan-400 text-white shadow-cyan-500/40'
                    : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600/50 text-slate-200 hover:from-slate-600 hover:to-slate-700 hover:border-slate-500'
                  }
                `}
              >
                {isSelected && <span className="text-xs">✓</span>}
                <span className="text-base">{style.icon}</span>
                <span>{style.label}</span>
              </button>
            );
          })}
        </div>
        {selectedStyles.length > 0 && (
          <button
            onClick={handleApply}
            disabled={disabled}
            className="
              w-full px-4 py-2 rounded-lg
              bg-gradient-to-br from-cyan-600 to-cyan-700
              border-2 border-cyan-400
              text-white text-sm font-medium
              hover:from-cyan-500 hover:to-cyan-600
              active:scale-95
              transition-all duration-200
              disabled:opacity-40 disabled:cursor-not-allowed
              shadow-lg shadow-cyan-500/30
            "
          >
            Apply {selectedStyles.length} Style{selectedStyles.length > 1 ? 's' : ''}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
        <p className="text-sm font-semibold text-slate-300 px-3">
          {selectedStyles.length > 0 ? `${selectedStyles.length} style${selectedStyles.length > 1 ? 's' : ''} selected` : 'Choose a style'}
        </p>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {styles.map((style, index) => {
          const isSelected = selectedStyles.includes(style.id);
          return (
            <button
              key={style.id}
              onClick={() => handleStyleClick(style.id)}
              disabled={disabled}
              style={{
                animationDelay: `${index * 50}ms`
              }}
              className={`
                group relative
                text-slate-100 px-4 py-3 rounded-xl
                font-medium transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:scale-[1.02] hover:shadow-lg
                active:scale-95
                flex flex-col items-center gap-2
                animate-in fade-in slide-in-from-bottom-2
                border-2
                shadow-md
                ${isSelected
                  ? 'bg-gradient-to-br from-cyan-600 to-cyan-700 border-cyan-400 shadow-cyan-500/40'
                  : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600/50 hover:from-slate-600 hover:to-slate-700'
                }
              `}
            >
              {isSelected && (
                <span className="absolute top-1 right-1 text-xs bg-white text-cyan-600 rounded-full w-5 h-5 flex items-center justify-center font-bold">✓</span>
              )}
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{style.icon}</span>
              <span className="text-sm font-semibold">{style.label}</span>
            </button>
          );
        })}
      </div>
      {selectedStyles.length > 0 && (
        <button
          onClick={handleApply}
          disabled={disabled}
          className="
            w-full px-6 py-3 rounded-xl
            bg-gradient-to-br from-cyan-600 to-cyan-700
            border-2 border-cyan-400
            text-white font-semibold
            hover:from-cyan-500 hover:to-cyan-600
            hover:shadow-xl hover:shadow-cyan-500/40
            active:scale-95
            transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed
            shadow-lg
          "
        >
          Apply {selectedStyles.length} Style{selectedStyles.length > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}
