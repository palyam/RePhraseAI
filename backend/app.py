from flask import Flask, request, Response, jsonify, stream_with_context
from flask_cors import CORS
from dotenv import load_dotenv
import json
import os
import sys
from openai import OpenAI
from anthropic import Anthropic
import google.generativeai as genai

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

# Configuration
DEFAULT_MODEL = config['default_model']
AVAILABLE_MODELS = config.get('available_models', {})

# Load API Keys from environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY', '')

# Validate that at least one API key is set
if not any([OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY]):
    print("[ERROR] At least one API key must be set (OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_API_KEY)")
    sys.exit(1)

# Initialize API clients
openai_client = None
anthropic_client = None
gemini_configured = False

if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
    print("[INFO] OpenAI client initialized")

if ANTHROPIC_API_KEY:
    anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)
    print("[INFO] Anthropic client initialized")

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    gemini_configured = True
    print("[INFO] Google Gemini configured")


def get_model_type(model_name):
    """Determine if model is Anthropic, OpenAI, or Google based"""
    # Check in available models
    if model_name in AVAILABLE_MODELS.get('anthropic', []):
        return 'anthropic'
    elif model_name in AVAILABLE_MODELS.get('openai', []):
        return 'openai'
    elif model_name in AVAILABLE_MODELS.get('google', []):
        return 'google'

    # Fallback to name-based detection
    if model_name.startswith('claude'):
        return 'anthropic'
    elif model_name.startswith('gemini'):
        return 'google'
    else:
        return 'openai'


def stream_openai(model, system_prompt, text):
    """Stream response from OpenAI API"""
    try:
        if not openai_client:
            yield f"data: {json.dumps({'error': 'OpenAI API key not configured', 'error_code': 'CONFIG_ERROR'})}\n\n"
            return

        stream = openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            stream=True,
            temperature=0.7,
            max_tokens=4096
        )

        for chunk in stream:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                yield f"data: {json.dumps({'content': content})}\n\n"

        yield f"data: [DONE]\n\n"

    except Exception as e:
        error_data = {'error': f'OpenAI API error: {str(e)}', 'error_code': 'API_ERROR'}
        print(f"[ERROR] OpenAI API error: {e}")
        yield f"data: {json.dumps(error_data)}\n\n"


def stream_anthropic(model, system_prompt, text):
    """Stream response from Anthropic API"""
    try:
        if not anthropic_client:
            yield f"data: {json.dumps({'error': 'Anthropic API key not configured', 'error_code': 'CONFIG_ERROR'})}\n\n"
            return

        with anthropic_client.messages.stream(
            model=model,
            max_tokens=4096,
            temperature=0.7,
            messages=[
                {"role": "user", "content": f"{system_prompt}\n\n{text}"}
            ]
        ) as stream:
            for text_chunk in stream.text_stream:
                yield f"data: {json.dumps({'content': text_chunk})}\n\n"

        yield f"data: [DONE]\n\n"

    except Exception as e:
        error_data = {'error': f'Anthropic API error: {str(e)}', 'error_code': 'API_ERROR'}
        print(f"[ERROR] Anthropic API error: {e}")
        yield f"data: {json.dumps(error_data)}\n\n"


def stream_gemini(model, system_prompt, text):
    """Stream response from Google Gemini API"""
    try:
        if not gemini_configured:
            yield f"data: {json.dumps({'error': 'Google API key not configured', 'error_code': 'CONFIG_ERROR'})}\n\n"
            return

        # Initialize the model
        gemini_model = genai.GenerativeModel(
            model_name=model,
            generation_config={
                "temperature": 0.7,
                "max_output_tokens": 4096,
            }
        )

        # Combine system prompt and user text
        prompt = f"{system_prompt}\n\n{text}"

        # Generate streaming response
        response = gemini_model.generate_content(prompt, stream=True)

        for chunk in response:
            if chunk.text:
                yield f"data: {json.dumps({'content': chunk.text})}\n\n"

        yield f"data: [DONE]\n\n"

    except Exception as e:
        error_data = {'error': f'Gemini API error: {str(e)}', 'error_code': 'API_ERROR'}
        print(f"[ERROR] Gemini API error: {e}")
        yield f"data: {json.dumps(error_data)}\n\n"


@app.route('/api/models', methods=['GET'])
def get_models():
    """Return available models list with default selected"""
    # Combine all available models
    all_models = []

    if AVAILABLE_MODELS:
        all_models.extend(AVAILABLE_MODELS.get('anthropic', []))
        all_models.extend(AVAILABLE_MODELS.get('openai', []))
        all_models.extend(AVAILABLE_MODELS.get('google', []))

    # If no models configured, use defaults
    if not all_models:
        all_models = [
            "claude-3-5-sonnet-20241022",
            "gpt-4-turbo",
            "gemini-1.5-pro"
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

    # Determine model type
    model_type = get_model_type(model)

    print(f"[DEBUG] Using model: {model} (type: {model_type})")

    def generate():
        # Route to the appropriate provider
        if model_type == 'anthropic':
            yield from stream_anthropic(model, system_prompt, text)
        elif model_type == 'google':
            yield from stream_gemini(model, system_prompt, text)
        else:
            yield from stream_openai(model, system_prompt, text)

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    )


if __name__ == '__main__':
    app.run(debug=True, port=5001, threaded=True)
