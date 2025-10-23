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
from config_manager import ConfigManager

app = Flask(__name__)
CORS(app)

# Load configuration based on mode
llm_mode = os.getenv('LLM_MODE', 'direct').lower()
config_file = 'config.gateway.json' if llm_mode == 'gateway' and os.path.exists('config.gateway.json') else 'config.json'

try:
    with open(config_file, 'r') as f:
        config = json.load(f)
    print(f"[INFO] Loaded configuration from: {config_file}")
except FileNotFoundError:
    print(f"[ERROR] {config_file} not found. Please create it with your API configuration.")
    sys.exit(1)
except json.JSONDecodeError as e:
    print(f"[ERROR] Invalid JSON in {config_file}: {e}")
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

# Initialize config manager
config_manager = ConfigManager()


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
    """Streaming endpoint for text rephrasing - supports single or multiple styles"""
    data = request.json
    text = data.get('text', '')
    model = data.get('model', DEFAULT_MODEL)
    additional_instructions = data.get('additional_instructions', '').strip()

    # Support both single style and multiple styles
    style = data.get('style')
    styles = data.get('styles', [])

    # If single style provided, convert to list
    if style and not styles:
        styles = [style]
    elif not styles:
        styles = ['default']

    def generate():
        # Process each selected style
        for idx, current_style in enumerate(styles):
            # Get system prompt for the selected style
            style_data = prompts.get(current_style, prompts['default'])
            system_prompt = style_data['prompt']

            # Append additional instructions if provided
            if additional_instructions:
                system_prompt += f"\n\nAdditional Instructions: {additional_instructions}"

            # Send style marker if multiple styles
            if len(styles) > 1:
                style_label = style_data.get('label', current_style)
                yield f"data: {json.dumps({'style_start': current_style, 'style_label': style_label, 'style_index': idx})}\n\n"

            # Stream the response for this style
            yield from llm_provider.stream_response(model, system_prompt, text)

            # Send style end marker if multiple styles
            if len(styles) > 1:
                yield f"data: {json.dumps({'style_end': current_style, 'style_index': idx})}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    )


@app.route('/api/config', methods=['GET'])
def get_config():
    """Get current configuration with masked keys"""
    try:
        config_data = config_manager.get_config()
        return jsonify(config_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/config', methods=['POST'])
def save_config():
    """Save configuration changes"""
    try:
        config_data = request.json
        result = config_manager.save_config(config_data)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/config/test-key', methods=['POST'])
def test_api_key():
    """Test if an API key is valid"""
    try:
        data = request.json
        provider = data.get('provider')
        api_key = data.get('api_key')

        if not provider or not api_key:
            return jsonify({
                'success': False,
                'message': 'Provider and API key are required'
            }), 400

        result = config_manager.test_api_key(provider, api_key)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000, threaded=True)
