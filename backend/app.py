from flask import Flask, request, Response, jsonify, stream_with_context
from flask_cors import CORS
from dotenv import load_dotenv
import json
import requests
import os
import sys

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Load configuration with error handling
try:
    with open('config.json', 'r') as f:
        config = json.load(f)
except FileNotFoundError:
    print("[ERROR] config.json not found. Please create it with your API configuration.")
    sys.exit(1)
except json.JSONDecodeError as e:
    print(f"[ERROR] Invalid JSON in config.json: {e}")
    sys.exit(1)

# Load prompts with error handling
try:
    with open('prompts.json', 'r') as f:
        prompts_data = json.load(f)
        # Create a lookup dict for easy access: {style_id: full_style_object}
        prompts = {style['id']: style for style in prompts_data['styles']}
except FileNotFoundError:
    print("[ERROR] prompts.json not found. Please create it with style definitions.")
    sys.exit(1)
except (json.JSONDecodeError, KeyError) as e:
    print(f"[ERROR] Invalid JSON or missing 'styles' key in prompts.json: {e}")
    sys.exit(1)

# Iliad API Configuration
ANTHROPIC_GATEWAY_URL = config['llm_gateway_url']
OPENAI_GATEWAY_URL = config.get('openai_gateway_url', '')
DEFAULT_MODEL = config['default_model']

# Load API Key from environment variable
API_KEY = os.getenv('ILIAD_API_KEY')
if not API_KEY:
    print("[ERROR] ILIAD_API_KEY environment variable not set. Please create a .env file with your API key.")
    sys.exit(1)

AVAILABLE_MODELS = config.get('available_models', {})


def get_model_type(model_name):
    """Determine if model is Anthropic or OpenAI based"""
    if model_name in AVAILABLE_MODELS.get('anthropic', []):
        return 'anthropic'
    elif model_name in AVAILABLE_MODELS.get('openai', []):
        return 'openai'
    # Default to anthropic if model starts with 'claude'
    return 'anthropic' if model_name.startswith('claude') else 'openai'


def get_gateway_url(model_name):
    """Get the appropriate gateway URL based on model type"""
    model_type = get_model_type(model_name)
    if model_type == 'openai':
        # OpenAI models use deployment-specific URLs
        return f"{OPENAI_GATEWAY_URL}/deployments/{model_name}/chat/completions?api-version=2024-02-01"
    else:
        # Anthropic models use messages endpoint
        return f"{ANTHROPIC_GATEWAY_URL}/messages"


@app.route('/api/models', methods=['GET'])
def get_models():
    """Return available models list with default selected"""
    # Combine all available models from config
    all_models = []
    if AVAILABLE_MODELS:
        all_models.extend(AVAILABLE_MODELS.get('anthropic', []))
        all_models.extend(AVAILABLE_MODELS.get('openai', []))

    # If no models configured, use defaults
    if not all_models:
        all_models = [
            "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku-20241022",
            "gpt-4.1",
            "gpt-4.1-mini"
        ]

    return jsonify({
        "models": all_models,
        "default": DEFAULT_MODEL,
        "model_categories": AVAILABLE_MODELS
    })


@app.route('/api/styles', methods=['GET'])
def get_styles():
    """Return available styles with their metadata"""
    # Return the styles array from prompts.json
    # Exclude the 'prompt' field from the response to keep it lightweight
    styles = []
    for style_id, style_data in prompts.items():
        styles.append({
            'id': style_data['id'],
            'label': style_data['label'],
            'icon': style_data['icon'],
            'description': style_data['description']
        })
    return jsonify({"styles": styles})


@app.route('/api/rephrase', methods=['POST'])
def rephrase():
    """Streaming endpoint for text rephrasing"""
    data = request.json
    text = data.get('text', '')
    style = data.get('style', 'default')
    model = data.get('model', DEFAULT_MODEL)

    # Get system prompt for the selected style
    style_data = prompts.get(style, prompts['default'])
    system_prompt = style_data['prompt']

    # Get the appropriate gateway URL for the model
    gateway_url = get_gateway_url(model)
    model_type = get_model_type(model)

    # Prepare headers
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
}

    # Prepare request payload based on model type
    if model_type == 'anthropic':
        # Anthropic format
        headers['anthropic-version'] = '2023-06-01'
        payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": f"{system_prompt}\n\n{text}"}
            ],
            "stream": True,
            "max_tokens": 4096,
            "temperature": 0.7
        }
    else:
        # OpenAI format
        # Newer models (O3, O4, GPT-5) use max_completion_tokens instead of max_tokens
        uses_new_api = any(x in model.lower() for x in ['o3', 'o4', 'gpt-5'])

        payload = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            "stream": True
        }

        # GPT-5 and O-series models only support temperature=1 (default)
        # Other models can use custom temperature
        if not uses_new_api:
            payload["temperature"] = 0.7

        if uses_new_api:
            # O-series and GPT-5 models need more tokens for reasoning + completion
            payload["max_completion_tokens"] = 16384
        else:
            payload["max_tokens"] = 4096

    def generate():
        try:
            # Log request details for debugging
            print(f"[DEBUG] Requesting model: {model}")
            print(f"[DEBUG] Gateway URL: {gateway_url}")
            print(f"[DEBUG] Payload: {payload}")

            # Stream from LLM Gateway
            response = requests.post(
                gateway_url,
                headers=headers,
                json=payload,
                stream=True,
                timeout=60,
                verify=False  # For internal corporate certificates
            )

            print(f"[DEBUG] Response status: {response.status_code}")

            # Handle HTTP error responses with specific messages
            if response.status_code == 401:
                error_data = {'error': 'Authentication failed. Please check your API key.', 'error_code': 'AUTH_ERROR'}
                yield f"data: {json.dumps(error_data)}\n\n"
                return
            elif response.status_code == 429:
                error_data = {'error': 'Rate limit exceeded. Please wait a moment and try again.', 'error_code': 'RATE_LIMIT'}
                yield f"data: {json.dumps(error_data)}\n\n"
                return
            elif response.status_code == 503:
                error_data = {'error': 'Service temporarily unavailable. Please try again later.', 'error_code': 'SERVICE_UNAVAILABLE'}
                yield f"data: {json.dumps(error_data)}\n\n"
                return
            elif response.status_code >= 400:
                error_data = {'error': f'API error: {response.status_code}. Please try again or select a different model.', 'error_code': 'API_ERROR'}
                yield f"data: {json.dumps(error_data)}\n\n"
                return

            for line in response.iter_lines():
                if line:
                    line_text = line.decode('utf-8')
                    if line_text.startswith('data: '):
                        data_str = line_text[6:]
                        if data_str.strip() == '[DONE]':
                            yield f"data: [DONE]\n\n"
                            break

                        try:
                            chunk = json.loads(data_str)
                            content = None

                            # Handle Anthropic format
                            if 'type' in chunk:
                                if chunk['type'] == 'content_block_delta':
                                    delta = chunk.get('delta', {})
                                    content = delta.get('text', '')
                                elif chunk['type'] == 'message_stop':
                                    yield f"data: [DONE]\n\n"
                                    break
                            # Handle OpenAI format
                            elif 'choices' in chunk and len(chunk['choices']) > 0:
                                delta = chunk['choices'][0].get('delta', {})
                                content = delta.get('content', '')

                            if content:
                                yield f"data: {json.dumps({'content': content})}\n\n"
                        except json.JSONDecodeError:
                            continue

        except requests.exceptions.Timeout:
            error_data = {'error': 'Request timed out. The service is taking too long to respond. Please try again.', 'error_code': 'TIMEOUT'}
            print(f"[ERROR] Request timeout")
            yield f"data: {json.dumps(error_data)}\n\n"
        except requests.exceptions.ConnectionError:
            error_data = {'error': 'Cannot connect to the API service. Please check your network connection or try again later.', 'error_code': 'CONNECTION_ERROR'}
            print(f"[ERROR] Connection error")
            yield f"data: {json.dumps(error_data)}\n\n"
        except requests.exceptions.RequestException as e:
            error_data = {'error': f'Network error: {str(e)}. Please try again.', 'error_code': 'NETWORK_ERROR'}
            print(f"[ERROR] Request exception: {e}")
            yield f"data: {json.dumps(error_data)}\n\n"
        except Exception as e:
            error_data = {'error': f'Unexpected error: {str(e)}. Please contact support if this persists.', 'error_code': 'UNKNOWN_ERROR'}
            print(f"[ERROR] Unexpected error: {e}")
            yield f"data: {json.dumps(error_data)}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    )


if __name__ == '__main__':
    app.run(debug=True, port=5000, threaded=True)
