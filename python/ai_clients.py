import os
import json
import google.generativeai as genai
from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod

class BaseAIClient(ABC):
    @abstractmethod
    def generate_json(self, prompt: str, system_prompt: str) -> str:
        """Generate structured JSON response based on prompt and system prompt."""
        pass

    @abstractmethod
    def chat(self, user_message: str, history: List[Dict[str, str]], system_prompt: str) -> str:
        """Handle conversational chat with history and system context.
        History format: [{"role": "user"|"assistant", "content": "message"}]
        """
        pass

class GeminiClient(BaseAIClient):
    def __init__(self, api_key: str, model_name: str = 'gemini-flash-latest'):
        genai.configure(api_key=api_key)
        # Configure model to strictly return JSON if possible, but we'll parse it manually if needed.
        self.generation_config = {
            "temperature": 0.2,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
            "response_mime_type": "application/json",
        }
        self.model = genai.GenerativeModel(
            model_name=model_name,
            generation_config=self.generation_config,
        )
        
        self.chat_model = genai.GenerativeModel(
            model_name=model_name,
            generation_config={
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 8192,
            },
        )

    def generate_json(self, prompt: str, system_prompt: str) -> str:
        # Gemini system instructions can be set via system_instruction in GenerativeModel, 
        # but for simplicity we can prepend it to the prompt if the version doesn't support it directly.
        model = genai.GenerativeModel(
            model_name="gemini-flash-latest", 
            generation_config=self.generation_config,
            system_instruction=system_prompt
        )
        
        response = model.generate_content(prompt)
        return response.text

    def chat(self, user_message: str, history: List[Dict[str, str]], system_prompt: str) -> str:
        model = genai.GenerativeModel(
            model_name="gemini-flash-latest",
            system_instruction=system_prompt
        )
        
        # Convert history format to Gemini format
        formatted_history = []
        for msg in history:
            role = 'user' if msg['role'] == 'user' else 'model'
            formatted_history.append({"role": role, "parts": [msg['content']]})
            
        chat_session = model.start_chat(history=formatted_history)
        response = chat_session.send_message(user_message)
        
        return response.text

# Client Factory
def get_ai_client(provider: str, api_key: str) -> BaseAIClient:
    if provider.lower() == 'gemini':
        return GeminiClient(api_key=api_key)
    else:
        raise ValueError(f"Unsupported AI provider: {provider}")
