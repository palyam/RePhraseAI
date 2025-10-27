"""
LLM Provider Factory Module
Supports both direct API access and gateway-based access
"""

from .base import BaseLLMProvider
from .direct_provider import DirectProvider
from .gateway_provider import GatewayProvider
import os


def get_provider():
    """
    Factory function to get the appropriate LLM provider based on environment configuration.

    Returns:
        BaseLLMProvider: Either DirectProvider or GatewayProvider based on LLM_MODE
    """
    llm_mode = os.getenv('LLM_MODE', 'direct').lower()

    if llm_mode == 'gateway':
        print("[INFO] Using Gateway Provider mode")
        return GatewayProvider()
    else:
        print("[INFO] Using Direct Provider mode")
        return DirectProvider()


__all__ = ['BaseLLMProvider', 'DirectProvider', 'GatewayProvider', 'get_provider']
