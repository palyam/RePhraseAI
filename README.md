# RePhraseAI

AI-powered text rephrasing tool with real-time streaming. Transform text into different communication styles instantly.

## Features

### Core Features
- **6 Writing Styles**: Default, Professional, Casual, Business Casual, Creative, Concise
- **Multiple AI Models**: GPT-4, Claude, Gemini with easy model switching
- **Real-time Streaming**: See responses as they're generated
- **Voice Input**: Dictate your text instead of typing
- **Custom Instructions**: Add context or specific requirements to any request
- **Performance Metrics**: Track time-to-first-token and total response time

### Settings & Configuration
- **UI-Based Configuration**: Manage all settings through an intuitive web interface
- **API Key Management**: Securely store and manage API keys with masking
- **Model Configuration**: Add, remove, and set default models per provider
- **Custom Style Editor**: Create and edit custom rephrasing styles with inline form
- **Light/Dark Theme**: Toggle between themes with system preference support
- **Dual Mode Support**: Switch between Direct API and Gateway modes

## Quick Start

### Local Development (Recommended for Development)

**macOS/Linux:**
```bash
./start.sh
```

**Windows:**
```bash
start.bat
```

**Ports:**
- Frontend: http://localhost:5847
- Backend: http://localhost:5000

### Docker Way (Production/Isolated Environment)

**Requirements:** Docker and Docker Compose installed

**Quick Start (Pre-built Images):**

```bash
# 1. Download docker-compose.yml and .env.example
curl -O https://raw.githubusercontent.com/palyasx/RePhraseAI/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/palyasx/RePhraseAI/main/.env.example

# 2. Configure your API keys
cp .env.example .env
# Edit .env with your API keys

# 3. Start (automatically pulls images from Docker Hub)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

**Docker Hub Images:**
- Backend: `satishpalyam556/rephraseai-backend:latest`
- Frontend: `satishpalyam556/rephraseai-frontend:latest`

**Ports:**
- Frontend: http://localhost:5848
- Backend: http://localhost:5001

**Benefits:**
- Runs independently (survives terminal close)
- No need to install Python/Node
- Consistent environment across machines
- Easy to deploy
- Uses different ports to avoid conflicts with local development
- Pre-built images - no build time required

The script will automatically:
- Check and create virtual environment if needed
- Install dependencies if missing
- Start both backend and frontend servers
- Open at http://localhost:5847

Press `Ctrl+C` to stop all servers (terminal must stay open).

### Manual Setup

#### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
python app.py
```

#### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Default settings work for local dev
npm run dev
```

Open `http://localhost:5847`

## Configuration

### Settings UI (Recommended)

The easiest way to configure RePhraseAI is through the Settings interface:

1. Open the application at http://localhost:5847
2. Click the "Settings" button in the top right
3. Navigate through the tabs:
   - **LLM & API Keys**: Choose between Direct/Gateway mode and manage API keys
   - **Models**: Add/remove models and set your default model using radio buttons
   - **Styles**: Create and customize rephrasing styles with the inline editor

**Features:**
- API keys are masked for security (shows only last 4 characters)
- Test API key connectivity before saving
- Automatic backup of configuration before changes
- Changes persist across restarts

### Manual Configuration

Alternatively, you can configure via files:

#### Direct Mode (Default)

Direct connection to LLM provider APIs.

**backend/.env:**
```bash
LLM_MODE=direct
OPENAI_API_KEY=sk-your-key
ANTHROPIC_API_KEY=sk-ant-your-key
```

**Install SDKs:**
```bash
pip install openai anthropic google-generativeai
```

**backend/config.json:**
```json
{
  "default_model": "gpt-4o",
  "available_models": {
    "openai": ["gpt-4o", "gpt-4o-mini"],
    "anthropic": ["claude-3-5-sonnet-20241022"]
  }
}
```

### Gateway Mode

Route through corporate API gateway.

**backend/.env:**
```bash
LLM_MODE=gateway
GATEWAY_API_KEY=your-gateway-key
```

**backend/config.gateway.json:**
```json
{
  "llm_gateway_url": "https://gateway.company.com/anthropic/v1",
  "openai_gateway_url": "https://gateway.company.com/openai",
  "default_model": "gpt-4.1",
  "available_models": {
    "anthropic": ["claude-sonnet-4-5-20250929"],
    "openai": ["gpt-4.1", "gpt-5-mini-global"]
  }
}
```

## Usage

1. Type text in input box
2. (Optional) Add custom instructions
3. Press Enter for default style OR click a style button
4. Copy the result

## API Endpoints

### Main Endpoints
- `GET /api/models` - Get available models
- `GET /api/styles` - Get available styles
- `POST /api/rephrase` - Stream rephrased text (Server-Sent Events)

### Configuration Endpoints
- `GET /api/config` - Get current configuration (with masked API keys)
- `POST /api/config` - Save configuration changes
- `POST /api/config/test-key` - Test API key validity

## Project Structure

```
/RePhraseAI
├── docker-compose.yml      # Docker orchestration
├── start.sh / start.bat    # Quick start scripts
├── /frontend               # React 19 + Vite
│   ├── Dockerfile
│   ├── /src
│   │   ├── /components
│   │   │   ├── ChatMessage.jsx
│   │   │   ├── InputBox.jsx
│   │   │   ├── ModelSelector.jsx
│   │   │   ├── StyleButtons.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── LLMSettings.jsx
│   │   │   ├── ModelSettings.jsx
│   │   │   └── StyleSettings.jsx
│   │   ├── /contexts
│   │   │   └── ThemeContext.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── /backend                # Flask + Python
│   ├── Dockerfile
│   ├── app.py
│   ├── config_manager.py   # Configuration management
│   ├── /llm_providers
│   │   ├── direct_provider.py
│   │   └── gateway_provider.py
│   ├── config.json         # Direct mode config
│   ├── config.gateway.json # Gateway mode config
│   ├── prompts.json        # Style definitions
│   ├── .env                # API keys & secrets
│   └── requirements.txt
└── README.md
```

## Tech Stack

**Frontend:** React 19, Vite, Tailwind CSS
**Backend:** Flask, Flask-CORS, python-dotenv, requests

## Troubleshooting

**Backend not starting:**
```bash
# Check .env exists and has API key
cat backend/.env

# Check port 5000
lsof -ti:5000 | xargs kill -9
```

**Frontend can't connect:**
```bash
# Check backend is running
curl http://localhost:5000/api/models

# Verify frontend .env
cat frontend/.env  # Should have VITE_API_URL=http://localhost:5000
```

**Gateway mode issues:**
- Verify `config.gateway.json` exists
- Test gateway URLs with curl
- Check API key is valid

## License

MIT License - See LICENSE file for details
