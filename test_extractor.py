import os
import sys

# Add python dir to path so we can import our modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'python'))

from python.ai_extractor import process_chapter

api_key = "AQ.Ab8RN6JgfbbpYPZFsmU_z_VEzXL_0WyNf-wPGUKBiX7Llcvysw"
chapter_path = r"C:\Users\Ace\Documents\BookSage_Projects\Test Dummy Book\001_Chapter 1.txt"

print(f"Testing extraction on {chapter_path}")
try:
    out_path = process_chapter(chapter_path, "gemini", api_key)
    print(f"Success! Output saved to: {out_path}")
except Exception as e:
    import traceback
    print(f"Error occurred: {e}")
    traceback.print_exc()
