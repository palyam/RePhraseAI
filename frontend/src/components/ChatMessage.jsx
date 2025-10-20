import { Copy, Check, Clock, Zap } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function ChatMessage({ message, onCopy }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    if (onCopy) onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === 'user';

  // Format model name for display
  const getModelDisplayName = (model) => {
    if (!model) return '';
    if (model.startsWith('claude')) {
      return model
        .replace('claude-sonnet-4-5-', 'Claude Sonnet 4.5 ')
        .replace('claude-sonnet-4-', 'Claude Sonnet 4 ')
        .replace('claude-opus-4-', 'Claude Opus 4 ');
    } else if (model.startsWith('gpt') || model.startsWith('o')) {
      return model
        .replace('gpt-', 'GPT-')
        .replace('o3-global', 'O3')
        .replace('o4-mini-bal', 'O4 Mini')
        .replace('-global', '')
        .replace('-', ' ')
        .toUpperCase();
    }
    return model;
  };

  // Format style name for display
  const getStyleDisplayName = (style) => {
    const styleMap = {
      'office': 'Professional',
      'whatsapp': 'Casual',
      'slack': 'Business',
      'fun': 'Creative'
    };
    return styleMap[style] || style;
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`max-w-[75%] ${isUser ? '' : 'w-full'}`}>
        <div
          className={`rounded-2xl px-5 py-4 ${
            isUser
              ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-slate-100 shadow-lg shadow-black/40 border border-slate-600/50'
              : 'bg-slate-800/50 text-slate-100 border border-slate-700/50 backdrop-blur-sm'
          }`}
        >
          {message.streaming && !message.content ? (
            <div className="h-4"></div>
          ) : (
            <>
              <div className="prose prose-invert prose-slate max-w-none leading-relaxed
                prose-headings:text-slate-100 prose-headings:font-semibold
                prose-p:text-slate-200 prose-p:leading-relaxed
                prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-slate-100 prose-strong:font-bold
                prose-code:text-cyan-300 prose-code:bg-slate-900/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-slate-900/80 prose-pre:border prose-pre:border-slate-700/50 prose-pre:shadow-lg
                prose-blockquote:border-l-cyan-500 prose-blockquote:text-slate-300
                prose-ul:text-slate-200 prose-ol:text-slate-200
                prose-li:text-slate-200 prose-li:marker:text-slate-400
                prose-hr:border-slate-700
              ">
                {isUser ? (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                ) : (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                )}
              </div>

              {!isUser && message.content && !message.streaming && (
                <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between gap-4 flex-wrap">
                  {/* Metadata Section */}
                  <div className="flex items-center gap-4 flex-wrap text-xs text-slate-400">
                    {message.model && (
                      <div className="flex items-center gap-1.5 bg-slate-900/50 px-2.5 py-1 rounded-lg border border-slate-700/50">
                        <span className="font-medium text-slate-300">{getModelDisplayName(message.model)}</span>
                      </div>
                    )}
                    {message.style && (
                      <div className="flex items-center gap-1.5 bg-slate-900/50 px-2.5 py-1 rounded-lg border border-slate-700/50">
                        <span className="text-slate-300">{getStyleDisplayName(message.style)}</span>
                      </div>
                    )}
                    {message.totalTime && (
                      <div className="flex items-center gap-1.5 bg-slate-900/50 px-2.5 py-1 rounded-lg border border-slate-700/50">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-slate-300">{(message.totalTime / 1000).toFixed(2)}s</span>
                      </div>
                    )}
                    {message.timeToFirstToken && (
                      <div className="flex items-center gap-1.5 bg-slate-900/50 px-2.5 py-1 rounded-lg border border-slate-700/50">
                        <Zap size={12} className="text-cyan-400" />
                        <span className="text-slate-300">{(message.timeToFirstToken / 1000).toFixed(2)}s</span>
                      </div>
                    )}
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={handleCopy}
                    className={`
                      px-3 py-1.5 rounded-lg
                      flex items-center gap-2 text-sm font-medium
                      transition-all duration-200 shadow-sm
                      ${copied
                        ? 'bg-emerald-600 text-white border border-emerald-500'
                        : 'bg-slate-700 border border-slate-600 text-slate-200 hover:bg-slate-600 hover:border-slate-500'
                      }
                    `}
                  >
                    {copied ? (
                      <>
                        <Check size={16} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Streaming indicator with timing */}
        {!isUser && message.streaming && message.content && (
          <div className="mt-2 px-2 flex items-center gap-2 text-xs text-slate-500">
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
            <span>Streaming...</span>
            {message.timeToFirstToken && (
              <span className="ml-2">• First token: {(message.timeToFirstToken / 1000).toFixed(2)}s</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
