import { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Eraser, MessageSquarePlus, ChevronDown, ChevronUp } from 'lucide-react';
import StyleButtons from './StyleButtons';

const CHANNELS = [
  { id: 'none',    label: 'No channel',    icon: '—',  description: '' },
  { id: 'outlook', label: 'Outlook Email', icon: '📧', description: 'Professional, modern' },
  { id: 'teams',   label: 'Teams Chat',    icon: '💬', description: 'Business casual, concise' },
  { id: 'whatsapp',label: 'WhatsApp',      icon: '📱', description: 'Personal, casual, fun' },
];

export default function InputBox({ onSend, disabled, onStyleSelect, onCompose, onClear, hasMessages, theme }) {
  const [text, setText] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showOriginalMessage, setShowOriginalMessage] = useState(false);
  const [originalMessage, setOriginalMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('none');
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setText(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      const userText = text;
      const instructions = additionalInstructions;
      const channel = selectedChannel;
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      setText('');
      setAdditionalInstructions('');
      onStyleSelect('default', userText, instructions, channel);
    }
  };

  const handleCompose = () => {
    if (originalMessage.trim() && !disabled) {
      const original = originalMessage;
      const myDraft = text;
      const instructions = additionalInstructions;
      const channel = selectedChannel;
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      setOriginalMessage('');
      setText('');
      setAdditionalInstructions('');
      onCompose(original, myDraft, instructions, channel);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const charCount = text.length;
  const maxChars = 2000;

  return (
    <form onSubmit={handleSubmit} className={`border-t backdrop-blur-xl p-4 shadow-lg ${
      theme === 'dark'
        ? 'border-slate-700/50 bg-slate-900/95 shadow-black/20'
        : 'border-blue-200/50 bg-white/95 shadow-blue-100/20'
    }`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative space-y-2">
            {/* Channel Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              {CHANNELS.map(ch => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedChannel(ch.id)}
                  disabled={disabled}
                  title={ch.description}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                    selectedChannel === ch.id
                      ? theme === 'dark'
                        ? 'bg-cyan-900/40 border-cyan-700/60 text-cyan-300'
                        : 'bg-blue-50 border-blue-400 text-blue-700'
                      : theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{ch.icon}</span>
                  <span>{ch.label}</span>
                </button>
              ))}
            </div>

            {/* Original Message Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowOriginalMessage(prev => !prev)}
                disabled={disabled}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                  showOriginalMessage
                    ? theme === 'dark'
                      ? 'bg-cyan-900/40 border-cyan-700/60 text-cyan-400'
                      : 'bg-blue-50 border-blue-300 text-blue-600'
                    : theme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageSquarePlus size={13} />
                Include original message
                {showOriginalMessage ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {showOriginalMessage && (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={originalMessage}
                    onChange={(e) => setOriginalMessage(e.target.value)}
                    placeholder="Paste the original message you want to respond to..."
                    disabled={disabled}
                    rows={3}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 disabled:cursor-not-allowed resize-none text-sm transition-all duration-200 ${
                      theme === 'dark'
                        ? 'border-slate-600 focus:border-cyan-500/60 focus:ring-cyan-900/20 bg-slate-800/80 text-slate-100 placeholder-slate-500'
                        : 'border-blue-200 focus:border-blue-400 focus:ring-blue-200/40 bg-white text-gray-800 placeholder-gray-400'
                    }`}
                    style={{ minHeight: '80px', maxHeight: '200px' }}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCompose}
                    disabled={disabled || !originalMessage.trim()}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-95 shadow-sm ${
                      theme === 'dark'
                        ? 'bg-gradient-to-br from-cyan-700 to-cyan-800 border-cyan-600/50 text-white hover:from-cyan-600 hover:to-cyan-700 shadow-cyan-900/30'
                        : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 text-white hover:from-blue-600 hover:to-blue-700 shadow-blue-200/40'
                    }`}
                  >
                    <MessageSquarePlus size={15} />
                    Compose Response
                  </button>
                </div>
              )}
            </div>

            {/* Main text input */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening... Speak now" : disabled ? "Please wait..." : "Type your message here..."}
              disabled={disabled}
              maxLength={maxChars}
              rows={1}
              className={`w-full px-5 py-4 border-2 rounded-2xl focus:outline-none focus:ring-4 disabled:cursor-not-allowed resize-none transition-all duration-200 shadow-sm ${
                isListening
                  ? theme === 'dark'
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-900/30 bg-red-950/30 text-slate-100 placeholder-slate-500'
                    : 'border-red-500 focus:border-red-500 focus:ring-red-200/50 bg-red-50 text-gray-800 placeholder-red-400'
                  : theme === 'dark'
                    ? 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-900/30 bg-slate-800 text-slate-100 placeholder-slate-500 disabled:bg-slate-800/50'
                    : 'border-blue-200 focus:border-blue-500 focus:ring-blue-200/50 bg-white text-gray-800 placeholder-gray-400 disabled:bg-gray-50'
              }`}
              style={{
                minHeight: '56px',
                maxHeight: '200px',
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
              }}
            />

            {/* Additional Instructions Input */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                  ✨ Custom Instructions (optional)
                </span>
                <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>
                  {additionalInstructions.length}/500
                </span>
              </div>
              <textarea
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                placeholder="Add any additional prompt instructions..."
                disabled={disabled}
                maxLength={500}
                rows={2}
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 disabled:cursor-not-allowed resize-none text-sm transition-all duration-200 ${
                  theme === 'dark'
                    ? 'border-slate-700/70 focus:border-cyan-500/50 focus:ring-cyan-900/20 bg-slate-800/70 text-slate-100 placeholder-slate-500 disabled:bg-slate-800/50'
                    : 'border-blue-200/70 focus:border-blue-500/50 focus:ring-blue-200/30 bg-white/70 text-gray-800 placeholder-gray-400 disabled:bg-gray-50'
                }`}
                style={{
                  minHeight: '60px',
                  maxHeight: '100px',
                }}
              />
            </div>

            {/* Quick style buttons and char count */}
            <div className="mt-2 px-1 space-y-2">
              {/* Always show compact buttons when there's text */}
              {text.trim() && (
                <StyleButtons
                  onStyleSelect={(styleOrStyles) => {
                    if (text.trim() && !disabled) {
                      const userText = text;
                      const instructions = additionalInstructions;
                      const channel = selectedChannel;
                      if (isListening) {
                        recognitionRef.current.stop();
                        setIsListening(false);
                      }
                      setText('');
                      setAdditionalInstructions('');
                      onStyleSelect(styleOrStyles, userText, instructions, channel);
                    }
                  }}
                  disabled={disabled}
                  compact={true}
                  theme={theme}
                />
              )}
              <div className="flex items-center justify-between">
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>
                  {isListening
                    ? '🎤 Listening... Click mic to stop'
                    : disabled
                      ? '⏳ Processing...'
                      : '↵ Enter to send • ⇧ Shift+Enter for new line'
                  }
                </p>
                <p className={`text-xs font-medium ${
                  charCount > maxChars * 0.9
                    ? 'text-orange-400'
                    : theme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                }`}>
                  {charCount}/{maxChars}
                </p>
              </div>
            </div>
          </div>

          {/* Voice Input Button */}
          {speechSupported && (
            <button
              type="button"
              onClick={toggleListening}
              disabled={disabled}
              className={`p-4 rounded-2xl font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 flex items-center justify-center shadow-lg border ${
                isListening
                  ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-red-500/40 border-red-500 animate-pulse'
                  : theme === 'dark'
                    ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 shadow-black/40 border-slate-600 hover:from-slate-600 hover:to-slate-700'
                    : 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 shadow-blue-200/40 border-blue-300 hover:from-blue-200 hover:to-blue-300'
              }`}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}

          {/* Clear Button */}
          {hasMessages && (
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              className={`p-4 rounded-2xl font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 flex items-center justify-center shadow-lg border ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 shadow-black/40 border-slate-600/50 hover:from-slate-600 hover:to-slate-700'
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 shadow-gray-200/40 border-gray-300 hover:from-gray-200 hover:to-gray-300'
              }`}
              title="Clear all messages"
            >
              <Eraser size={20} />
            </button>
          )}

          {/* Send Button */}
          <button
            type="submit"
            disabled={disabled || !text.trim()}
            className={`p-4 rounded-2xl font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 flex items-center justify-center shadow-lg border ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-cyan-600 to-cyan-700 text-white shadow-cyan-900/40 border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/40'
                : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-300/40 border-blue-400 hover:shadow-xl hover:shadow-blue-400/40'
            }`}
          >
            <Send size={20} className={disabled ? '' : 'group-hover:translate-x-0.5 transition-transform'} />
          </button>
        </div>
      </div>
    </form>
  );
}
