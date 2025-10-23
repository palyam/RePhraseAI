import { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Eraser } from 'lucide-react';
import StyleButtons from './StyleButtons';

export default function InputBox({ onSend, disabled, onStyleSelect, onClear, hasMessages }) {
  const [text, setText] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
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
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      setText('');
      setAdditionalInstructions('');
      // Use 'default' style when Enter is pressed without clicking a style button
      onStyleSelect('default', userText, instructions);
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
    <form onSubmit={handleSubmit} className="border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-xl p-4 shadow-lg shadow-black/20">
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative space-y-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening... Speak now" : disabled ? "Please wait..." : "Type your message here..."}
              disabled={disabled}
              maxLength={maxChars}
              rows={1}
              className={`
                w-full px-5 py-4
                border-2 rounded-2xl
                focus:outline-none focus:ring-4
                disabled:bg-slate-800/50 disabled:cursor-not-allowed
                resize-none
                text-slate-100 placeholder-slate-500
                transition-all duration-200
                shadow-sm
                ${isListening
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-900/30 bg-red-950/30'
                  : 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-900/30 bg-slate-800'
                }
              `}
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
                <span className="text-xs font-medium text-slate-400">✨ Custom Instructions (optional)</span>
                <span className="text-xs text-slate-500">{additionalInstructions.length}/500</span>
              </div>
              <textarea
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                placeholder="Add any additional prompt instructions..."
                disabled={disabled}
                maxLength={500}
                rows={2}
                className="
                  w-full px-4 py-2.5
                  border rounded-xl
                  focus:outline-none focus:ring-2
                  disabled:bg-slate-800/50 disabled:cursor-not-allowed
                  resize-none
                  text-sm text-slate-100 placeholder-slate-500
                  transition-all duration-200
                  border-slate-700/70 focus:border-cyan-500/50 focus:ring-cyan-900/20 bg-slate-800/70
                "
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
                    // Trigger style selection (which now handles adding the user message)
                    if (text.trim() && !disabled) {
                      const userText = text;
                      const instructions = additionalInstructions;
                      if (isListening) {
                        recognitionRef.current.stop();
                        setIsListening(false);
                      }
                      setText('');
                      setAdditionalInstructions('');
                      onStyleSelect(styleOrStyles, userText, instructions);
                    }
                  }}
                  disabled={disabled}
                  compact={true}
                />
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {isListening
                    ? '🎤 Listening... Click mic to stop'
                    : disabled
                      ? '⏳ Processing...'
                      : '↵ Enter to send • ⇧ Shift+Enter for new line'
                  }
                </p>
                <p className={`text-xs font-medium ${charCount > maxChars * 0.9 ? 'text-orange-400' : 'text-slate-500'}`}>
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
              className={`
                p-4 rounded-2xl
                font-medium transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
                hover:scale-[1.02]
                active:scale-95
                flex items-center justify-center
                shadow-lg border
                ${isListening
                  ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-red-500/40 border-red-500 animate-pulse'
                  : 'bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 shadow-black/40 border-slate-600 hover:from-slate-600 hover:to-slate-700'
                }
              `}
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
              className="
                bg-gradient-to-br from-slate-700 to-slate-800
                text-slate-200 p-4 rounded-2xl
                font-medium transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
                hover:from-slate-600 hover:to-slate-700
                hover:scale-[1.02]
                active:scale-95
                flex items-center justify-center
                shadow-lg shadow-black/40
                border border-slate-600/50
              "
              title="Clear all messages"
            >
              <Eraser size={20} />
            </button>
          )}

          {/* Send Button */}
          <button
            type="submit"
            disabled={disabled || !text.trim()}
            className="
              bg-gradient-to-br from-cyan-600 to-cyan-700
              text-white p-4 rounded-2xl
              font-medium transition-all duration-200
              disabled:opacity-40 disabled:cursor-not-allowed
              hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-[1.02]
              active:scale-95
              flex items-center justify-center
              shadow-lg shadow-cyan-900/40
              border border-cyan-500/50
            "
          >
            <Send size={20} className={disabled ? '' : 'group-hover:translate-x-0.5 transition-transform'} />
          </button>
        </div>
      </div>
    </form>
  );
}
