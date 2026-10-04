# 🤖 Phase 6 — AI Copilot Layer Feature Tracker

> **Approach:** Inline Selection Copilot + Persistent Chat Sidebar + Full AIChatView  
> **Status:** 🟢 Complete & Verified  
> **Updated:** 2026-10-04

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
| 🟢 NICE | Visual Delight | Retractable Book Drawer | Draggable floating book cover popup & downward sliding cover showcase |

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

- [x] AI responses that reference specific chapters: e.g., "According to Chapter 3: Law of Power..."
- [x] Inline chapter badges in AI response: clickable `[Ch. 3]` chip that jumps to that chapter in NotesViewer
- [x] "Jump to Source" button on any AI response containing chapter reference

### Multi-Chapter Context Window
*Inspired by: Elicit multi-doc, Claude 1M context*

- [x] "Book Summary" context mode: injects all chapter `core_lesson` + `summary` fields (compact, token-efficient)
- [x] Auto-truncation / context limits handling when context exceeds limit (with dynamic warning badge)
- [x] Visual token counter in sidebar: `"~4,200 tokens in context"` dynamically estimating tokens for active context, draft text, and history with tier color-coding

### Suggested Follow-Up Questions
*Inspired by: Perplexity Copilot, Google AI Overview*

- [x] After every AI response, show 3 suggested follow-up questions as clickable pills
- [x] Questions are generated by the AI alongside its main response (structured output)
- [x] Clicking a suggestion sends it immediately as the next message

### Conversation Branching / Pinned Insights
*Inspired by: Readwise AI-Enhanced Annotations*

- [x] "Pin" any AI response to a special "Insights" collection
- [x] Pinned insights visible in the NotesViewer alongside chapter content
- [x] Pinned insights visible in BookReader Notes tab sidebar with jump-to-page & unpin
- [x] Pinned insights included in Markdown annotations export
- [x] Pinned to `chapters.ai_insights TEXT` SQLite column (new migration)

### Quick-Access Toolbar Presets
*Inspired by: Notion AI, Grammarly*

- [x] Preset prompt buttons in sidebar header (one-click):
  - [x] 📖 "What is this chapter about?"
  - [x] 🎯 "What is the core lesson?"
  - [x] 🧪 "Give me 3 real-world examples"
  - [x] ❓ "What questions should I ask myself?"
  - [x] 🔗 "How does this connect to the previous chapter?"
- [x] Presets are configurable in SettingsDialog (edit label, icon, prompt, add custom presets, toggle on/off, reset to defaults)

### "Story So Far" Book Recap
*Inspired by: Kindle Recaps, Kindle "Story So Far"*

- [x] When opening a book that has `last_page > 1` AND studied chapters, offer:
  - [x] "📚 Resume Reading — Get a recap of what you've read so far"
  - [x] AI generates a spoiler-free summary of all studied chapters
  - [x] Shows in a modal/banner upon resuming in BookReader, plus on-demand toolbar & Copilot preset button
  - [ ] **NOTE (Phase 7 Milestone):** When implementing Phase 7 (Library View), wire this "Resume Reading / Story So Far" prompt directly into the book card click/hover actions when selecting an in-progress book from the Library grid.

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

- [x] Right-click → "✍️ Continue Writing" — AI extends the selected text
- [x] Right-click → "🎨 Rephrase" — rewrites the text in a different style
- [x] Right-click → "📊 Extract Key Data" — pulls out names, dates, numbers

### Inline Word Definition
*Inspired by: Kindle X-Ray, Apple Dictionary, Readwise*

- [x] `Ctrl+Click` on any single word in BookReader or NotesViewer
- [x] Dedicated draggable floating modal with dictionary definition + AI-powered contextual explanation in the book's context
- [x] Dual-engine lookup: Free Dictionary API base + SQLite local cache + Gemini/OpenAI/Claude AI fallback
- [x] High-precision macOS-style cursor on Ctrl-hover, Context Menu shortcut badge, and Settings shortcuts list
- [x] Audio pronunciation playback with automatic Web Speech API fallback
- [x] Rate-limit (429) protection, consolidated requests, in-flight cancellation, and one-click retry UI
- [x] "Discuss in Copilot" integration sending target term and chapter context to Copilot sidebar

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

- [x] Unified dropdown in sidebar, text selection popup, and AIChatView: `[ 🎓 Scholar ▾ ]`
  - [x] 🎓 **Scholar** — academic, detailed, cites principles
  - [x] 👨‍🏫 **Teacher** — explains simply, uses analogies
  - [x] 🔥 **Coach** — motivational, action-oriented
  - [x] 🤔 **Devil's Advocate** — challenges assumptions
- [x] Persona is injected as a system prompt prefix across all chat interactions
- [x] Optional Quick Actions persona toggle ("Apply Persona Tone to Quick Actions") in Settings
- [x] Persisted in `booksage-settings` (`localStorage`) across restarts and reloads
- [x] Dedicated "AI Copilot" tab in SettingsDialog with visual persona cards and toggle switch
- [x] Minimalist persona tag badges on every assistant response across AIChatView, CopilotSidebar, and CopilotPopup
- [x] Persona preserved per-message in SQLite `chat_sessions` (`ChatMessageRecord.persona`)

### Draggable Book Cover Popup & Downward Slide Panel (Visual Feature)
*Inspired by: Interactive Reading Companion & Top Drawer Showcase*

A polished, non-intrusive visual reading companion specifically designed to sit gracefully in the reader interface without obstructing reading content or disrupting reading flow.

- **Status:** ✅ Completed
- **Scope:** Purely visual/interaction feature — zero architectural or prompt overhead.

#### 1. Visual Placement & Context
- **Reading Zone:** Positioned floating directly beneath the reader top toolbar, overlaying the top of the reading page or margin.
- **Natural Fit:** Inherits the active theme (Dark, Light, Warm/Sepia) styling, colors, borders, and typography of BookSage.

#### 2. Compact Floating Popup (Retractable Handle)
- **Content:**
  - Active book cover art thumbnail (dynamic based on the currently open book, e.g. *The 48 Laws of Power*).
  - Book title and author label.
  - Centered horizontal drag indicator handle (`═`).
  - Subtle dismiss button (`✕`).
- **Draggability:**
  - Draggable horizontally across the top reading header zone (left or right side).
  - Constrained within the reader bounds to prevent off-screen loss.
  - Dragging does not interfere with text selection, reader controls, or page clicks.
- **Retraction / Auto-Hide:**
  - Appears smoothly when the user opens the book or interacts with the top area.
  - Automatically slides upward into the top edge to retract and hide after an idle delay (a few seconds of reading).
  - Hovering or interacting resets/pauses the auto-hide timer.
  - Smooth easing curves (e.g. cubic-bezier) for entering and exiting.

#### 3. Expanded Downward-Sliding Panel (Showcase Drawer)
- **Trigger:**
  - Clicking the book-cover thumbnail inside the compact floating popup triggers the expanded showcase state.
  - Clicking the cover immediately cancels/overrides the auto-hide retraction timer.
- **Downward Slide Animation:**
  - Slides **physically downward from the top edge of the window** (like an upside-down pull-down blind or top drawer panel).
  - **Strict Requirement:** Must NOT be a centered modal, fade-in box, or instant pop-up. The physical animation originates from the top ceiling and glides smoothly downwards into view.
- **Expanded Content:**
  - Prominent high-resolution book cover artwork.
  - Book metadata (Title, Author, current reading progress / chapter info).
  - Seamless integration with existing reader aesthetics.
- **Dismissal & Retraction:**
  - Clicking a close button or clicking outside smoothly slides the panel back **upward** into the top edge of the window.
  - No abrupt layout jumps, shifts, or scroll position disruption.

#### 4. Interaction State Machine
- **State A (Compact Initial):** Slides down gently, visible for a few seconds. Can be dragged horizontally.
- **State B (Auto-Hidden):** Retracted into the top edge; can be summoned on hover or subtle reveal tab.
- **State C (Expanded Showcase):** Thumbnail clicked → Downward slide open. Auto-hide disabled while open.
- **State D (Dismissed):** Slides back upward into the top window boundary.

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
