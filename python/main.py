import json
import sys
import traceback

# Force UTF-8 encoding for stdout to prevent Tauri IPC crashes on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def handle_command(cmd_data):
    command = cmd_data.get("command")
    
    if command == "get_hardware_id":
        import uuid
        import platform
        # Combine MAC address and hostname for a unique hardware fingerprint
        mac = str(uuid.getnode())
        hostname = platform.node()
        hw_id = f"{mac}-{hostname}"
        return {"status": "success", "hardware_id": hw_id}

    elif command == "split_book":
        pdf_path = cmd_data.get("path")
        book_id = cmd_data.get("book_id", "")
        if not pdf_path:
            return {"status": "error", "message": "Missing 'path' argument."}
        from chapter_splitter import split_book_into_chapters
        return split_book_into_chapters(pdf_path, book_id)
    
    elif command == "extract_chapter":
        chapter_path = cmd_data.get("chapter_path")
        provider = cmd_data.get("provider", "gemini")
        api_key = cmd_data.get("api_key")
        model_name = cmd_data.get("model_name", "gemini-3.6-flash")
        
        if not chapter_path or not api_key:
            return {"status": "error", "message": "Missing 'chapter_path' or 'api_key'."}
            
        from ai_extractor import process_chapter
        output_path = process_chapter(chapter_path, provider, api_key, model_name=model_name)
        return {"status": "success", "output_path": output_path}
        
    elif command == "chat_message":
        message = cmd_data.get("message")
        history = cmd_data.get("history", [])
        context_mode = cmd_data.get("context_mode", "chapter")
        chapter_path = cmd_data.get("chapter_path")
        all_json_paths = cmd_data.get("all_json_paths", [])
        persona_prefix = cmd_data.get("persona_prefix", "")
        provider = cmd_data.get("provider", "gemini")
        api_key = cmd_data.get("api_key")
        model_name = cmd_data.get("model_name", "gemini-3.6-flash")
        
        if not message or not api_key:
            return {"status": "error", "message": "Missing 'message' or 'api_key'."}
            
        from ai_chat import chat_with_context
        response = chat_with_context(
            user_message=message,
            history=history,
            context_mode=context_mode,
            chapter_path=chapter_path,
            all_json_paths=all_json_paths,
            persona_prefix=persona_prefix,
            provider=provider,
            api_key=api_key,
            model_name=model_name
        )
        return {"status": "success", "response": response}
    
    elif command == "search_pdf":
        pdf_path = cmd_data.get("path")
        query = cmd_data.get("query", "").strip()
            
        if not pdf_path or not query:
            return {"status": "error", "message": "Missing 'path' or 'query' argument."}
            
        try:
            import fitz
            doc = fitz.open(pdf_path)
            matches = []
            total = 0
            for i, page in enumerate(doc):
                rects = page.search_for(query)
                if rects:
                    page_matches = []
                    for r in rects:
                        page_matches.append({
                            "top": r.y0,
                            "left": r.x0,
                            "width": r.x1 - r.x0,
                            "height": r.y1 - r.y0,
                            "matchIndex": total
                        })
                        total += 1
                    matches.append({
                        "page": i + 1,
                        "rects": page_matches
                    })
            doc.close()
                
            return {
                "status": "success",
                "total": total,
                "matches": matches
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
            
    elif command == "check_exists":
        file_path = cmd_data.get("path")
        if not file_path:
            return {"status": "error", "message": "Missing 'path' argument."}
        import os
        return {"status": "success", "exists": os.path.exists(file_path)}
        
    elif command == "read_file":
        file_path = cmd_data.get("path")
        if not file_path:
            return {"status": "error", "message": "Missing 'path' argument."}
        import os
        if not os.path.exists(file_path):
            return {"status": "error", "message": "File not found."}
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return {"status": "success", "content": content}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    elif command == "generate_tts":
        text = cmd_data.get("text")
        voice = cmd_data.get("voice", "en-US-AriaNeural")
        
        if not text:
            return {"status": "error", "message": "Missing 'text' argument."}
            
        from tts_engine import generate_audio_b64
        tts_result = generate_audio_b64(text, voice)
        if tts_result and tts_result.get("audio_b64"):
            return {"status": "success", "audio_b64": tts_result["audio_b64"], "word_timings": tts_result.get("word_timings", [])}
        else:
            return {"status": "error", "message": "Failed to generate TTS audio."}
            
            
    elif command == "export_chapters":
        chapters = cmd_data.get("chapters", [])
        output_dir = cmd_data.get("output_dir")
        
        if not chapters or not output_dir:
            return {"status": "error", "message": "Missing 'chapters' or 'output_dir'."}
            
        import os
        os.makedirs(output_dir, exist_ok=True)
        
        exported_count = 0
        for chap in chapters:
            if not chap.get("path"): continue
            
            # Replace .txt with .json to find the AI output
            json_path = chap["path"].replace('.txt', '.json')
            if not os.path.exists(json_path):
                continue
                
            try:
                with open(json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                if isinstance(data, list) and len(data) > 0:
                    data = data[0]
                    
                # Format as markdown
                md_content = f"# {data.get('chapter_title', chap.get('title', 'Unknown Title'))}\n\n"
                
                if data.get('summary'):
                    md_content += f"## Summary\n{data['summary']}\n\n"
                    
                md_content += "## Core Lesson\n"
                md_content += f"> {data.get('core_lesson', '')}\n\n"
                
                if data.get('teachings'):
                    md_content += "## Teachings\n"
                    for t in data['teachings']:
                        md_content += f"### {t.get('technique', '')}\n{t.get('explanation', '')}\n\n"
                        
                if data.get('implementation_steps'):
                    md_content += "## Implementation Steps\n"
                    for step in data['implementation_steps']:
                        md_content += f"- {step}\n"
                    md_content += "\n"
                    
                if data.get('supporting_quotes'):
                    md_content += "## Quotes\n"
                    for q in data['supporting_quotes']:
                        md_content += f"> \"{q}\"\n"
                    md_content += "\n"
                
                if data.get('difficulty_to_implement'):
                    md_content += f"**Difficulty to Implement:** {data['difficulty_to_implement']}\n\n"

                if data.get('obsidian_tags'):
                    md_content += f"**Tags:** {' '.join(data['obsidian_tags'])}\n\n"
                    
                # Save markdown file
                safe_title = "".join(c for c in chap.get('title', f"Chapter_{chap.get('num')}") if c.isalnum() or c in " -_").strip()
                md_filename = f"{chap.get('num', 0):02d} - {safe_title}.md"
                
                with open(os.path.join(output_dir, md_filename), 'w', encoding='utf-8') as f:
                    f.write(md_content)
                    
                exported_count += 1
            except Exception as e:
                print(f"Error exporting {json_path}: {e}")
                
        return {"status": "success", "exported_count": exported_count}

    elif command == "ping":
        return {"status": "success", "message": "pong"}
        
    else:
        return {"status": "error", "message": f"Unknown command: {command}"}

def main():
    if len(sys.argv) > 1:
        # CLI Argument mode (Tauri sidecar usually uses args or stdin)
        try:
            if sys.argv[1] == '--file' and len(sys.argv) > 2:
                file_path = sys.argv[2]
                with open(file_path, 'r', encoding='utf-8') as f:
                    cmd_data = json.load(f)
            elif sys.argv[1] == '--b64' and len(sys.argv) > 2:
                # Keep legacy --b64 for backwards compatibility if needed
                import base64
                b64_str = sys.argv[2]
                json_str = base64.b64decode(b64_str).decode('utf-8')
                cmd_data = json.loads(json_str)
            else:
                cmd_data = json.loads(sys.argv[1])
            
            result = handle_command(cmd_data)
            print(json.dumps(result))
        except Exception as e:
            err_result = {
                "status": "error",
                "message": str(e),
                "traceback": traceback.format_exc()
            }
            print(json.dumps(err_result))
    else:
        # Interactive stdin mode (for persistent sidecar processes)
        print(json.dumps({"status": "ready", "version": "1.0"}))
        for line in sys.stdin:
            if not line.strip():
                continue
            try:
                cmd_data = json.loads(line)
                result = handle_command(cmd_data)
                print(json.dumps(result))
                sys.stdout.flush()
            except Exception as e:
                err_str = str(e)
                if "401 UNAUTHENTICATED" in err_str or "API_KEY_INVALID" in err_str:
                    err_msg = "Invalid Gemini API Key! Please get a valid key from https://aistudio.google.com/app/apikey"
                elif "429 Too Many Requests" in err_str or "Quota exceeded" in err_str:
                    err_msg = "API Quota Exceeded. You have hit the rate limit for this Gemini API key."
                else:
                    err_msg = err_str
                print(json.dumps({"status": "error", "message": err_msg}))
                sys.stdout.flush()

if __name__ == "__main__":
    main()
