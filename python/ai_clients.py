import os
import json
from google import genai
from google.genai import types
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
    def __init__(self, api_key: str, model_name: str = 'gemini-3.6-flash'):
        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name

    def generate_json(self, prompt: str, system_prompt: str) -> str:
        config = types.GenerateContentConfig(
            temperature=0.2,
            top_p=0.95,
            top_k=40,
            max_output_tokens=8192,
            response_mime_type="application/json",
            system_instruction=system_prompt
        )
        
        import time
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=config
                )
                return response.text
            except Exception as e:
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                else:
                    raise e

    def chat(self, user_message: str, history: List[Dict[str, str]], system_prompt: str) -> str:
        config = types.GenerateContentConfig(
            temperature=0.7,
            top_p=0.95,
            top_k=40,
            max_output_tokens=8192,
            system_instruction=system_prompt
        )
        
        # Convert history format to Gemini format
        contents = []
        for msg in history:
            role = 'user' if msg['role'] == 'user' else 'model'
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg['content'])]))
            
        # Add the new message
        contents.append(types.Content(role='user', parts=[types.Part.from_text(text=user_message)]))
            
        import time
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config=config
                )
                return response.text
            except Exception as e:
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                else:
                    return f"Error: Connection to AI provider failed after {max_retries} attempts. Details: {str(e)}"

# Client Factory
def get_ai_client(provider: str, api_key: str, model_name: str = "gemini-3.6-flash") -> BaseAIClient:
    if provider.lower() == 'gemini':
        return GeminiClient(api_key=api_key, model_name=model_name)
    else:
        raise ValueError(f"Unsupported AI provider: {provider}")
