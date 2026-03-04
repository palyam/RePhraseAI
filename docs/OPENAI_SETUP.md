# Getting Started: Clone & Setup with OpenAI

This guide walks you through cloning the RePhraseAI repository and configuring it to use OpenAI directly via API.

---

## Prerequisites

- [Git](https://git-scm.com/)
- [Python 3.9+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- An [OpenAI API key](https://platform.openai.com/api-keys)

---

## 1. Clone the Repository

```bash
git clone https://github.com/palyam/RePhraseAI.git
cd RePhraseAI
```

---

## 2. Backend Setup

### Create and activate a virtual environment

```bash
cd backend
python3 -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### Install dependencies

```bash
pip install -r requirements.txt
```

### Configure environment variables

Copy the example env file:

```bash
cp .env.example .env
```

Open `backend/.env` and set the following:

```env
LLM_MODE=direct
OPENAI_API_KEY=sk-...your-openai-key-here...
```

> Only `OPENAI_API_KEY` is required. Leave `ANTHROPIC_API_KEY` and `GOOGLE_API_KEY` commented out unless you plan to use those providers.

### Configure available models

Open `backend/config.json` and update to your preferred OpenAI models:

```json
{
  "default_model": "gpt-4o",
  "available_models": {
    "openai": [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo"
    ],
    "anthropic": [],
    "google": []
  }
}
```

> Set `default_model` to the model that should be pre-selected in the UI on load.

### Start the backend

```bash
python app.py
```

Backend will start at **http://localhost:5002**

Verify it's running:

```bash
curl http://localhost:5002/api/models
```

---

## 3. Frontend Setup

Open a new terminal from the project root:

```bash
cd frontend
npm install
```

### Configure the API URL

Open `frontend/.env` (create it if it doesn't exist):

```env
VITE_API_URL=http://localhost:5002
```

### Start the frontend

```bash
npm run dev
```

Frontend will start at **http://localhost:5847**

---

## 4. Open the App

Navigate to **http://localhost:5847** in your browser.

You should see the model selector populated with your configured OpenAI models and the connection error banner should be gone.

---

## Available OpenAI Models

| Model | Best for |
|---|---|
| `gpt-4o` | Best quality, multimodal |
| `gpt-4o-mini` | Fast and cost-effective |
| `gpt-4-turbo` | Long context tasks |
| `o1` | Complex reasoning |
| `o3-mini` | Fast reasoning |

To add more models, edit `backend/config.json` and restart the backend.

---

## Troubleshooting

**Connection error in the UI**
- Confirm the backend is running: `curl http://localhost:5002/api/models`
- Check `frontend/.env` has `VITE_API_URL=http://localhost:5002`
- Restart the frontend after any `.env` change

**Authentication error from OpenAI**
- Verify your API key starts with `sk-` and has no extra spaces
- Check your OpenAI account has available credits at [platform.openai.com/usage](https://platform.openai.com/usage)

**Model not appearing in the UI**
- Make sure the model ID in `config.json` exactly matches the OpenAI model name
- Restart the backend after editing `config.json`

**Kill stuck processes**
```bash
lsof -ti:5002 | xargs kill -9   # Backend
lsof -ti:5847 | xargs kill -9   # Frontend
```
