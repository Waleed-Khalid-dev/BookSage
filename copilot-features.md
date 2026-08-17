# 🤖 Phase 6 — AI Copilot Layer Feature Tracker

> **Approach:** Inline Selection Copilot + Persistent Chat Sidebar + Full AIChatView  
> **Status:** 🔴 Not Started  
> **Planned:** 2026-08-10

---

## 📊 Feature Priority Matrix

| Tier | Label | Source Inspiration | Description |
|------|-------|--------------------|-------------|
| 🔴 CORE | Must-have | Readwise Ghostreader, ChatPDF | Floating popup on text selection, quick actions |
| 🔴 CORE | Must-have | VS Code Copilot, Perplexity | Persistent sidebar chat with book context |
| 🔴 CORE | Must-have | All LLM apps | Full AIChatView (View 5) with session history |
| 🟡 HIGH | Strong differentiator | Kindle "Ask This Book" | Source-grounded answers with page references |
| 🟡 HIGH | Strong differentiator | Readwise, Elicit | Multi-chapter context injection |
| 🟡 HIGH | Strong differentiator | Perplexity Copilot | Suggested follow-up questions |
| 🟢 NICE | Power-user extra | Claude, Elicit | Export conversation to Markdown |
| 🟢 NICE | Power-user extra | Notewise Magic Select | AI image/diagram explanation (future) |

---

## 🔴 CORE Features

### 1. Text Selection → Copilot Popup (`CopilotPopup.tsx`)
*Inspired by: Readwise Ghostreader, VS Code Copilot, Notion AI*

- [x] Detect text selection via `mouseup` in BookReader AND NotesViewer
- [x] Show a small floating pill button `✦ Ask AI` just above the selection anchor
- [x] Pill button dismisses on click-away or `Esc`
- [x] Clicking pill opens the CopilotPopup panel:
  - [x] Draggable (drag handle at top)
  - [x] Close button `[✕]`
  - [x] "Ask about this..." textarea pre-seeded with selected text as context
  - [x] Model selector mini-dropdown (inline, compact)
  - [x] Send button (`Enter` to submit)
  - [x] AI response renders with `react-markdown` inside the popup
  - [x] Streaming response display (character-by-character reveal)
  - [x] Popup remembers position between opens in the same session
- [x] Smart viewport clamping: popup flips above/below selection to stay on screen

### 2. Right-Click Context Menu (`ContextMenu.tsx`)
*Inspired by: Readwise, Notion AI, Microsoft Edge Copilot*

- [x] Custom right-click menu replacing native browser menu in BookReader + NotesViewer
- [x] Menu items:
  - [x] **✦ Add to Chat Context** — appends selected text to sidebar chat context
  - [x] **💬 Quick Ask** — opens CopilotPopup with selected text
  - [x] `──────────────`
  - [x] **📋 Summarize** — one-click summarization in popup
  - [x] **🧠 Simplify (ELI5)** — "Explain like I'm 5" in popup
  - [x] **💡 Explain** — detailed concept explanation in popup
  - [x] **✂️ Make Shorter** — condense the selected text
  - [x] **📝 Make Longer** — expand/elaborate the selected text
  - [x] **✅ Fix Grammar** — grammar and spelling correction
  - [x] **🌐 Translate to...** — submenu with 10 common languages
  - [x] `──────────────`
  - [x] **📌 Save as Highlight** — creates highlight annotation (bridges Phase 4.5)
  - [x] **📋 Copy** — native copy action
- [x] Menu auto-closes on any click outside
- [x] Quick-action items pre-fill the popup and auto-send (no extra click needed)

### 3. Copilot Sidebar (`CopilotSidebar.tsx`)
*Inspired by: VS Code GitHub Copilot Chat, Readwise Reader sidebar*

- [x] Collapsible right panel (default width: 320px, resizable)
- [x] Toggle button in BookReader + NotesViewer toolbars
- [x] Panel sections:
  - [x] **Context Badge** — shows currently loaded context: book title + chapter name
  - [x] **Chat History** — scrollable message thread (user + AI alternating bubbles)
  - [x] **Input Area** — multiline textarea + Send button + model selector
  - [x] **Clear Chat** button — resets history for current session
- [x] Chat persists while navigating between pages/chapters (session-level)
- [x] Context auto-updates when chapter changes in NotesViewer
- [x] "Context: [Chapter Name]" badge clickable → opens context details modal
- [x] Loading spinner (animated dots) while AI is responding
- [x] Copy button on every AI message bubble
- [x] "Regenerate" button on last AI message

### 4. Full AIChatView (`AIChatView.tsx` — View 5)
*Inspired by: ChatPDF, Claude Web, Perplexity*

- [x] Full-screen chat replacing the current placeholder stub
- [x] Three-column layout:
  - [x] **Left**: Book + Chapter context selector (which book/chapters to include)
  - [x] **Center**: Chat thread with message history
  - [x] **Right**: Session metadata + model info + clear/export actions
- [x] "New Chat" button (clears history, keeps context)
- [x] Context selector:
  - [x] "Entire Book" mode — injects all extracted chapter JSONs
  - [x] "Current Chapter" mode — injects only active chapter JSON
  - [x] "Custom Selection" mode — multi-select specific chapters
- [x] Message bubbles with user avatar + AI avatar
- [x] Markdown rendering in AI responses (code blocks, lists, bold, etc.)
- [x] Timestamps on messages
- [x] Conversation history persisted to SQLite (`chat_sessions` table)
- [x] Load previous sessions from history dropdown

### 5. Model Selector (`ModelSelector.tsx`)
*Inspired by: Readwise model picker, LM Studio*

- [x] Compact dropdown component (used in popup + sidebar + chat view)
- [x] Shows all configured providers with live availability dots:
  - [x] `gemini-2.0-flash` ● green (if key configured)
  - [x] `gemini-1.5-pro` ● green
  - [x] `──────────────`
  - [x] `gpt-4o` ○ grey (needs API key)
  - [x] `gpt-4o-mini` ○ grey
  - [x] `──────────────`
  - [x] `claude-sonnet-4` ○ grey
  - [x] `──────────────`
  - [x] `Ollama (local)` ● green (if Ollama running)
- [x] Persists last-used model in settingsStore
- [x] "Configure Keys" link at bottom → opens SettingsDialog

### 6. Python Backend: `chat_message` command
*Already partially implemented in `ai_chat.py` + `main.py`*

- [x] Extend `chat_with_context` to support:
  - [x] Multi-chapter context injection (concatenate multiple chapter JSONs)
  - [x] "Entire book" mode (all chapter summaries + core lessons injected)
  - [x] Quick-action prompts (Summarize, ELI5, Explain, etc. as system instructions)
- [x] Add `translate_text` command to `main.py` for the Translate action
- [x] Add `quick_action` command with `action_type` + `text` params

---

## 🟡 HIGH Features

### Source-Grounded Answers with Page References
*Inspired by: Kindle "Ask This Book", Perplexity citations, ChatPDF*

- [ ] AI responses that reference specific chapters: e.g., "According to Chapter 3: Law of Power..."
- [ ] Inline chapter badges in AI response: clickable `[Ch. 3]` chip that jumps to that chapter in NotesViewer
- [ ] "Jump to Source" button on any AI response containing chapter reference

### Multi-Chapter Context Window
*Inspired by: Elicit multi-doc, Claude 1M context*

- [x] "Book Summary" context mode: injects all chapter `core_lesson` + `summary` fields (compact, token-efficient)
- [x] Auto-truncation / context limits handling when context exceeds limit (with dynamic warning badge)
- [ ] Visual token counter in sidebar: `"~4,200 tokens in context"`

### Suggested Follow-Up Questions
*Inspired by: Perplexity Copilot, Google AI Overview*

- [x] After every AI response, show 3 suggested follow-up questions as clickable pills
- [x] Questions are generated by the AI alongside its main response (structured output)
- [x] Clicking a suggestion sends it immediately as the next message

### Conversation Branching / Pinned Insights
*Inspired by: Readwise AI-Enhanced Annotations*

- [x] "Pin" any AI response to a special "Insights" collection
- [ ] Pinned insights visible in the NotesViewer alongside chapter content
- [x] Pinned to `chapters.ai_insights TEXT` SQLite column (new migration)

### Quick-Access Toolbar Presets
*Inspired by: Notion AI, Grammarly*

- [x] Preset prompt buttons in sidebar header (one-click):
  - [x] 📖 "What is this chapter about?"
  - [x] 🎯 "What is the core lesson?"
  - [x] 🧪 "Give me 3 real-world examples"
  - [x] ❓ "What questions should I ask myself?"
  - [x] 🔗 "How does this connect to the previous chapter?"
- [ ] Presets are configurable in SettingsDialog

### "Story So Far" Book Recap
*Inspired by: Kindle Recaps, Kindle "Story So Far"*

- [ ] When opening a book that has `last_page > 1` AND studied chapters, offer:
  - [ ] "📚 Resume Reading — Get a recap of what you've read so far"
  - [ ] AI generates a spoiler-free summary of all studied chapters
  - [ ] Shows in a modal before switching to BookReader

### Voice Input (Web Speech API)
*Inspired by: Perplexity voice search, ChatGPT voice mode*

- [x] Microphone button in chat input area
- [x] Uses browser `SpeechRecognition` API (no backend needed)
- [x] Transcribed text fills the input field (user reviews before sending)
- [x] `Alt+M` keyboard shortcut to toggle microphone

---

## 🟢 NICE Features

### Export Chat to Markdown
*Inspired by: Claude "Export conversation", Perplexity history*

- [x] "Export" button in AIChatView and sidebar
- [x] Generates a Markdown file with: book title, date, full conversation thread
- [x] Saves to user-chosen folder via Tauri `dialog.save()`
- [ ] Option to append to the Obsidian vault export (bridges Phase 5b export)

### Chat History Persistence (SQLite)
*Inspired by: ChatGPT history, Claude projects*

- [x] New `chat_sessions` SQLite table:
  ```sql
  CREATE TABLE chat_sessions (
    id          TEXT PRIMARY KEY,
    book_id     TEXT REFERENCES books(id),
    title       TEXT,           -- auto-generated from first message
    messages    TEXT NOT NULL,  -- JSON array of {role, content, ts}
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );
  ```
- [x] Sessions listed in AIChatView left panel
- [x] Auto-title: first 6 words of user's opening message
- [x] Delete session with confirmation

### AI Writing Assistant Actions
*Inspired by: Notion AI, Grammarly, Jasper*

- [ ] Right-click → "✍️ Continue Writing" — AI extends the selected text
- [ ] Right-click → "🎨 Rephrase" — rewrites the text in a different style
- [ ] Right-click → "📊 Extract Key Data" — pulls out names, dates, numbers

### Inline Word Definition
*Inspired by: Kindle X-Ray, Apple Dictionary, Readwise*

- [ ] `Ctrl+Click` on any single word in BookReader or NotesViewer
- [ ] Small tooltip pops up with: dictionary definition + AI-powered contextual explanation in the book's context
- [ ] Uses free dictionary API for base definition; AI adds book-specific meaning

### AI-Generated Study Quiz
*Inspired by: Notewise AI Study Tools, Anki*

- [ ] Button in AIChatView: "🎓 Generate Quiz from [Chapter/Book]"
- [ ] AI generates 5 multiple-choice questions from the chapter JSON content
- [ ] Quiz renders as an interactive card deck in the chat view
- [ ] Shows correct/incorrect feedback with explanation

### Floating Copilot Orb (Global)
*Inspired by: Microsoft Copilot orb, Grammarly floating button*

- [x] Persistent floating circular button (`✦`) in the bottom-right of ANY view
- [x] Clicking opens the CopilotSidebar regardless of current view
- [x] Bouncy entrance animation, glow pulse idle state
- [x] Draggable to any screen corner

### Persona / Tone Selector
*Inspired by: Character.ai, Claude tone options*

- [x] Dropdown in sidebar/popup: "Copilot Persona"
  - [x] 🎓 **Scholar** — academic, detailed, cites principles
  - [x] 👨‍🏫 **Teacher** — explains simply, uses analogies
  - [x] 🔥 **Coach** — motivational, action-oriented
  - [x] 🤔 **Devil's Advocate** — challenges assumptions
- [x] Persona is injected as a system prompt prefix
- [x] Persisted in settingsStore

---

## ⏳ Deferred to Phase 7+

- [ ] **Multi-book context** — query across entire library (requires library-wide index)
- [ ] **AI-generated book cover tags** — auto-categorize books by topic/genre (Phase 7)
- [ ] **Semantic search** — find passages by meaning, not exact text (Phase 8)
- [ ] **Ollama model management** — pull/list local models from within the app (Phase 8)
- [ ] **Shared conversation links** — export chat as a shareable link (Mobile/cloud phase)

---

## 🗄️ New Database Migrations (Phase 6)

```sql
-- Persistent chat history
CREATE TABLE chat_sessions (
  id          TEXT PRIMARY KEY,
  book_id     TEXT REFERENCES books(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'New Chat',
  messages    TEXT NOT NULL DEFAULT '[]',  -- JSON [{role, content, ts}]
  context_mode TEXT DEFAULT 'chapter',     -- 'chapter' | 'book' | 'custom'
  model_name  TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- Pinned AI insights on chapters
ALTER TABLE chapters ADD COLUMN ai_insights TEXT; -- JSON array of pinned chat responses
```

---

## 📁 New Files to Create

| File | Purpose |
|------|---------|
| `src/components/copilot/CopilotPopup.tsx` | Floating selection popup |
| `src/components/copilot/CopilotPopup.css` | Popup styles |
| `src/components/copilot/CopilotSidebar.tsx` | Persistent right-side chat panel |
| `src/components/copilot/CopilotSidebar.css` | Sidebar styles |
| `src/components/copilot/ContextMenu.tsx` | Custom right-click menu |
| `src/components/copilot/ContextMenu.css` | Context menu styles |
| `src/components/copilot/ModelSelector.tsx` | Provider + model dropdown |
| `src/components/copilot/QuickActions.tsx` | Pre-filled action buttons |
| `src/components/copilot/ChatMessage.tsx` | Single message bubble component |
| `src/components/copilot/FollowUpPills.tsx` | Suggested question pills |
| `src/components/views/AIChatView.tsx` | Full-screen chat view (replace stub) |
| `src/components/views/AIChatView.css` | Full chat view styles |
| `src/stores/chatStore.ts` | Chat session state (Zustand) |
| `src/services/dbService.ts` | + `saveChatSession`, `getChatSessions` |

---

## 📁 Files to Modify

| File | Change |
|------|--------|
| `src/components/views/BookReader.tsx` | Wire text selection → pill → popup + context menu |
| `src/components/views/NotesViewer.tsx` | Wire text selection → pill → popup + context menu (stub → real) |
| `python/ai_chat.py` | Add multi-chapter context, quick-action prompts, translate |
| `python/main.py` | Add `translate_text`, `quick_action` commands |
| `src/services/dbService.ts` | Add chat session CRUD |
| `src/stores/chatStore.ts` | Full rewrite with session management |

---

> Last updated: 2026-08-10
