import json
import sys
from python.main import handle_command

if __name__ == '__main__':
    res = handle_command({
        "command": "split_book",
        "path": r"d:\[Project]\BookSage\dummy.pdf" 
    })
    print(json.dumps(res, indent=2))
