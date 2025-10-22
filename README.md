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

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│                  │         │                  │         │                  │
│   Frontend       │◄───────►│    Backend       │◄───────►│   LLM Gateway    │
│   React + Vite   │  HTTP   │  Flask + Python  │  HTTPS  │   (Iliad API)    │
│                  │         │                  │         │                  │
└──────────────────┘         └──────────────────┘         └──────────────────┘
      │                            │                             │
      │                            │                             │
  Tailwind CSS             Config + Prompts              Anthropic/OpenAI
  Lucide Icons            Environment Vars                   Models


Flow:
1. User types text in React frontend
2. User selects style (or presses Enter for default)
3. Frontend sends POST request to Flask backend
4. Backend loads appropriate prompt from prompts.json
5. Backend forwards request to LLM Gateway with streaming enabled
6. Backend streams response back to frontend via SSE
7. Frontend displays response word-by-word in real-time
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
- **Iliad API Key** - Required for LLM access (internal users only)

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
# Iliad API Key
ILIAD_API_KEY=your-api-key-here
```

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

```json
{
  "llm_gateway_url": "https://api-epic.ir-gateway.abbvienet.com/iliad/anthropic/v1",
  "openai_gateway_url": "https://api-epic.ir-gateway.abbvienet.com/iliad/openai",
  "default_model": "gpt-4.1",
  "available_models": {
    "anthropic": [
      "claude-sonnet-4-5-20250929",
      "claude-sonnet-4-20250514",
      "claude-opus-4-20250514"
    ],
    "openai": [
      "gpt-4.1",
      "gpt-4.1-mini",
      "gpt-5-global",
      "o3-global",
      "o4-mini-bal"
    ]
  }
}
```

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
ILIAD_API_KEY=your-api-key-here
```

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
- **requests** - HTTP client for LLM Gateway

## Troubleshooting

### Backend Issues

**"ILIAD_API_KEY environment variable not set"**
```bash
# Make sure .env file exists in backend folder
cd backend
ls -la .env

# Check content
cat .env

# Should contain: ILIAD_API_KEY=your-key-here
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
- Verify API key is valid
- Ensure backend is running and accessible

### Streaming Issues

**Response not streaming**
- Some models may not support streaming
- Check browser console for SSE errors
- Try a different model

**Slow responses**
- Model may be large (try gpt-4.1-mini or haiku)
- Network latency to LLM Gateway
- Check timing metrics displayed in the UI

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
- Categorized by provider (Anthropic/OpenAI)
- Persisted in component state during session

### Error Handling
- Specific error messages for common issues (401, 429, 503)
- Graceful fallbacks if API calls fail
- User-friendly error display in chat

### Responsive Design
- Works on desktop and mobile
- Adaptive layout for different screen sizes
- Touch-friendly button sizes

## Component Architecture

### Frontend Components Overview

#### App.jsx (Main Container)
**Location:** `frontend/src/App.jsx:1`

The root component managing application state and orchestrating all child components.

**Key State Variables:**
```javascript
const [selectedModel, setSelectedModel] = useState('gpt-4.1');
const [messages, setMessages] = useState([]);
const [isStreaming, setIsStreaming] = useState(false);
const [currentUserText, setCurrentUserText] = useState('');
```

**Main Methods:**
- `handleSendMessage(text, style)` - Initiates API call and manages streaming
- `handleStyleSelect(style, text)` - Processes style button clicks
- `handleClearMessages()` - Resets conversation history

**Features:**
- Auto-scrolls to latest message
- Tracks performance metrics (TTFT, total response time)
- Manages SSE connection lifecycle
- Handles error states gracefully

#### ChatMessage.jsx
**Location:** `frontend/src/components/ChatMessage.jsx:1`

Displays individual messages with role-specific styling and metadata.

**Props:**
```javascript
{
  role: 'user' | 'assistant',
  content: string,
  model?: string,
  style?: string,
  timing?: { ttft: number, total: number },
  isStreaming?: boolean,
  error?: boolean
}
```

**Features:**
- Copy to clipboard with confirmation feedback
- Markdown rendering for AI responses
- Performance metric badges
- Streaming animation indicator
- Error state styling

#### InputBox.jsx
**Location:** `frontend/src/components/InputBox.jsx:1`

Handles all user input including text, voice, and action buttons.

**Props:**
```javascript
{
  onSendMessage: (text, style) => void,
  disabled: boolean,
  onStyleSelect: (style, text) => void
}
```

**Features:**
- Auto-expanding textarea (max 2000 characters)
- Web Speech API integration
- Character counter with visual feedback
- Keyboard shortcuts (Enter to send)
- Style buttons (conditional visibility)
- Voice recording with visual indicator
- Clear and send button states

**Voice Implementation:**
```javascript
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = true;
```

#### ModelSelector.jsx
**Location:** `frontend/src/components/ModelSelector.jsx:1`

Dropdown for selecting AI models with categorization.

**Features:**
- Fetches models from `/api/models` endpoint
- Groups by provider (Anthropic/OpenAI)
- Displays formatted model names
- Fallback models if API unavailable
- Persists selection during session

#### StyleButtons.jsx
**Location:** `frontend/src/components/StyleButtons.jsx:1`

Displays the four style options (excludes default).

**Props:**
```javascript
{
  onStyleSelect: (styleId) => void,
  disabled: boolean,
  compact?: boolean
}
```

**Styles Displayed:**
- Professional (💼)
- Casual (💬)
- Business Casual (🤝)
- Creative (✨)

### Backend Architecture

#### app.py Structure
**Location:** `backend/app.py:1`

Flask application handling all API endpoints and LLM Gateway communication.

**Configuration Loading (Lines 15-30):**
```python
# Load config.json and prompts.json
with open('config.json') as f:
    config = json.load(f)
with open('prompts.json') as f:
    prompts_data = json.load(f)
```

**Key Functions:**

1. **`get_model_type(model)`** - Determines if model is Anthropic or OpenAI
2. **`get_gateway_url(model)`** - Returns appropriate endpoint URL
3. **`build_request_payload(model, prompt, user_text)`** - Creates provider-specific request
4. **`stream_response()`** - Handles SSE streaming with error handling

**Request Flow:**
```
1. Receive POST /api/rephrase
2. Load style prompt from prompts.json
3. Detect model type (Anthropic vs OpenAI)
4. Build appropriate request payload
5. Stream response from LLM Gateway
6. Parse and forward chunks to frontend
7. Handle errors and timeouts
```

## Implementation Details

### Streaming Response Handling

#### Frontend SSE Parser
**Location:** `frontend/src/App.jsx:90-130`

```javascript
const response = await fetch(`${API_URL}/api/rephrase`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text, style, model: selectedModel })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') return;

      const parsed = JSON.parse(data);
      if (parsed.content) {
        // Append to message content
      }
    }
  }
}
```

#### Backend Stream Generator
**Location:** `backend/app.py:180-250`

```python
def generate():
    try:
        response = requests.post(
            gateway_url,
            headers=headers,
            json=payload,
            stream=True,
            timeout=60
        )

        for line in response.iter_lines():
            if line:
                # Parse based on model type
                if model_type == 'anthropic':
                    # Handle Anthropic format
                    data = json.loads(line.decode('utf-8').replace('data: ', ''))
                    if data.get('type') == 'content_block_delta':
                        content = data['delta']['text']
                        yield f"data: {json.dumps({'content': content})}\n\n"
                else:
                    # Handle OpenAI format
                    data = json.loads(line.decode('utf-8').replace('data: ', ''))
                    delta = data['choices'][0]['delta']
                    if 'content' in delta:
                        yield f"data: {json.dumps({'content': delta['content']})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
    finally:
        yield "data: [DONE]\n\n"

return Response(generate(), mimetype='text/event-stream')
```

### Model Type Detection

**Location:** `backend/app.py:140-155`

The backend automatically handles two different API formats:

```python
def get_model_type(model):
    """Determine if model is Anthropic or OpenAI"""
    anthropic_models = config['available_models']['anthropic']
    if model in anthropic_models:
        return 'anthropic'
    return 'openai'

def build_request_payload(model, system_prompt, user_text):
    model_type = get_model_type(model)

    if model_type == 'anthropic':
        # Anthropic format: system prompt + user message
        return {
            "model": model,
            "max_tokens": 8192,
            "messages": [{
                "role": "user",
                "content": f"{system_prompt}\n\n{user_text}"
            }],
            "stream": True
        }
    else:
        # OpenAI format: separate system and user messages
        payload = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text}
            ],
            "stream": True
        }

        # Handle token parameter differences
        if model.startswith(('o3', 'o4', 'gpt-5')):
            payload["max_completion_tokens"] = 8192
        else:
            payload["max_tokens"] = 8192

        # O-series and GPT-5 use default temperature of 1.0
        if not model.startswith(('o3', 'o4', 'gpt-5')):
            payload["temperature"] = 0.7

        return payload
```

### Performance Metrics

**Time-to-First-Token (TTFT)** measurement:

**Location:** `frontend/src/App.jsx:100-105`

```javascript
const startTime = Date.now();
let firstTokenTime = null;

// On first chunk received
if (!firstTokenTime) {
  firstTokenTime = Date.now();
  const ttft = firstTokenTime - startTime;
}

// On completion
const totalTime = Date.now() - startTime;
```

### Error Handling Strategy

**Frontend Error Display:**
**Location:** `frontend/src/App.jsx:135-150`

```javascript
catch (error) {
  const errorMessage =
    error.message.includes('401') ? 'Authentication failed. Please check your API key.' :
    error.message.includes('429') ? 'Rate limit exceeded. Please try again later.' :
    error.message.includes('503') ? 'Service temporarily unavailable.' :
    'An error occurred while processing your request.';

  setMessages(prev => [...prev, {
    role: 'assistant',
    content: errorMessage,
    error: true
  }]);
}
```

**Backend Error Handling:**
**Location:** `backend/app.py:200-220`

```python
try:
    response = requests.post(gateway_url, ...)
    response.raise_for_status()
except requests.exceptions.Timeout:
    yield f"data: {json.dumps({'error': 'Request timed out'})}\n\n"
except requests.exceptions.ConnectionError:
    yield f"data: {json.dumps({'error': 'Connection error'})}\n\n"
except requests.exceptions.HTTPError as e:
    status_code = e.response.status_code
    if status_code == 401:
        yield f"data: {json.dumps({'error': 'Invalid API key'})}\n\n"
    elif status_code == 429:
        yield f"data: {json.dumps({'error': 'Rate limit exceeded'})}\n\n"
    elif status_code == 503:
        yield f"data: {json.dumps({'error': 'Service unavailable'})}\n\n"
```

## Security Considerations

### API Key Management

**Best Practices:**
1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use environment variables** - API keys loaded from `.env`
3. **Backend-only authentication** - Frontend never sees API key
4. **Key rotation** - Change keys periodically

**Validation:**
```python
# backend/app.py:35-40
ILIAD_API_KEY = os.getenv('ILIAD_API_KEY')
if not ILIAD_API_KEY:
    raise ValueError("ILIAD_API_KEY environment variable not set")
```

### CORS Configuration

**Current Setup:**
```python
# backend/app.py:25-28
from flask_cors import CORS
CORS(app)  # Allows all origins in development
```

**Production Recommendation:**
```python
# Restrict to specific origins
CORS(app, origins=['https://yourdomain.com'])
```

### Input Validation

**Character Limits:**
- Frontend: 2000 character limit enforced in `InputBox.jsx:85`
- Backend: Should add validation in `app.py`

**Recommended Backend Validation:**
```python
@app.route('/api/rephrase', methods=['POST'])
def rephrase():
    data = request.json
    text = data.get('text', '').strip()

    # Validate input
    if not text:
        return jsonify({'error': 'Text is required'}), 400
    if len(text) > 2000:
        return jsonify({'error': 'Text exceeds 2000 characters'}), 400
```

### Rate Limiting

**Consider adding rate limiting for production:**

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)

@app.route('/api/rephrase')
@limiter.limit("20 per minute")
def rephrase():
    # ...
```

## Performance Optimization

### Frontend Optimization

#### 1. Build Optimization
```bash
cd frontend
npm run build
```

**Optimizations Applied:**
- Tree shaking removes unused code
- Minification reduces file size
- Code splitting for lazy loading
- Asset compression (gzip)

#### 2. React Performance
- Use `React.memo()` for expensive components
- Implement virtual scrolling for long message lists
- Debounce voice input processing
- Lazy load markdown renderer

**Example - Memoize ChatMessage:**
```javascript
// frontend/src/components/ChatMessage.jsx
import React from 'react';

const ChatMessage = React.memo(({ role, content, model, style, timing }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Only re-render if content changes
  return prevProps.content === nextProps.content;
});

export default ChatMessage;
```

#### 3. Network Optimization
- Enable HTTP/2 or HTTP/3 for multiplexing
- Implement request caching for models/styles
- Use CDN for static assets
- Compress API responses

### Backend Optimization

#### 1. Response Caching
Cache frequently requested prompts in memory:

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def get_style_prompt(style_id):
    """Cache prompts to avoid repeated file reads"""
    with open('prompts.json') as f:
        prompts = json.load(f)
    for style in prompts['styles']:
        if style['id'] == style_id:
            return style['prompt']
    return None
```

#### 2. Connection Pooling
Use session objects for connection reuse:

```python
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

# Create session with retry logic and connection pooling
session = requests.Session()
retry = Retry(total=3, backoff_factor=0.3)
adapter = HTTPAdapter(max_retries=retry, pool_connections=10, pool_maxsize=20)
session.mount('https://', adapter)

# Use session instead of requests
response = session.post(gateway_url, ...)
```

#### 3. Async Processing
Consider using async Flask with `asyncio` for better concurrency:

```python
from flask import Flask
from asyncio import create_task
import aiohttp

# Use async/await for non-blocking I/O
async def stream_from_llm(payload):
    async with aiohttp.ClientSession() as session:
        async with session.post(gateway_url, json=payload) as response:
            async for line in response.content:
                yield line
```

### Database Optimization (Future Enhancement)

If adding user accounts or history:
- Use PostgreSQL with connection pooling
- Index frequently queried fields
- Implement query caching
- Use Redis for session storage

### Monitoring & Metrics

**Recommended Tools:**
- **Frontend:** Lighthouse, Web Vitals
- **Backend:** Flask-Monitoring-Dashboard, Prometheus
- **APM:** New Relic, Datadog, or Sentry

**Key Metrics to Track:**
- Time-to-First-Token (TTFT)
- Total response time
- Error rate (4xx, 5xx)
- Request throughput
- Memory usage
- CPU utilization

## Deployment Guide

### Production Checklist

Before deploying to production:

- [ ] Change `DEBUG = False` in Flask
- [ ] Set up environment variables securely
- [ ] Configure CORS to specific origins only
- [ ] Enable HTTPS/TLS
- [ ] Set up rate limiting
- [ ] Configure proper logging
- [ ] Set up monitoring and alerts
- [ ] Test on staging environment
- [ ] Backup configuration files
- [ ] Document rollback procedure

### Frontend Deployment

#### Option 1: Vercel (Recommended)

**Step 1:** Install Vercel CLI
```bash
npm install -g vercel
```

**Step 2:** Build frontend
```bash
cd frontend
npm run build
```

**Step 3:** Deploy
```bash
vercel --prod
```

**Step 4:** Configure environment variables in Vercel dashboard:
```
VITE_API_URL=https://your-backend-domain.com
```

#### Option 2: Netlify

**Step 1:** Create `netlify.toml` in frontend directory:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Step 2:** Deploy via Netlify CLI or GitHub integration

#### Option 3: AWS S3 + CloudFront

```bash
cd frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

#### Option 4: Docker

**Create `frontend/Dockerfile`:**
```dockerfile
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Build and run:**
```bash
docker build -t rephrase-frontend .
docker run -p 80:80 rephrase-frontend
```

### Backend Deployment

#### Option 1: Railway (Simple & Fast)

**Step 1:** Install Railway CLI
```bash
npm install -g @railway/cli
```

**Step 2:** Login and create project
```bash
railway login
railway init
```

**Step 3:** Add environment variable
```bash
railway variables set ILIAD_API_KEY=your-key-here
```

**Step 4:** Deploy
```bash
cd backend
railway up
```

#### Option 2: AWS Elastic Beanstalk

**Step 1:** Install EB CLI
```bash
pip install awsebcli
```

**Step 2:** Initialize
```bash
cd backend
eb init -p python-3.8 rephrase-backend
```

**Step 3:** Create environment
```bash
eb create rephrase-env
```

**Step 4:** Set environment variables
```bash
eb setenv ILIAD_API_KEY=your-key-here
```

**Step 5:** Deploy
```bash
eb deploy
```

#### Option 3: Docker + Docker Compose (Recommended)

**Create `backend/Dockerfile`:**
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 5000

# Run with Gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "app:app"]
```

**Add Gunicorn to `requirements.txt`:**
```
Flask==3.0.0
Flask-CORS==4.0.0
python-dotenv==1.0.0
requests==2.31.0
gunicorn==21.2.0
```

**Create `docker-compose.yml` in root:**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - ILIAD_API_KEY=${ILIAD_API_KEY}
    volumes:
      - ./backend/config.json:/app/config.json
      - ./backend/prompts.json:/app/prompts.json
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

**Deploy:**
```bash
# Create .env file in root
echo "ILIAD_API_KEY=your-key-here" > .env

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Option 4: Traditional VPS (DigitalOcean, Linode, etc.)

**Step 1:** SSH into server
```bash
ssh user@your-server-ip
```

**Step 2:** Install dependencies
```bash
sudo apt update
sudo apt install python3-pip python3-venv nginx
```

**Step 3:** Clone repository
```bash
git clone https://github.com/yourusername/RePhraseAI.git
cd RePhraseAI/backend
```

**Step 4:** Set up Python environment
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Step 5:** Configure environment
```bash
nano .env
# Add: ILIAD_API_KEY=your-key-here
```

**Step 6:** Install and configure Gunicorn
```bash
pip install gunicorn

# Create systemd service
sudo nano /etc/systemd/system/rephrase.service
```

**Service file content:**
```ini
[Unit]
Description=RePhraseAI Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/RePhraseAI/backend
Environment="PATH=/path/to/RePhraseAI/backend/venv/bin"
EnvironmentFile=/path/to/RePhraseAI/backend/.env
ExecStart=/path/to/RePhraseAI/backend/venv/bin/gunicorn --workers 4 --bind 0.0.0.0:5000 app:app

[Install]
WantedBy=multi-user.target
```

**Step 7:** Start service
```bash
sudo systemctl start rephrase
sudo systemctl enable rephrase
sudo systemctl status rephrase
```

**Step 8:** Configure Nginx as reverse proxy
```bash
sudo nano /etc/nginx/sites-available/rephrase
```

**Nginx configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/RePhraseAI/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }
}
```

**Step 9:** Enable site and restart Nginx
```bash
sudo ln -s /etc/nginx/sites-available/rephrase /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Step 10:** Set up SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Environment-Specific Configuration

#### Production `.env` Files

**Backend:**
```bash
ILIAD_API_KEY=production-key-here
FLASK_ENV=production
LOG_LEVEL=INFO
```

**Frontend:**
```bash
VITE_API_URL=https://api.yourdomain.com
```

#### Logging Configuration

**Add to `backend/app.py`:**
```python
import logging
from logging.handlers import RotatingFileHandler

if not app.debug:
    # File logging
    file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240000, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)

    # Console logging
    stream_handler = logging.StreamHandler()
    stream_handler.setLevel(logging.INFO)
    app.logger.addHandler(stream_handler)

    app.logger.setLevel(logging.INFO)
    app.logger.info('RePhraseAI startup')
```

### Health Checks

**Add health check endpoint:**
```python
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    }), 200
```

### Monitoring Setup

**Add basic monitoring with Flask-Monitoring-Dashboard:**
```bash
pip install flask-monitoring-dashboard
```

```python
from flask_monitoringdashboard import dashboard

dashboard.bind(app)
# Access dashboard at /dashboard
```

## Contributing

We welcome contributions to RePhraseAI! Here's how you can help:

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/your-username/RePhraseAI.git
   cd RePhraseAI
   ```
3. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Set up development environment** (follow Quick Start guide)

### Code Style Guidelines

#### Frontend (JavaScript/React)

**Follow these conventions:**
- Use functional components with hooks
- Use arrow functions for component definitions
- Use `const` over `let` when possible
- Add PropTypes or TypeScript types
- Keep components under 300 lines
- Extract reusable logic into custom hooks

**Example:**
```javascript
import React, { useState, useEffect } from 'react';

const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Side effects here
  }, [dependencies]);

  return (
    <div className="container">
      {/* JSX here */}
    </div>
  );
};

export default MyComponent;
```

**Linting:**
```bash
cd frontend
npm run lint
npm run lint:fix  # Auto-fix issues
```

#### Backend (Python/Flask)

**Follow PEP 8 style guide:**
- Use snake_case for functions and variables
- Use PascalCase for classes
- Maximum line length: 100 characters
- Add docstrings to all functions
- Use type hints where applicable

**Example:**
```python
def calculate_response_time(start_time: float, end_time: float) -> float:
    """
    Calculate the response time in milliseconds.

    Args:
        start_time: Start timestamp in seconds
        end_time: End timestamp in seconds

    Returns:
        Response time in milliseconds
    """
    return (end_time - start_time) * 1000
```

**Formatting:**
```bash
cd backend
pip install black flake8
black app.py  # Auto-format
flake8 app.py  # Check style
```

### Testing Guidelines

#### Frontend Tests

**Add Jest/React Testing Library:**
```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

**Example test:**
```javascript
// frontend/src/components/ChatMessage.test.jsx
import { render, screen } from '@testing-library/react';
import ChatMessage from './ChatMessage';

describe('ChatMessage', () => {
  it('renders user message correctly', () => {
    render(<ChatMessage role="user" content="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });
});
```

#### Backend Tests

**Add pytest:**
```bash
cd backend
pip install pytest pytest-flask
```

**Example test:**
```python
# backend/test_app.py
import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json['status'] == 'healthy'

def test_get_models(client):
    response = client.get('/api/models')
    assert response.status_code == 200
    assert 'models' in response.json
```

**Run tests:**
```bash
pytest test_app.py -v
```

### Commit Message Convention

Use conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(frontend): add dark mode toggle"
git commit -m "fix(backend): handle timeout errors gracefully"
git commit -m "docs(readme): update deployment instructions"
```

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**
4. **Update CHANGELOG.md** (if exists)
5. **Create pull request** with clear description
6. **Link related issues** using keywords (Fixes #123)
7. **Wait for review** and address feedback

**PR Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Feature Requests & Bug Reports

**For bugs, include:**
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, versions)

**For features, include:**
- Use case description
- Expected behavior
- Alternative solutions considered
- Mockups/examples (if applicable)

### Areas for Contribution

**Good first issues:**
- Add loading skeleton for messages
- Implement keyboard shortcuts
- Add more writing styles
- Improve error messages
- Add unit tests
- Update documentation

**Advanced features:**
- User authentication
- Message history persistence
- Batch processing
- API rate limiting
- Internationalization (i18n)
- Dark mode
- Export to different formats
- Analytics dashboard

## Roadmap

**v1.1 (Next Release)**
- [ ] User accounts and authentication
- [ ] Message history persistence
- [ ] Dark mode support
- [ ] More writing styles (Technical, Empathetic, Concise)
- [ ] Export messages to PDF/Word

**v1.2**
- [ ] Team collaboration features
- [ ] Custom prompts per user
- [ ] Analytics dashboard
- [ ] API key management UI

**v2.0**
- [ ] Multi-language support
- [ ] Browser extension
- [ ] Mobile app (React Native)
- [ ] Workspace integrations (Slack, Teams)

## License

MIT License

Copyright (c) 2025 RePhraseAI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Support

For questions or issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review browser console for errors (F12)
3. Search [existing issues](https://github.com/your-username/RePhraseAI/issues)
4. Create a [new issue](https://github.com/your-username/RePhraseAI/issues/new) with details

## Acknowledgments

**Technologies:**
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Flask](https://flask.palletsprojects.com/) - Backend framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide Icons](https://lucide.dev/) - Icon library

**AI Providers:**
- [Anthropic](https://www.anthropic.com/) - Claude models
- [OpenAI](https://openai.com/) - GPT models

---

**Built with ❤️ using React, Flask, and AI**
