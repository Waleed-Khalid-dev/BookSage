import sys
import json
from main import handle_command

cmd = {
    "command": "export_chapters",
    "chapters": [{
        "path": r"C:\Users\Ace\Documents\BookSage_Projects\The 48 Laws of Power\008_LAW 1 - NEVER OUTSHINE THE MASTER.txt",
        "title": "NEVER OUTSHINE THE MASTER",
        "num": 1
    }],
    "output_dir": r"C:\Users\Ace\Desktop\BookSage-output-test"
}

res = handle_command(cmd)
print("RESULT:", res)
