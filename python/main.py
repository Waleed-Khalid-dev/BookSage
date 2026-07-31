import json
import sys
import traceback
from chapter_splitter import split_book_into_chapters
from ai_extractor import process_chapter
from ai_chat import chat_with_context

def handle_command(cmd_data):
    command = cmd_data.get("command")
    
    if command == "split_book":
        pdf_path = cmd_data.get("path")
        if not pdf_path:
            return {"status": "error", "message": "Missing 'path' argument."}
        return split_book_into_chapters(pdf_path)
    
    elif command == "extract_chapter":
        chapter_path = cmd_data.get("chapter_path")
        provider = cmd_data.get("provider", "gemini")
        api_key = cmd_data.get("api_key")
        model_name = cmd_data.get("model_name", "gemini-3.6-flash")
        
        if not chapter_path or not api_key:
            return {"status": "error", "message": "Missing 'chapter_path' or 'api_key'."}
            
        output_path = process_chapter(chapter_path, provider, api_key, model_name=model_name)
        return {"status": "success", "output_path": output_path}
        
    elif command == "chat_message":
        message = cmd_data.get("message")
        history = cmd_data.get("history", [])
        context_text = cmd_data.get("context_text", "")
        provider = cmd_data.get("provider", "gemini")
        api_key = cmd_data.get("api_key")
        model_name = cmd_data.get("model_name", "gemini-3.6-flash")
        
        if not message or not api_key:
            return {"status": "error", "message": "Missing 'message' or 'api_key'."}
            
        response = chat_with_context(message, history, context_text, provider, api_key, model_name=model_name)
        return {"status": "success", "response": response}
    
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
            if sys.argv[1] == '--b64' and len(sys.argv) > 2:
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
