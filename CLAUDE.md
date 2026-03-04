# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RePhraseAI is an AI-powered communication assistant with real-time streaming. It supports two primary modes:

1. **Rephrase Mode** — transforms input text into different communication styles (Professional, Casual, Business Casual, Creative, Concise)
2. **Compose Mode** — composes or refines a response given an original message, optional user draft, and optional instructions

Both modes support **channel-aware tone** targeting:
- 📧 **Outlook Email** — professional, polished, modern email format
- 💬 **Teams Chat** — business casual, concise, scannable
- 📱 **WhatsApp** — personal, casual, fun with emojis

It supports multiple LLM providers through two architectural modes: Direct API access and Gateway-based access.

## Development Commands

### Local Development (Recommended)

**Start both frontend and backend:**
```bash
./start.sh  # macOS/Linux
start.bat   # Windows
```

**Manual start:**
```bash
# Backend (runs on port 5000)
cd backend
source venv/bin/activate
python app.py

# Frontend (runs on port 5847)
cd frontend
npm run dev
```

**URLs:**
- Frontend: http://localhost:5847
- Backend: http://localhost:5002
- Backend API health check: `curl http://localhost:5002/api/models`

### Docker Deployment

**Using pre-built images from Docker Hub:**
```bash
docker-compose up -d          # Start containers
docker-compose logs -f        # View logs
docker-compose down           # Stop containers
```

**Rebuild and run locally:**
```bash
docker-compose up -d --build
```

**Docker ports:** Frontend on 5848, Backend on 5001 (different from local dev to avoid conflicts)

### Testing & Debugging

**Test backend API directly:**
```bash
# Check available models
curl http://localhost:5002/api/models

# Check available styles
curl http://localhost:5002/api/styles

# Test rephrase endpoint (streaming)
curl -X POST http://localhost:5002/api/rephrase \
  -H "Content-Type: application/json" \
  -d '{"text": "test", "model": "gpt-5.2-global", "styles": ["default"]}'

# Test compose endpoint (streaming)
curl -X POST http://localhost:5002/api/compose \
  -H "Content-Type: application/json" \
  -d '{"original_message": "Can we meet tomorrow?", "instructions": "decline politely", "channel": "outlook", "model": "gpt-5.2-global"}'
```

**Kill stuck processes:**
```bash
lsof -ti:5002 | xargs kill -9  # Backend
lsof -ti:5847 | xargs kill -9  # Frontend
```

## Architecture Overview

### Dual-Mode Provider Architecture

The backend uses a **factory pattern** to support two distinct deployment modes:

1. **Direct Mode** (`LLM_MODE=direct`):
   - Direct API calls to OpenAI, Anthropic, and Google using their official SDKs
   - Requires provider-specific API keys: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`
   - Configuration in `backend/config.json`
   - Implementation: `backend/llm_providers/direct_provider.py`

2. **Gateway Mode** (`LLM_MODE=gateway`):
   - Routes through corporate API gateway using HTTP requests
   - Single `GATEWAY_API_KEY` for authentication
   - Configuration in `backend/config.gateway.json`
   - Supports custom gateway URLs for different providers
   - Implementation: `backend/llm_providers/gateway_provider.py`
   - Handles both Anthropic and OpenAI gateway formats
   - Special handling for newer models (O3, O4, GPT-5, GPT-5.2) that use `max_completion_tokens`
   - Anthropic gateway uses full endpoint URL directly (not appending `/messages`)

**Provider Selection:**
- Factory function in `backend/llm_providers/__init__.py` reads `LLM_MODE` env var
- Returns appropriate provider instance based on mode
- Both providers implement `BaseLLMProvider` interface

### Configuration Management

**ConfigManager** (`backend/config_manager.py`) handles:
- Reading/writing `.env` files for API keys
- Managing `config.json` or `config.gateway.json` based on mode
- Managing `prompts.json` for custom styles
- API key masking (shows only last 4 characters)
- Automatic backups before configuration changes (stored in `backend/backups/`)
- Smart detection of masked vs. unmasked keys (doesn't overwrite with masked values)

### Frontend Architecture

**React 19 + Vite** with component structure:
- `App.jsx`: Main orchestrator, handles SSE streaming, message state, view routing
- `InputBox.jsx`: Text input, voice input, channel selector, original message toggle, additional instructions, style selection and compose button
- `ChatMessage.jsx`: Message rendering with markdown support, copy functionality
- `StyleButtons.jsx`: Dynamic style button grid loaded from API
- `ModelSelector.jsx`: Dropdown for model selection (loads from `/api/models`)
- `Settings.jsx`: Tabbed settings interface (LLM & API Keys, Models, Styles)
- `LLMSettings.jsx`: Mode switching and API key management with masking
- `ModelSettings.jsx`: Add/remove models, set default with radio buttons
- `StyleSettings.jsx`: Side-by-side style editor (list on left, inline form on right)
- `ThemeContext.jsx`: Dark/light theme state management

**Key patterns:**
- Server-Sent Events (SSE) for streaming responses
- Stable message IDs using timestamps to prevent React key issues
- Performance metrics tracking (time-to-first-token, total response time)
- Multi-style support (can rephrase into multiple styles simultaneously)
- Channel-aware tone: `CHANNEL_ICONS` and `CHANNEL_LABELS` maps defined at module level in `App.jsx`

### Streaming Response Format

**Backend to Frontend (SSE):**
```javascript
// Content chunk
data: {"content": "text chunk"}

// Multi-style markers
data: {"style_start": "professional", "style_label": "Professional", "style_index": 0}
data: {"style_end": "professional", "style_index": 0}

// Completion
data: [DONE]

// Errors
data: {"error": "message", "error_code": "ERROR_TYPE"}
```

### Style System

Styles are defined in `backend/prompts.json` as an array:
```json
{
  "styles": [
    {
      "id": "professional",
      "label": "Professional",
      "icon": "💼",
      "description": "Formal & polished",
      "prompt": "System prompt text..."
    }
  ]
}
```

Styles can be edited through Settings UI or by directly editing `prompts.json`.

## Important Implementation Details

### Backend Flask App (`app.py`)

- Flask runs on `0.0.0.0:5000` to allow Docker container access
- CORS enabled for frontend communication
- Configuration loaded based on `LLM_MODE` environment variable
- Prompts loaded into lookup dictionary: `{style_id: style_object}`
- `/api/rephrase` endpoint supports both single `style` and multiple `styles` parameters
- `/api/compose` endpoint accepts `original_message`, `my_draft`, `instructions`, `channel`, `model`
- `CHANNEL_TONES` dict in `app.py` maps channel IDs to tone instruction strings injected into system prompts

### Gateway Provider Specifics

**Critical for gateway mode:**
- Uses `requests.post()` with `stream=True` for SSE
- Sets `verify=False` for corporate certificates (internal gateways)
- Anthropic format: Uses full `llm_gateway_url` directly (no `/messages` suffix appended)
- OpenAI format: Uses `/deployments/{model}/chat/completions` with API version
- Handles different response formats (Anthropic: `content_block_delta`, OpenAI: `choices[0].delta`)
- Newer models (O3, O4, GPT-5, GPT-5.2): Use `max_completion_tokens` instead of `max_tokens`, don't support temperature adjustment

### Environment Variables

**Required for operation:**
- `LLM_MODE`: `direct` or `gateway` (defaults to `direct`)
- Gateway mode: `GATEWAY_API_KEY`
- Direct mode: At least one of `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`

**Configuration precedence:**
- Environment variables in `.env` file
- Configuration files: `config.gateway.json` (gateway mode) or `config.json` (direct mode)
- Prompts in `prompts.json`

### Port Configuration

**Local Development:**
- Frontend: 5847
- Backend: 5002

**Docker Deployment:**
- Frontend: 5848 → 5847 (container internal)
- Backend: 5001 → 5000 (container internal)

**Why different?** Allows local dev and Docker to run simultaneously without conflicts.

### Common Patterns When Contributing

**Adding a new LLM provider:**
1. Create new provider class in `backend/llm_providers/` extending `BaseLLMProvider`
2. Implement `stream_response()` and `get_available_models()` methods
3. Update factory in `__init__.py` to handle new mode
4. Add configuration in respective config file

**Adding a new style:**
- Edit `backend/prompts.json` to add style object with id, label, icon, description, prompt
- Or use Settings UI → Styles tab → Add Style button

**Modifying streaming response:**
- Backend: Modify `yield` statements in provider classes
- Frontend: Update SSE parsing in `App.jsx` `handleStyleSelect()` function

**Adding a new channel:**
1. Add entry to `CHANNEL_TONES` dict in `backend/app.py`
2. Add entry to `CHANNELS` array in `frontend/src/components/InputBox.jsx`
3. Add icon/label to `CHANNEL_ICONS` and `CHANNEL_LABELS` in `frontend/src/App.jsx`

**Configuration changes:**
- Use Settings UI for runtime changes (creates automatic backups)
- For deployment: Edit `.env` and config files directly, restart backend

## Tech Stack

**Frontend:** React 19, Vite, Tailwind CSS, Lucide React (icons)
**Backend:** Flask, Flask-CORS, python-dotenv, requests
**Direct Mode SDKs:** openai, anthropic, google-generativeai (optional)
**Deployment:** Docker, Docker Compose

## Docker Hub Images

Published images:
- `satishpalyam556/rephraseai-backend:latest`
- `satishpalyam556/rephraseai-frontend:latest`

Users can deploy without cloning repo by downloading `docker-compose.yml` and `.env.example`.
