# RePhraseAI 🔄

A modern AI-powered text rephrasing tool with real-time streaming responses. Transform your text into different communication styles instantly - from professional emails to casual messages.

## What is RePhraseAI?

RePhraseAI is an intelligent writing assistant that helps you rephrase text in various styles. Whether you need to polish a professional email, craft a casual message, or simply improve your writing, RePhraseAI has you covered.

**Key Features:**
- 🎨 **5 Writing Styles** - Default improvement, Professional, Casual, Business Casual, and Creative
- 🤖 **Multiple AI Models** - Choose from GPT, Claude, and other LLMs
- ⚡ **Real-time Streaming** - Watch responses generate word by word
- 💬 **Chat Interface** - Conversational UI with message history
- 🎙️ **Voice Input** - Speak your text using voice recognition
- 📋 **One-Click Copy** - Easy copying of rephrased content
- 🎯 **Smart Timing** - See response time and time-to-first-token metrics

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        RePhraseAI                           │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌────────────────────┐
│                  │         │                  │         │                    │
│   Frontend       │◄───────►│    Backend       │◄───────►│   LLM Providers    │
│   React + Vite   │  HTTP   │  Flask + Python  │  HTTPS  │                    │
│                  │         │                  │         │  • OpenAI API      │
└──────────────────┘         └──────────────────┘         │  • Anthropic API   │
      │                            │                       │  • Google Gemini   │
      │                            │                       └────────────────────┐
  Tailwind CSS             Config + Prompts                         │
  Lucide Icons            Environment Vars                   Models & APIs


Flow:
1. User types text in React frontend
2. User selects style (or presses Enter for default)
3. Frontend sends POST request to Flask backend
4. Backend loads appropriate prompt from prompts.json
5. Backend determines provider (OpenAI/Anthropic/Google) based on model
6. Backend routes request to appropriate API with streaming enabled
7. Backend streams response back to frontend via SSE
8. Frontend displays response word-by-word in real-time
```

## Project Structure

```
/RePhraseAI
├── /frontend                   # React frontend application
│   ├── /src
│   │   ├── /components
│   │   │   ├── ChatMessage.jsx     # Message display component
│   │   │   ├── InputBox.jsx        # Input with voice & style buttons
│   │   │   ├── ModelSelector.jsx   # Model dropdown selector
│   │   │   └── StyleButtons.jsx    # Style selection buttons
│   │   ├── App.jsx                 # Main application logic
│   │   └── index.css               # Tailwind CSS styles
│   ├── .env                        # Frontend environment variables
│   ├── .env.example                # Environment template
│   └── package.json
│
├── /backend                    # Flask backend server
│   ├── app.py                      # Main Flask application
│   ├── config.json                 # LLM Gateway configuration
│   ├── prompts.json                # System prompts for each style
│   ├── .env                        # Backend environment variables (API key)
│   ├── .env.example                # Environment template
│   ├── requirements.txt            # Python dependencies
│   └── venv/                       # Virtual environment (created)
│
└── README.md                   # This file
```

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+
- **API Keys** (at least one required):
  - **OpenAI API Key** - Get from https://platform.openai.com/api-keys
  - **Anthropic API Key** - Get from https://console.anthropic.com/settings/keys
  - **Google API Key** - Get from https://aistudio.google.com/app/apikey

## Quick Start

### 1. Clone or Navigate to Project

```bash
cd /path/to/RePhraseAI
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from template
cp .env.example .env

# Edit .env and add your API key
nano .env  # or use your preferred editor
```

**Backend .env file:**
```bash
# API Keys (at least one required)
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
GOOGLE_API_KEY=your-google-api-key-here
```

You only need to set the API keys for the provider(s) you plan to use.

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# The default settings should work for local development
# .env contains: VITE_API_URL=http://localhost:5000
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python3 app.py
```
Backend runs on: `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:3000` (or next available port)

**Open your browser:** Navigate to `http://localhost:3000`

## Usage

### Quick Guide

1. **Type Your Text** - Enter the text you want to rephrase
2. **Choose How to Send:**
   - **Press Enter** → Uses "Default" style (improves clarity & grammar)
   - **Click Style Button** → Professional 💼, Casual 💬, Business Casual 🤝, or Creative ✨
3. **Watch AI Generate** - Real-time streaming response
4. **Copy Result** - Click the copy button to use your rephrased text

### The 5 Styles

| Style | Icon | Use Case | Example |
|-------|------|----------|---------|
| **Default** | 🔄 | Quick improvements | Press Enter - Fixes grammar, improves clarity, maintains tone |
| **Professional** | 💼 | Formal emails | Business correspondence, official communications |
| **Casual** | 💬 | Friends & family | WhatsApp, text messages, informal chats |
| **Business Casual** | 🤝 | Team communication | Slack, Teams, internal messages |
| **Creative** | ✨ | Fun & engaging | Adds personality, humor, wordplay |

### Voice Input

Click the microphone button 🎙️ to use voice input:
- Red mic = Recording
- Gray mic = Not recording
- Works in Chrome, Edge, and Safari

## Configuration

### Backend Configuration (`backend/config.json`)

Configure which models are available in the application:

```json
{
  "default_model": "gpt-4o-mini",
  "available_models": {
    "anthropic": [
      "claude-sonnet-4-5-20250929",
      "claude-sonnet-4-20250522"
    ],
    "openai": [
      "gpt-5-nano",
      "gpt-5-mini",
      "gpt-5",
      "o4-mini",
      "o3-mini",
      "gpt-4o-mini"
    ],
    "google": [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash-lite"
    ]
  }
}
```

**Configuration Fields:**
- **`default_model`** - The model selected by default in the UI
- **`available_models`** - Models organized by provider (anthropic, openai, google)

**Supported Models (Cost-Efficient 2025 Releases):**

**Anthropic Claude 4 Series:**
- **Claude Sonnet 4.5** (September 2025) - Best coding model, $3/$15 per 1M tokens
- **Claude Sonnet 4** (May 2025) - Smart, efficient everyday model, $3/$15 per 1M tokens

**OpenAI GPT-5 & O-Series:**
- **GPT-5 Nano** (August 2025) - Ultra-fast & cheap, $0.05/$0.40 per 1M tokens, 400K context
- **GPT-5 Mini** (August 2025) - Fast & cost-efficient, $0.25/$2 per 1M tokens, 400K context
- **GPT-5** (August 2025) - Flagship model, $1.25/$10 per 1M tokens, 80% fewer errors
- **o4-mini** (April 2025) - Fast reasoning, cost-efficient
- **o3-mini** (January 2025) - Cost-efficient reasoning for coding, math, science
- **GPT-4o Mini** - Efficient multimodal model

**Google Gemini 2.x Series:**
- **Gemini 2.5 Flash** (2025) - High quality + efficiency, 54% on SWE-Bench
- **Gemini 2.5 Flash-Lite** (2025) - Fast, low-cost, high-performance
- **Gemini 2.0 Flash-Lite** (2025) - Most cost-efficient Gemini model

### Customizing Prompts (`backend/prompts.json`)

Edit the prompts to change how each style works:

```json
{
  "styles": [
    {
      "id": "default",
      "label": "Default",
      "icon": "🔄",
      "description": "Clear & improved",
      "prompt": "Your custom prompt here..."
    },
    ...
  ]
}
```

### Environment Variables

**Backend (`.env`):**
```bash
# API Keys (at least one required)
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
GOOGLE_API_KEY=your-google-api-key-here
```

**Setup Instructions:**

1. **Get API Keys:**
   - **OpenAI**: https://platform.openai.com/api-keys
   - **Anthropic**: https://console.anthropic.com/settings/keys
   - **Google**: https://aistudio.google.com/app/apikey

2. **Add to `.env` file:**
   - Set at least one API key for the provider(s) you want to use
   - You can use one, two, or all three providers simultaneously

3. **Configure Models:**
   - Edit `config.json` to add/remove models
   - Models are automatically routed to the correct provider based on their name

**Frontend (`.env`):**
```bash
# Change this for production deployment
VITE_API_URL=http://localhost:5000
```

## API Endpoints

### `GET /api/models`
Returns available models and categories.

**Response:**
```json
{
  "models": ["gpt-4.1", "claude-sonnet-4-20250514", ...],
  "default": "gpt-4.1",
  "model_categories": {
    "anthropic": [...],
    "openai": [...]
  }
}
```

### `GET /api/styles`
Returns available rephrasing styles (excludes "default").

**Response:**
```json
{
  "styles": [
    {
      "id": "office",
      "label": "Professional",
      "icon": "💼",
      "description": "Formal & polished"
    },
    ...
  ]
}
```

### `POST /api/rephrase`
Streams rephrased text using Server-Sent Events (SSE).

**Request:**
```json
{
  "text": "hey can u help me with this",
  "style": "office",
  "model": "gpt-4.1"
}
```

**Response:** SSE stream
```
data: {"content": "Hello"}
data: {"content": ","}
data: {"content": " could"}
data: {"content": " you"}
...
data: [DONE]
```

## Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **Web Speech API** - Voice input

### Backend
- **Flask** - Python web framework
- **Flask-CORS** - Cross-origin support
- **python-dotenv** - Environment variable management
- **OpenAI SDK** - Direct OpenAI API integration
- **Anthropic SDK** - Direct Anthropic API integration
- **Google Generative AI SDK** - Direct Google Gemini API integration

## Troubleshooting

### Backend Issues

**"At least one API key must be set" error**
```bash
# Make sure .env file exists in backend folder
cd backend
ls -la .env

# Check content
cat .env

# Should contain at least one of:
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# GOOGLE_API_KEY=...
```

**Port 5000 already in use**
```bash
# Find process using port 5000
lsof -ti:5000

# Kill the process
lsof -ti:5000 | xargs kill -9

# Or change port in app.py:
# app.run(debug=True, port=5001)
```

**"config.json not found"**
```bash
# Ensure you're in the backend directory
cd backend
python3 app.py
```

### Frontend Issues

**Cannot connect to backend**
```bash
# Check backend is running
curl http://localhost:5000/api/models

# Check frontend .env
cat frontend/.env
# Should show: VITE_API_URL=http://localhost:5000

# Restart frontend after .env changes
cd frontend
npm run dev
```

**Models not loading**
- Check browser console for errors (F12)
- Verify at least one API key is set and valid
- Ensure backend is running and accessible
- Check backend logs for initialization messages

### Streaming Issues

**Response not streaming**
- Some models may not support streaming
- Check browser console for SSE errors
- Try a different model

**Slow responses**
- Model may be large (try o4-mini, o3-mini, gpt-4o-mini, or gemini-2.5-flash-lite)
- Network latency to API provider
- Check timing metrics displayed in the UI
- Reasoning models (o3, o4-mini, Claude Opus 4.1) take longer as they think through problems

## Development

### Frontend Development
```bash
cd frontend
npm run dev        # Start dev server with HMR
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # Lint code
```

### Backend Development
```bash
cd backend
source venv/bin/activate

python3 app.py     # Run with debug mode (auto-reload)

# Test endpoints
curl http://localhost:5000/api/models
curl http://localhost:5000/api/styles

# You should see initialization messages:
# [INFO] OpenAI client initialized
# [INFO] Anthropic client initialized
# [INFO] Google Gemini configured
```

## Features in Detail

### Real-time Streaming
- Uses Server-Sent Events (SSE) for low-latency streaming
- Displays tokens as they're generated
- Shows time-to-first-token and total response time

### Voice Input
- Uses Web Speech API (Chrome, Edge, Safari)
- Continuous recognition while button is pressed
- Visual feedback with red recording indicator

### Model Selection
- Dynamically loaded from backend configuration
- Categorized by provider (Anthropic/OpenAI/Google)
- Automatically routes to the correct API based on model name
- Persisted in component state during session

### Error Handling
- Specific error messages for common issues (401, 429, 503)
- Graceful fallbacks if API calls fail
- User-friendly error display in chat

### Responsive Design
- Works on desktop and mobile
- Adaptive layout for different screen sizes
- Touch-friendly button sizes

## License

MIT License

## Support

For questions or issues:
1. Check the Troubleshooting section above
2. Review browser console for errors (F12)
3. Verify all environment variables are set
4. Ensure both frontend and backend are running

---

**Built with ❤️ using React, Flask, and AI**
