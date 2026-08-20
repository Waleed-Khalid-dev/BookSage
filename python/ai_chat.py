import json
from typing import Dict, Any, List, Optional
from ai_clients import get_ai_client
import os

def format_chapter_json(data: Dict[str, Any], fallback_num: int = 1) -> str:
    """Formats full structured chapter JSON into concise, readable markdown context."""
    num = data.get('chapter_number', fallback_num)
    title = data.get('chapter_title', f"Chapter {num}")
    parts = [f"### Chapter {num}: {title}"]
    
    if data.get('summary'):
        parts.append(f"**Summary:** {data['summary']}")
    if data.get('core_lesson'):
        parts.append(f"**Core Lesson:** {data['core_lesson']}")
    if data.get('teachings'):
        t_lines = []
        for t in data['teachings']:
            tech = t.get('technique', '')
            exp = t.get('explanation', '')
            if tech or exp:
                t_lines.append(f"- **{tech}:** {exp}" if tech else f"- {exp}")
        if t_lines:
            parts.append("**Key Teachings:**\n" + "\n".join(t_lines))
    if data.get('implementation_steps'):
        steps = [f"{i+1}. {s}" for i, s in enumerate(data['implementation_steps'])]
        parts.append("**Implementation Steps:**\n" + "\n".join(steps))
    if data.get('supporting_quotes'):
        quotes = [f'> "{q}"' for q in data['supporting_quotes']]
        parts.append("**Key Quotes:**\n" + "\n".join(quotes))
        
    return "\n".join(parts) + "\n"

def chat_with_context(
    user_message: str, 
    history: List[Dict[str, str]], 
    context_mode: str,
    chapter_path: Optional[str],
    all_json_paths: List[str],
    persona_prefix: str,
    provider: str, 
    api_key: str,
    model_name: str = "gemini-3.6-flash",
    raw_text_paths: Optional[List[str]] = None,
    include_raw_text: bool = False
) -> str:
    """
    Sends a chat message to the AI provider, using the provided RAG files 
    as the system context for the conversation.
    """
    client = get_ai_client(provider, api_key, model_name)
    context_text = ""
    
    if context_mode == "chapter" and chapter_path and os.path.exists(chapter_path):
        try:
            with open(chapter_path, 'r', encoding='utf-8', errors='replace') as f:
                context_text = f.read()
        except Exception as e:
            print(f"[ai_chat] Error reading chapter file: {e}")
            context_text = "[Error: Could not read chapter file]"
            
    elif context_mode in ["book", "custom"] and all_json_paths:
        combined_sections = []
        for idx, jpath in enumerate(all_json_paths):
            if not jpath or not os.path.exists(jpath):
                continue
            try:
                with open(jpath, 'r', encoding='utf-8', errors='replace') as f:
                    data = json.load(f)
                    if isinstance(data, list) and len(data) > 0:
                        data = data[0]
                    formatted = format_chapter_json(data, idx + 1)
                    if formatted:
                        combined_sections.append(formatted)
            except Exception as e:
                print(f"[ai_chat] Error reading JSON {jpath}: {e}")
                
        # If user enabled full raw text for custom chapters, append raw text sections
        if include_raw_text and raw_text_paths:
            for tpath in raw_text_paths:
                if tpath and os.path.exists(tpath):
                    try:
                        with open(tpath, 'r', encoding='utf-8', errors='replace') as f:
                            raw_content = f.read()
                            fname = os.path.basename(tpath)
                            combined_sections.append(f"\n--- FULL RAW CHAPTER TEXT ({fname}) ---\n{raw_content}\n--- END RAW TEXT ---\n")
                    except Exception as e:
                        print(f"[ai_chat] Error reading raw text {tpath}: {e}")
                        
        context_text = "\n".join(combined_sections)
        if not context_text:
            context_text = "[Warning: No chapter data was loaded for the selected context.]"
            
    # 2. Build the full system prompt
    citation_instructions = (
        "\n\nCITATION INSTRUCTIONS:\n"
        "- Whenever referencing specific concepts, laws, lessons, or quotes from the book, "
        "always include a citation link formatted as [Ch. N: Title](cite:N) or [Ch. N](cite:N) "
        "(e.g., [Ch. 4: Master the Art of Timing](cite:4) or [Ch. 4](cite:4)), where N is the chapter number.\n"
        "- Place citation links inline right after the relevant sentence.\n"
    )
    
    system_prompt = (
        f"{persona_prefix}"
        "You are BookSage Copilot, an intelligent reading assistant. "
        "Your goal is to help the user understand the book they are reading. "
        "Use the following book context to answer the user's questions accurately. "
        "If the user asks something completely unrelated to the book or general knowledge, "
        "you may answer it, but always prioritize insights from the provided text."
        f"{citation_instructions}\n"
        f"--- BOOK CONTEXT ---\n{context_text}\n--------------------"
    )
    
    return client.chat(user_message, history, system_prompt)

