import json
import sys
import traceback
from chapter_splitter import split_book_into_chapters

def handle_command(cmd_data):
    command = cmd_data.get("command")
    
    if command == "split_book":
        pdf_path = cmd_data.get("path")
        if not pdf_path:
            return {"status": "error", "message": "Missing 'path' argument."}
        return split_book_into_chapters(pdf_path)
    
    elif command == "ping":
        return {"status": "success", "message": "pong"}
        
    else:
        return {"status": "error", "message": f"Unknown command: {command}"}

def main():
    if len(sys.argv) > 1:
        # CLI Argument mode (Tauri sidecar usually uses args or stdin)
        try:
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
                print(json.dumps({"status": "error", "message": str(e)}))
                sys.stdout.flush()

if __name__ == "__main__":
    main()
