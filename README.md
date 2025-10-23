# RePhraseAI

AI-powered text rephrasing tool with real-time streaming. Transform text into different communication styles instantly.

## Features

- 5 writing styles (Default, Professional, Casual, Business, Creative)
- Multiple AI models (GPT, Claude, Gemini)
- Real-time streaming responses
- Voice input support
- Optional custom instructions
- Response timing metrics

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

```bash
# Start (runs in background)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

**Ports:**
- Frontend: http://localhost:5848
- Backend: http://localhost:5001

**Benefits:**
- Runs independently (survives terminal close)
- No need to install Python/Node
- Consistent environment across machines
- Easy to deploy
- Uses different ports to avoid conflicts with local development

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

### Direct Mode (Default)

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

- `GET /api/models` - Available models
- `GET /api/styles` - Available styles
- `POST /api/rephrase` - Stream rephrased text (SSE)

## Project Structure

```
/RePhraseAI
├── /frontend              # React + Vite
│   ├── /src/components
│   │   ├── ChatMessage.jsx
│   │   ├── InputBox.jsx
│   │   ├── ModelSelector.jsx
│   │   └── StyleButtons.jsx
│   └── package.json
├── /backend               # Flask + Python
│   ├── app.py
│   ├── /llm_providers
│   │   ├── direct_provider.py
│   │   └── gateway_provider.py
│   ├── config.json
│   ├── prompts.json
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
