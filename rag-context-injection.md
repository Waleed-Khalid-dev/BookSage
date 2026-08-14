# RAG Context Injection Plan

## Objective
Upgrade the AI Copilot so it accurately answers questions based on the actual book contents rather than relying on its pre-trained memory. 

## Strategy: Targeted File Injection
Instead of sending a generic prompt (e.g., "You are reading Chapter 3"), the frontend will pass the specific file paths containing the book's text to the Python backend. Python will read these files and inject their contents directly into the hidden system prompt sent to the AI.

### Context Modes
1. **Chapter Scope (Option A):**
   - The user selects "Chapter" in the sidebar.
   - The frontend passes the absolute file path of the current chapter's raw `.txt` file (`chapter.path`) to Python.
   - Python reads the `.txt` file and injects the full word-for-word text into the prompt.
   - **Result:** 100% accurate answers for specific quotes and granular details.

2. **Entire Book Scope (Option B):**
   - The user selects "Entire Book" in the sidebar.
   - The frontend passes an array of file paths for *every* chapter's `.json` summary file (`chapter.json_path`) to Python.
   - Python loops through the JSON files, extracts the "Summary" and "Core Lesson" fields, combines them into a single document, and injects that into the prompt.
   - **Result:** Accurate high-level answers spanning the entire book, without exceeding AI token limits.

## Implementation Steps

### Phase 1: Frontend Preparation
- Update `<CopilotSidebar />` and `chatStore.ts` to expect and handle a `contextFiles` array (containing file paths) instead of a simple `contextText` string.
- In `App.tsx`, calculate the appropriate file paths:
  - If `contextMode === 'chapter'`, find the `activeChapter` and pass its `.txt` path.
  - If `contextMode === 'book'`, map over all `chapters` and pass their `.json` paths.

### Phase 2: Python Backend Modification
- Update `main.py` -> `chat_message` command to accept `context_files` and a `context_mode` parameter.
- Modify `ai_chat.py` to:
  - Open and read the `.txt` file if `context_mode == "chapter"`.
  - Open, parse, and concatenate the `.json` files if `context_mode == "book"`.
  - Format this data cleanly into the `system_prompt` before sending it to the LLM (Gemini/OpenAI).

### Phase 3: Verification
- Ask the AI a specific question about an obscure quote in the current chapter (verify Chapter Mode).
- Ask the AI a broad question about a chapter that is currently closed (verify Entire Book Mode).

## Open Design Questions
*(To be resolved during the /grill-me session)*
1. Should the Python backend gracefully handle missing `.json` files if a chapter extraction failed previously?
2. Should we show a loading indicator or UI warning if the text files are very large?
