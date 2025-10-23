"""
Configuration Manager for RePhraseAI
Handles reading, writing, and managing configuration files safely.
"""

import os
import json
import shutil
from datetime import datetime
from typing import Dict, Any, Optional


class ConfigManager:
    def __init__(self, base_dir: str = None):
        self.base_dir = base_dir or os.path.dirname(os.path.abspath(__file__))
        self.env_file = os.path.join(self.base_dir, '.env')
        self.config_file = os.path.join(self.base_dir, 'config.json')
        self.gateway_config_file = os.path.join(self.base_dir, 'config.gateway.json')
        self.prompts_file = os.path.join(self.base_dir, 'prompts.json')

    def mask_key(self, key: str) -> str:
        """Mask API key for security, showing only last 4 characters"""
        if not key or len(key) < 8:
            return '****'
        return '*' * (len(key) - 4) + key[-4:]

    def is_masked(self, key: str) -> bool:
        """Check if a key is already masked"""
        return key.startswith('*') or key == '****'

    def get_config(self) -> Dict[str, Any]:
        """Get current configuration with masked keys"""
        config = {
            'llm': self._get_llm_config(),
            'models': self._get_models_config(),
            'styles': self._get_styles_config(),
            'ui': {
                'theme': 'dark',  # Default, can be extended
                'port': 5847
            }
        }
        return config

    def _get_llm_config(self) -> Dict[str, Any]:
        """Get LLM configuration from .env file"""
        llm_config = {
            'mode': 'gateway',  # default
            'gateway_api_key': '',
            'iliad_api_key': '',
            'openai_api_key': '',
            'anthropic_api_key': '',
            'google_api_key': ''
        }

        if os.path.exists(self.env_file):
            with open(self.env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        key = key.strip().lower()
                        value = value.strip()

                        if key == 'llm_mode':
                            llm_config['mode'] = value
                        elif key == 'gateway_api_key':
                            llm_config['gateway_api_key'] = self.mask_key(value)
                        elif key == 'iliad_api_key':
                            llm_config['iliad_api_key'] = self.mask_key(value)
                        elif key == 'openai_api_key':
                            llm_config['openai_api_key'] = self.mask_key(value)
                        elif key == 'anthropic_api_key':
                            llm_config['anthropic_api_key'] = self.mask_key(value)
                        elif key == 'google_api_key':
                            llm_config['google_api_key'] = self.mask_key(value)

        return llm_config

    def _get_models_config(self) -> Dict[str, Any]:
        """Get models configuration"""
        llm_mode = os.getenv('LLM_MODE', 'gateway')
        config_file = self.gateway_config_file if llm_mode == 'gateway' else self.config_file

        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                config_data = json.load(f)
                return {
                    'default': config_data.get('default_model', 'gpt-4.1'),
                    'available': config_data.get('available_models', {}),
                    'gateway_urls': config_data.get('llm_gateway_url') if llm_mode == 'gateway' else None
                }

        return {
            'default': 'gpt-4.1',
            'available': {}
        }

    def _get_styles_config(self) -> list:
        """Get custom styles from prompts.json"""
        if os.path.exists(self.prompts_file):
            with open(self.prompts_file, 'r') as f:
                prompts_data = json.load(f)
                styles = prompts_data.get('styles', [])

                # Handle both array and dictionary formats
                if isinstance(styles, list):
                    # Already in the correct format
                    return styles
                elif isinstance(styles, dict):
                    # Convert dictionary format to list
                    return [
                        {
                            'id': style_id,
                            'label': style_data.get('label', style_id.title()),
                            'icon': style_data.get('icon', '📝'),
                            'description': style_data.get('description', ''),
                            'prompt': style_data.get('prompt', '')
                        }
                        for style_id, style_data in styles.items()
                    ]
        return []

    def save_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Save configuration changes"""
        try:
            # Backup current configuration
            self._create_backup()

            # Save LLM config to .env
            if 'llm' in config:
                self._save_llm_config(config['llm'])

            # Save models config
            if 'models' in config:
                self._save_models_config(config['models'])

            # Save styles config
            if 'styles' in config:
                self._save_styles_config(config['styles'])

            return {'success': True, 'message': 'Configuration saved successfully'}

        except Exception as e:
            return {'success': False, 'message': f'Failed to save configuration: {str(e)}'}

    def _create_backup(self):
        """Create backup of current configuration files"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_dir = os.path.join(self.base_dir, 'backups')
        os.makedirs(backup_dir, exist_ok=True)

        if os.path.exists(self.env_file):
            shutil.copy2(self.env_file, os.path.join(backup_dir, f'.env.backup_{timestamp}'))

        if os.path.exists(self.config_file):
            shutil.copy2(self.config_file, os.path.join(backup_dir, f'config.json.backup_{timestamp}'))

        if os.path.exists(self.gateway_config_file):
            shutil.copy2(self.gateway_config_file, os.path.join(backup_dir, f'config.gateway.json.backup_{timestamp}'))

    def _save_llm_config(self, llm_config: Dict[str, Any]):
        """Save LLM configuration to .env file"""
        env_lines = []

        # Read existing .env file
        if os.path.exists(self.env_file):
            with open(self.env_file, 'r') as f:
                env_lines = f.readlines()

        # Update or add configuration values
        updated_keys = set()

        for i, line in enumerate(env_lines):
            line_stripped = line.strip()
            if line_stripped and not line_stripped.startswith('#') and '=' in line_stripped:
                key = line_stripped.split('=', 1)[0].strip()

                if key == 'LLM_MODE' and 'mode' in llm_config:
                    env_lines[i] = f"LLM_MODE={llm_config['mode']}\n"
                    updated_keys.add('LLM_MODE')
                elif key == 'GATEWAY_API_KEY' and 'gateway_api_key' in llm_config:
                    if not self.is_masked(llm_config['gateway_api_key']):
                        env_lines[i] = f"GATEWAY_API_KEY={llm_config['gateway_api_key']}\n"
                    updated_keys.add('GATEWAY_API_KEY')
                elif key == 'ILIAD_API_KEY' and 'iliad_api_key' in llm_config:
                    if not self.is_masked(llm_config['iliad_api_key']):
                        env_lines[i] = f"ILIAD_API_KEY={llm_config['iliad_api_key']}\n"
                    updated_keys.add('ILIAD_API_KEY')
                elif key == 'OPENAI_API_KEY' and 'openai_api_key' in llm_config:
                    if not self.is_masked(llm_config['openai_api_key']):
                        env_lines[i] = f"OPENAI_API_KEY={llm_config['openai_api_key']}\n"
                    updated_keys.add('OPENAI_API_KEY')
                elif key == 'ANTHROPIC_API_KEY' and 'anthropic_api_key' in llm_config:
                    if not self.is_masked(llm_config['anthropic_api_key']):
                        env_lines[i] = f"ANTHROPIC_API_KEY={llm_config['anthropic_api_key']}\n"
                    updated_keys.add('ANTHROPIC_API_KEY')
                elif key == 'GOOGLE_API_KEY' and 'google_api_key' in llm_config:
                    if not self.is_masked(llm_config['google_api_key']):
                        env_lines[i] = f"GOOGLE_API_KEY={llm_config['google_api_key']}\n"
                    updated_keys.add('GOOGLE_API_KEY')

        # Add new keys that weren't in the file
        if 'mode' in llm_config and 'LLM_MODE' not in updated_keys:
            env_lines.append(f"LLM_MODE={llm_config['mode']}\n")
        if 'gateway_api_key' in llm_config and not self.is_masked(llm_config['gateway_api_key']) and 'GATEWAY_API_KEY' not in updated_keys:
            env_lines.append(f"GATEWAY_API_KEY={llm_config['gateway_api_key']}\n")

        # Write back to .env file
        with open(self.env_file, 'w') as f:
            f.writelines(env_lines)

    def _save_models_config(self, models_config: Dict[str, Any]):
        """Save models configuration"""
        llm_mode = os.getenv('LLM_MODE', 'gateway')
        config_file = self.gateway_config_file if llm_mode == 'gateway' else self.config_file

        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                config_data = json.load(f)
        else:
            config_data = {}

        if 'default' in models_config:
            config_data['default_model'] = models_config['default']

        if 'available' in models_config:
            config_data['available_models'] = models_config['available']

        with open(config_file, 'w') as f:
            json.dump(config_data, f, indent=2)

    def _save_styles_config(self, styles: list):
        """Save custom styles to prompts.json"""
        if os.path.exists(self.prompts_file):
            with open(self.prompts_file, 'r') as f:
                prompts_data = json.load(f)
        else:
            prompts_data = {}

        # Save styles as array format (matching current prompts.json structure)
        prompts_data['styles'] = styles

        with open(self.prompts_file, 'w') as f:
            json.dump(prompts_data, f, indent=2)

    def test_api_key(self, provider: str, api_key: str) -> Dict[str, Any]:
        """Test if an API key is valid"""
        # This is a placeholder - actual implementation would test the key
        # against the provider's API
        try:
            if not api_key or len(api_key) < 10:
                return {'success': False, 'message': 'Invalid API key format'}

            # TODO: Implement actual API key testing
            return {'success': True, 'message': f'{provider} API key format is valid'}

        except Exception as e:
            return {'success': False, 'message': str(e)}
