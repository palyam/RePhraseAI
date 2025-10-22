from flask import Flask, request, Response, jsonify, stream_with_context
from flask_cors import CORS
from dotenv import load_dotenv
import json
import os
import sys

# Load environment variables first
load_dotenv()

# Import provider factory
from llm_providers import get_provider

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

# Initialize LLM provider based on environment configuration
try:
    llm_provider = get_provider()
except Exception as e:
    print(f"[ERROR] Failed to initialize LLM provider: {e}")
    print("[ERROR] Please check your environment configuration (.env file)")
    sys.exit(1)


@app.route('/api/models', methods=['GET'])
def get_models():
    """Return available models list with default selected"""
    available_models = llm_provider.get_available_models()

    # Combine all available models
    all_models = []
    if available_models:
        all_models.extend(available_models.get('anthropic', []))
        all_models.extend(available_models.get('openai', []))
        all_models.extend(available_models.get('google', []))

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
        "model_categories": available_models
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

    def generate():
        # Delegate to the provider
        yield from llm_provider.stream_response(model, system_prompt, text)

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
