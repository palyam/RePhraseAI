"""
Gateway LLM Provider - Access LLMs through API Gateway (e.g., Iliad)
This is for restricted environments where direct API access is not allowed.
"""

import json
import os
import requests
from .base import BaseLLMProvider


class GatewayProvider(BaseLLMProvider):
    """
    Gateway-based provider for environments with restricted API access.
    Uses an API gateway (like Iliad) to route requests to LLM providers.
    """

    def __init__(self):
        """Initialize gateway configuration"""
        # Load gateway-specific configuration
        self.gateway_config = self._load_gateway_config()

        # Get API key
        self.api_key = os.getenv('ILIAD_API_KEY')
        if not self.api_key:
            raise ValueError("ILIAD_API_KEY environment variable not set")

        # Gateway URLs
        self.anthropic_gateway_url = self.gateway_config.get(
            'llm_gateway_url',
            os.getenv('ILIAD_ANTHROPIC_GATEWAY_URL', '')
        )
        self.openai_gateway_url = self.gateway_config.get(
            'openai_gateway_url',
            os.getenv('ILIAD_OPENAI_GATEWAY_URL', '')
        )

        print(f"[INFO] Gateway Provider initialized")
        print(f"[INFO] Anthropic Gateway: {self.anthropic_gateway_url}")
        print(f"[INFO] OpenAI Gateway: {self.openai_gateway_url}")

        self.validate_configuration()

    def _load_gateway_config(self):
        """Load gateway-specific configuration"""
        # Try to load config.gateway.json first (local, gitignored)
        if os.path.exists('config.gateway.json'):
            try:
                with open('config.gateway.json', 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"[WARN] Failed to load config.gateway.json: {e}")

        # Fall back to config.json
        try:
            with open('config.json', 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"[WARN] Failed to load config.json: {e}")
            return {}

    def validate_configuration(self):
        """Validate gateway configuration"""
        if not self.api_key:
            raise ValueError("Gateway API key not configured")

        if not self.anthropic_gateway_url and not self.openai_gateway_url:
            raise ValueError("At least one gateway URL must be configured")

    def get_available_models(self):
        """Return available models from gateway configuration"""
        return self.gateway_config.get('available_models', {})

    def get_model_type(self, model_name):
        """Determine if model is Anthropic or OpenAI based"""
        available_models = self.get_available_models()

        if model_name in available_models.get('anthropic', []):
            return 'anthropic'
        elif model_name in available_models.get('openai', []):
            return 'openai'

        # Default to anthropic if model starts with 'claude'
        return 'anthropic' if model_name.startswith('claude') else 'openai'

    def get_gateway_url(self, model_name):
        """Get the appropriate gateway URL based on model type"""
        model_type = self.get_model_type(model_name)

        if model_type == 'openai':
            # OpenAI models use deployment-specific URLs
            return f"{self.openai_gateway_url}/deployments/{model_name}/chat/completions?api-version=2024-02-01"
        else:
            # Anthropic models use messages endpoint
            return f"{self.anthropic_gateway_url}/messages"

    def stream_response(self, model, system_prompt, user_text):
        """Stream response from LLM Gateway"""
        gateway_url = self.get_gateway_url(model)
        model_type = self.get_model_type(model)

        print(f"[DEBUG] Using model: {model} (type: {model_type})")
        print(f"[DEBUG] Gateway URL: {gateway_url}")

        # Prepare headers
        headers = {
            'Content-Type': 'application/json',
            'X-API-Key': self.api_key
        }

        # Prepare request payload based on model type
        if model_type == 'anthropic':
            # Anthropic format
            headers['anthropic-version'] = '2023-06-01'
            payload = {
                "model": model,
                "messages": [
                    {"role": "user", "content": f"{system_prompt}\n\n{user_text}"}
                ],
                "stream": True,
                "max_tokens": 4096,
                "temperature": 0.7
            }
        else:
            # OpenAI format
            # Newer models (O3, O4, GPT-5) use max_completion_tokens
            uses_new_api = any(x in model.lower() for x in ['o3', 'o4', 'gpt-5'])

            payload = {
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_text}
                ],
                "stream": True
            }

            # GPT-5 and O-series models only support temperature=1 (default)
            if not uses_new_api:
                payload["temperature"] = 0.7

            if uses_new_api:
                # O-series and GPT-5 need more tokens for reasoning + completion
                payload["max_completion_tokens"] = 16384
            else:
                payload["max_tokens"] = 4096

        yield from self._stream_from_gateway(gateway_url, headers, payload, model_type)

    def _stream_from_gateway(self, gateway_url, headers, payload, model_type):
        """Stream responses from the gateway"""
        try:
            # Stream from LLM Gateway
            response = requests.post(
                gateway_url,
                headers=headers,
                json=payload,
                stream=True,
                timeout=60,
                verify=False  # For internal corporate certificates
            )

            # Handle HTTP error responses
            if response.status_code == 401:
                error_data = {'error': 'Authentication failed. Please check your API key.', 'error_code': 'AUTH_ERROR'}
                yield f"data: {json.dumps(error_data)}\n\n"
                return
            elif response.status_code == 429:
                error_data = {'error': 'Rate limit exceeded. Please wait and try again.', 'error_code': 'RATE_LIMIT'}
                yield f"data: {json.dumps(error_data)}\n\n"
                return
            elif response.status_code == 503:
                error_data = {'error': 'Service temporarily unavailable.', 'error_code': 'SERVICE_UNAVAILABLE'}
                yield f"data: {json.dumps(error_data)}\n\n"
                return
            elif response.status_code >= 400:
                error_data = {'error': f'API error: {response.status_code}', 'error_code': 'API_ERROR'}
                yield f"data: {json.dumps(error_data)}\n\n"
                return

            # Parse streaming response
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
            error_data = {'error': 'Request timed out.', 'error_code': 'TIMEOUT'}
            print(f"[ERROR] Request timeout")
            yield f"data: {json.dumps(error_data)}\n\n"
        except requests.exceptions.ConnectionError:
            error_data = {'error': 'Cannot connect to gateway.', 'error_code': 'CONNECTION_ERROR'}
            print(f"[ERROR] Connection error")
            yield f"data: {json.dumps(error_data)}\n\n"
        except requests.exceptions.RequestException as e:
            error_data = {'error': f'Network error: {str(e)}', 'error_code': 'NETWORK_ERROR'}
            print(f"[ERROR] Request exception: {e}")
            yield f"data: {json.dumps(error_data)}\n\n"
        except Exception as e:
            error_data = {'error': f'Unexpected error: {str(e)}', 'error_code': 'UNKNOWN_ERROR'}
            print(f"[ERROR] Unexpected error: {e}")
            yield f"data: {json.dumps(error_data)}\n\n"
