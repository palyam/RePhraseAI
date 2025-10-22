"""
Abstract Base Provider for LLM Interactions
"""

from abc import ABC, abstractmethod


class BaseLLMProvider(ABC):
    """
    Abstract base class for LLM providers.
    All providers must implement the stream_response method.
    """

    @abstractmethod
    def stream_response(self, model, system_prompt, user_text):
        """
        Stream a response from the LLM.

        Args:
            model (str): Model identifier
            system_prompt (str): System instruction/prompt
            user_text (str): User input text

        Yields:
            str: Server-Sent Events formatted data strings
        """
        pass

    @abstractmethod
    def get_available_models(self):
        """
        Get list of available models for this provider.

        Returns:
            dict: Dictionary with model categories
        """
        pass

    @abstractmethod
    def validate_configuration(self):
        """
        Validate that the provider is properly configured.

        Raises:
            ValueError: If configuration is invalid
        """
        pass
