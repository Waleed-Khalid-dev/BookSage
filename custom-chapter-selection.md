# Plan: Custom Chapter Selection in Full AI Chat View

## 🎯 Goal
Implement **"Custom Selection" mode** in `AIChatView.tsx` and the Python sidecar, allowing users to multi-select specific chapters (e.g. Chapters 2, 4, 7) via a header popover picker, toggle full raw text inclusion with dynamic context window warnings, and persist selection state per chat session in SQLite.

---

## 🏗️ Architecture & Requirements

### 1. UI & Popover Component (`AIChatView.tsx` + `AIChatView.css`)
- **Context Toggle Extension**:
  - Add `📑 Custom (N)` button next to `📚 Full Book` and `📄 Chapter`.
  - When `custom` mode is active, clicking the button opens a floating dropdown popover panel.
- **Popover Contents**:
  - **Search Input**: Live filter for chapters by title or chapter number.
  - **Quick Actions**: `Select All` and `Clear All` buttons.
  - **Chapter Checklist**: Scrollable list of chapters with:
    - Checkbox
    - Chapter Number + Title + Page Range (e.g. `Ch 4: Always Say Less (pp. 31-39)`)
    - Extraction indicator (`✅ Extracted` / `⏳ Raw text only`)
  - **Advanced Toggle**: `"Include Full Raw Text (.txt)"` switch.
  - **Context Warning Badge**: Dynamic warning alert displayed when full raw text is toggled ON and 3+ chapters are selected:
    > ⚠️ *Including full text for 3+ chapters may exceed context limits or increase latency depending on the model.*
  - Click outside (or `Done` button) closes the popover.

---

### 2. Store & SQLite Persistence (`chatStore.ts` + `dbService.ts`)
- **Type Definitions**:
  - Update `ChatSession` and `ChatMessageRecord` to include:
    - `customChapterIds?: string[];`
    - `includeRawText?: boolean;`
- **Store Actions**:
  - `setCustomChapters: (sessionIds: string[], chapterIds: string[], includeRawText?: boolean) => void;`
  - Auto-save to SQLite `chat_sessions` table on selection change.
  - When switching sessions in `AIChatView`, restore the session's exact custom chapter list and toggle states.

---

### 3. Python Backend Context Injection (`python/ai_chat.py` + `python/main.py`)
- **`chat_with_context` Updates**:
  - Support `context_mode == "custom"`.
  - Accept `selected_json_paths: List[str]` and `selected_txt_paths: List[str]`.
  - Build formatted context:
    1. **Structured Data**: Injects complete chapter data from `.json` (Summary, Core Lesson, Key Teachings, Implementation Steps, Supporting Quotes).
    2. **Raw Text (Optional)**: If `include_raw_text=True`, reads and injects the corresponding `.txt` files with clear delimiter headers (`--- CHAPTER RAW TEXT: [Title] ---`).

---

## 🛡️ Non-Breaking Guarantee
- Preserves existing `Full Book` and `Current Chapter` modes completely.
- Backward-compatible SQLite schema (handles sessions where `customChapterIds` is null/empty).
- Preserves all Markdown rendering, copy/pin actions, font scaling (`A-`/`A+`), and theme styling across all 6 themes.

---

## 🧪 Verification Plan
1. **Build Verification**: Run `npm run build` (`tsc && vite build`) to confirm 0 TypeScript / bundling errors.
2. **Behavioral Testing**:
   - Open AIChatView and click `📑 Custom`.
   - Select 2 specific chapters (e.g. Chapters 3 and 7).
   - Ask: *"What are the key differences between the chapters I have selected?"* → Verify AI references only Chapters 3 and 7.
   - Toggle `"Include Full Raw Text"` ON with 3+ chapters → Verify warning alert displays properly.
   - Switch to another session and switch back → Verify custom selection is preserved from SQLite.
