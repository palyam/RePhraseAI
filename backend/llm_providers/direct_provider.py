"""
Direct LLM Provider - Direct API access to OpenAI, Anthropic, and Google
"""

import json
import os
from .base import BaseLLMProvider

# Conditional imports - only import if libraries are available
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("[WARN] OpenAI SDK not installed. OpenAI models will not be available.")

try:
    from anthropic import Anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False
    print("[WARN] Anthropic SDK not installed. Anthropic models will not be available.")

try:
    import google.generativeai as genai
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False
    print("[WARN] Google Generative AI SDK not installed. Gemini models will not be available.")


class DirectProvider(BaseLLMProvider):
    """
    Direct API provider for OpenAI, Anthropic, and Google models.
    Requires respective API keys in environment variables.
    """

    def __init__(self):
        """Initialize API clients based on available API keys"""
        self.openai_client = None
        self.anthropic_client = None
        self.gemini_configured = False

        # Load API keys
        openai_api_key = os.getenv('OPENAI_API_KEY', '')
        anthropic_api_key = os.getenv('ANTHROPIC_API_KEY', '')
        google_api_key = os.getenv('GOOGLE_API_KEY', '')

        # Initialize clients
        if OPENAI_AVAILABLE and openai_api_key:
            self.openai_client = OpenAI(api_key=openai_api_key)
            print("[INFO] OpenAI client initialized")

        if ANTHROPIC_AVAILABLE and anthropic_api_key:
            self.anthropic_client = Anthropic(api_key=anthropic_api_key)
            print("[INFO] Anthropic client initialized")

        if GOOGLE_AVAILABLE and google_api_key:
            genai.configure(api_key=google_api_key)
            self.gemini_configured = True
            print("[INFO] Google Gemini configured")

        # Validate configuration
        self.validate_configuration()

    def validate_configuration(self):
        """Validate that at least one API client is configured"""
        if not any([self.openai_client, self.anthropic_client, self.gemini_configured]):
            raise ValueError(
                "At least one API key must be set (OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_API_KEY)"
            )

    def get_available_models(self):
        """Return available models based on configured clients"""
        # Load from config.json
        import json
        try:
            with open('config.json', 'r') as f:
                config = json.load(f)
                return config.get('available_models', {})
        except:
            return {}

    def get_model_type(self, model_name):
        """Determine if model is Anthropic, OpenAI, or Google based"""
        available_models = self.get_available_models()

        # Check in available models
        if model_name in available_models.get('anthropic', []):
            return 'anthropic'
        elif model_name in available_models.get('openai', []):
            return 'openai'
        elif model_name in available_models.get('google', []):
            return 'google'

        # Fallback to name-based detection
        if model_name.startswith('claude'):
            return 'anthropic'
        elif model_name.startswith('gemini'):
            return 'google'
        else:
            return 'openai'

    def stream_response(self, model, system_prompt, user_text):
        """Stream response from the appropriate API"""
        model_type = self.get_model_type(model)
        print(f"[DEBUG] Using model: {model} (type: {model_type})")

        if model_type == 'anthropic':
            yield from self._stream_anthropic(model, system_prompt, user_text)
        elif model_type == 'google':
            yield from self._stream_gemini(model, system_prompt, user_text)
        else:
            yield from self._stream_openai(model, system_prompt, user_text)

    def _stream_openai(self, model, system_prompt, text):
        """Stream response from OpenAI API"""
        try:
            if not self.openai_client:
                yield f"data: {json.dumps({'error': 'OpenAI API key not configured', 'error_code': 'CONFIG_ERROR'})}\n\n"
                return

            stream = self.openai_client.chat.completions.create(
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

    def _stream_anthropic(self, model, system_prompt, text):
        """Stream response from Anthropic API"""
        try:
            if not self.anthropic_client:
                yield f"data: {json.dumps({'error': 'Anthropic API key not configured', 'error_code': 'CONFIG_ERROR'})}\n\n"
                return

            with self.anthropic_client.messages.stream(
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

    def _stream_gemini(self, model, system_prompt, text):
        """Stream response from Google Gemini API"""
        try:
            if not self.gemini_configured:
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
