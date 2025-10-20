import { useState, useEffect } from 'react';

// Get API URL from environment variable with fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function StyleButtons({ onStyleSelect, disabled, compact = false }) {
  const [styles, setStyles] = useState([]);
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

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (compact) {
    return (
      <div className="flex gap-2 flex-wrap">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => onStyleSelect(style.id)}
            disabled={disabled}
            className="
              px-3 py-1.5 rounded-lg
              bg-gradient-to-br from-slate-700 to-slate-800
              border border-slate-600/50
              text-slate-200 text-sm
              hover:from-slate-600 hover:to-slate-700
              hover:border-slate-500
              active:scale-95
              transition-all duration-200
              disabled:opacity-40 disabled:cursor-not-allowed
              flex items-center gap-1.5
              shadow-sm
            "
          >
            <span className="text-base">{style.icon}</span>
            <span>{style.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
        <p className="text-sm font-semibold text-slate-300 px-3">Choose a style</p>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {styles.map((style, index) => (
          <button
            key={style.id}
            onClick={() => onStyleSelect(style.id)}
            disabled={disabled}
            style={{
              animationDelay: `${index * 50}ms`
            }}
            className="
              group relative
              bg-gradient-to-br from-slate-700 to-slate-800
              text-slate-100 px-4 py-3 rounded-xl
              font-medium transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:from-slate-600 hover:to-slate-700
              hover:scale-[1.02] hover:shadow-lg
              active:scale-95
              flex flex-col items-center gap-2
              animate-in fade-in slide-in-from-bottom-2
              border border-slate-600/50
              shadow-md
            "
          >
            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{style.icon}</span>
            <span className="text-sm font-semibold">{style.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
