import json
from typing import Dict, Any, List, Optional
from ai_clients import get_ai_client
import os

def format_chapter_json(data: Dict[str, Any], fallback_num: int = 1) -> str:
    """Formats full structured chapter JSON into concise, readable markdown context."""
    raw_num = data.get('chapter_number')
    num = raw_num if (isinstance(raw_num, int) and raw_num > 0) else fallback_num
    title = data.get('chapter_title') or f"Chapter {num}"
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
    include_raw_text: bool = False,
    current_page: Optional[int] = None,
    current_chapter_num: Optional[int] = None,
    current_chapter_title: Optional[str] = None,
    current_chapter_pages: Optional[str] = None,
    book_title: Optional[str] = None
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
                raw_chapter_content = f.read()
            
            # Format clean chapter header with number, title and page range
            ch_num_disp = current_chapter_num or 1
            ch_title_disp = current_chapter_title or f"Chapter {ch_num_disp}"
            header_prefix = f"### Chapter {ch_num_disp}: {ch_title_disp}"
            if current_chapter_pages:
                header_prefix += f" (Pages {current_chapter_pages})"
            
            context_text = f"{header_prefix}\n\n{raw_chapter_content}"
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
            
    # 2. Build reading position header if available
    reading_context_parts = []
    if book_title:
        reading_context_parts.append(f"- Book Title: {book_title}")
    if current_chapter_num is not None:
        ch_desc = f"Chapter {current_chapter_num}"
        if current_chapter_title:
            ch_desc += f": {current_chapter_title}"
        if current_chapter_pages:
            ch_desc += f" (Pages {current_chapter_pages})"
        reading_context_parts.append(f"- Currently Reading Chapter: {ch_desc}")
    if current_page:
        reading_context_parts.append(f"- Currently Viewing Page: Page {current_page}")

    reading_context_header = ""
    if reading_context_parts:
        reading_context_header = (
            "\n--- ACTIVE USER READING POSITION ---\n"
            + "\n".join(reading_context_parts) + "\n"
            + "------------------------------------\n"
        )

    # 3. Build the full system prompt
    citation_instructions = (
        "\n\nCITATION INSTRUCTIONS (CRITICAL & MANDATORY):\n"
        "1. Whenever referencing a chapter, law, teaching, or concept from the book, "
        "ALWAYS format it as a markdown citation link:\n"
        "   [Ch. N: Chapter Title](cite:N) or [Ch. N](cite:N)\n"
        "   Examples:\n"
        "   - [Ch. 7: Get Others to Do the Work for You](cite:7)\n"
        "   - [Ch. 1: Never Outshine the Master](cite:1)\n"
        "   - [Ch. 4](cite:4)\n"
        "   Where N is the integer chapter number.\n"
        "2. NEVER output plain text brackets like [Ch. 7] or [Ch. None] without the (cite:N) target.\n"
        "3. If the user asks which chapter they are reading or what page they are on, "
        "answer accurately using the ACTIVE USER READING POSITION provided above!\n"
    )
    
    system_prompt = (
        f"{persona_prefix}"
        "You are BookSage Copilot, an intelligent reading assistant. "
        "Your goal is to help the user understand the book they are reading. "
        "Use the following book context to answer the user's questions accurately. "
        "If the user asks something completely unrelated to the book or general knowledge, "
        "you may answer it, but always prioritize insights from the provided text."
        f"{reading_context_header}"
        f"{citation_instructions}\n"
        f"--- BOOK CONTEXT ---\n{context_text}\n--------------------"
    )
    
    return client.chat(user_message, history, system_prompt)

