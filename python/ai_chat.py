import json
from typing import Dict, Any, List
from ai_clients import get_ai_client

import os

def chat_with_context(
    user_message: str, 
    history: List[Dict[str, str]], 
    context_mode: str,
    chapter_path: str,
    all_json_paths: List[str],
    persona_prefix: str,
    provider: str, 
    api_key: str,
    model_name: str = "gemini-3.6-flash"
) -> str:
    """
    Sends a chat message to the AI provider, using the provided RAG files 
    as the system context for the conversation.
    """
    
    client = get_ai_client(provider, api_key, model_name)
    
    # 1. Build the context text from the requested mode
    context_text = ""
    
    if context_mode == "chapter" and chapter_path and os.path.exists(chapter_path):
        try:
            with open(chapter_path, 'r', encoding='utf-8', errors='replace') as f:
                context_text = f.read()
        except Exception as e:
            print(f"[ai_chat] Error reading chapter file: {e}")
            context_text = "[Error: Could not read chapter file]"
            
    elif context_mode == "book" and all_json_paths:
        combined_summaries = []
        for jpath in all_json_paths:
            if not jpath or not os.path.exists(jpath):
                continue
            try:
                with open(jpath, 'r', encoding='utf-8', errors='replace') as f:
                    data = json.load(f)
                    summary = data.get('summary', '')
                    core_lesson = data.get('core_lesson', '')
                    if summary or core_lesson:
                        combined_summaries.append(f"### Chapter\n**Summary:** {summary}\n**Core Lesson:** {core_lesson}\n")
            except Exception as e:
                print(f"[ai_chat] Error reading JSON {jpath}: {e}")
                
        context_text = "\n".join(combined_summaries)
        if not context_text:
            context_text = "[Warning: No chapter summaries were successfully loaded.]"
            
    # 2. Build the full system prompt
    system_prompt = (
        f"{persona_prefix}"
        "You are BookSage Copilot, an intelligent reading assistant. "
        "Your goal is to help the user understand the book they are reading. "
        "Use the following book context to answer the user's questions accurately. "
        "If the user asks something completely unrelated to the book or general knowledge, "
        "you may answer it, but always prioritize insights from the provided text.\n\n"
        f"--- BOOK CONTEXT ---\n{context_text}\n--------------------"
    )
    
    return client.chat(user_message, history, system_prompt)
