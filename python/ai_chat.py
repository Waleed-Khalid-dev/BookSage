import json
from typing import Dict, Any, List
from ai_clients import get_ai_client

def chat_with_context(
    user_message: str, 
    history: List[Dict[str, str]], 
    context_text: str, 
    provider: str, 
    api_key: str,
    model_name: str = "gemini-3.6-flash"
) -> str:
    """
    Sends a chat message to the AI provider, using the provided context_text 
    as the system context for the conversation.
    """
    
    client = get_ai_client(provider, api_key, model_name)
    
    system_prompt = (
        "You are BookSage Copilot, an intelligent reading assistant. "
        "Your goal is to help the user understand the book they are reading. "
        "Use the following book context to answer the user's questions accurately. "
        "If the user asks something completely unrelated to the book or general knowledge, "
        "you may answer it, but always prioritize insights from the provided text.\n\n"
        f"--- BOOK CONTEXT ---\n{context_text}\n--------------------"
    )
    
    return client.chat(user_message, history, system_prompt)
