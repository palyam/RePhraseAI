import { useState, useRef, useEffect } from 'react';
import ModelSelector from './components/ModelSelector';
import ChatMessage from './components/ChatMessage';
import InputBox from './components/InputBox';

// Get API URL from environment variable with fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [selectedModel, setSelectedModel] = useState('gpt-4.1');
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentUserText, setCurrentUserText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (text, additionalInstructions = '') => {
    // Add user message
    const userMessage = {
      role: 'user',
      content: text,
      additionalInstructions: additionalInstructions || undefined,
      id: `user-${Date.now()}` // Unique stable ID
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentUserText(text);
  };

  const handleClearMessages = () => {
    setMessages([]);
    setCurrentUserText('');
  };

  const handleStyleSelect = async (styleOrStyles, text, additionalInstructions = '') => {
    setIsStreaming(true);
    setCurrentUserText(text);

    // Convert to array if single style
    const stylesArray = Array.isArray(styleOrStyles) ? styleOrStyles : [styleOrStyles];

    // Track timing metrics
    const startTime = performance.now();
    let firstTokenTime = null;

    // Add user message first, then AI response placeholders
    const userMessage = {
      role: 'user',
      content: text,
      additionalInstructions: additionalInstructions || undefined,
      id: `user-${Date.now()}`
    };

    const newMessages = [...messages, userMessage];
    const aiMessageStartIndex = newMessages.length; // Start after user message
    const messageId = Date.now() + 1; // Unique ID for this batch of AI messages

    stylesArray.forEach((style, idx) => {
      newMessages.push({
        role: 'assistant',
        content: '',
        streaming: true,
        style: style,
        model: selectedModel,
        styleIndex: idx,
        id: `${messageId}-${idx}` // Unique stable ID
      });
    });
    setMessages(newMessages);

    try {
      const response = await fetch(`${API_URL}/api/rephrase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          styles: stylesArray,
          model: selectedModel,
          additional_instructions: additionalInstructions || undefined,
        }),
      });

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const accumulatedContents = stylesArray.map(() => '');
      let currentStyleIndex = 0;
      let streamComplete = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim() === '[DONE]') {
              streamComplete = true;
              break;
            }

            try {
              const parsed = JSON.parse(data);

              // Handle style markers for multiple styles
              if (parsed.style_start) {
                currentStyleIndex = parsed.style_index || 0;
                accumulatedContents[currentStyleIndex] = '';
              } else if (parsed.style_end) {
                // Style complete, do nothing special
              } else if (parsed.content) {
                // Capture first token time
                if (!firstTokenTime) {
                  firstTokenTime = performance.now();
                }

                accumulatedContents[currentStyleIndex] += parsed.content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  const messageIndex = aiMessageStartIndex + currentStyleIndex;
                  if (newMessages[messageIndex]) {
                    newMessages[messageIndex] = {
                      ...newMessages[messageIndex],
                      content: accumulatedContents[currentStyleIndex],
                      streaming: true,
                      timeToFirstToken: firstTokenTime ? Math.round(firstTokenTime - startTime) : null
                    };
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }

        // Break outer loop if stream is complete
        if (streamComplete) break;
      }

      // Calculate total response time
      const endTime = performance.now();
      const totalTime = Math.round(endTime - startTime);

      // Mark all style responses as complete with timing info
      setMessages(prev => {
        const newMessages = [...prev];
        stylesArray.forEach((style, idx) => {
          const messageIndex = aiMessageStartIndex + idx;
          if (newMessages[messageIndex]) {
            newMessages[messageIndex].streaming = false;
            newMessages[messageIndex].totalTime = totalTime;
            newMessages[messageIndex].timeToFirstToken = firstTokenTime ? Math.round(firstTokenTime - startTime) : null;
          }
        });
        return newMessages;
      });

    } catch (error) {
      console.error('Error fetching rephrase:', error);
      let errorMessage = 'Failed to generate response.';

      // Provide specific error messages based on error type
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Cannot connect to the backend server. Please ensure the backend is running at ' + API_URL;
      } else if (error.message.includes('status: 401')) {
        errorMessage = 'Authentication error. Please check the API key configuration.';
      } else if (error.message.includes('status: 429')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
      } else if (error.message.includes('status: 503')) {
        errorMessage = 'Service temporarily unavailable. Please try again in a few moments.';
      } else if (error.message.includes('status:')) {
        errorMessage = `Server error (${error.message}). Please try selecting a different model or try again later.`;
      }

      setMessages(prev => {
        const newMessages = [...prev];
        // Mark all placeholders as error
        stylesArray.forEach((style, idx) => {
          const messageIndex = aiMessageStartIndex + idx;
          if (newMessages[messageIndex]) {
            newMessages[messageIndex] = {
              role: 'assistant',
              content: errorMessage,
              streaming: false,
              error: true
            };
          }
        });
        return newMessages;
      });
    } finally {
      setIsStreaming(false);
      setCurrentUserText('');
      // Don't show style buttons after response is complete
      // They will show again when user sends a new message
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header - Minimal and Clean */}
      <div className="border-b border-slate-700/50 backdrop-blur-xl bg-slate-900/80 sticky top-0 z-10 shadow-lg shadow-black/20">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center shadow-lg border border-slate-600/50">
                <span className="text-slate-200 text-sm font-bold">R</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-100">RePhraseAI</h1>
            </div>
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center mt-32">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-700 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-black/40 border border-slate-600/50">
                <span className="text-slate-200 text-3xl font-bold">R</span>
              </div>
              <h2 className="text-3xl font-semibold text-slate-100 mb-3">Welcome to RePhraseAI</h2>
              <p className="text-slate-400 text-lg max-w-md">Type your message below and choose a style to transform your text instantly</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Box */}
      <InputBox
        onSend={handleSendMessage}
        disabled={isStreaming}
        onStyleSelect={handleStyleSelect}
        onClear={handleClearMessages}
        hasMessages={messages.length > 0}
      />
    </div>
  );
}

export default App;
