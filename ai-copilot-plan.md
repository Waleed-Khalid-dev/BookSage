# BookSage — Phase 6: AI Copilot Layer
> **Type:** WEB (Tauri + React + TypeScript)  
> **Status:** Planning  
> **Created:** 2026-08-10  
> **Slug:** ai-copilot-plan.md

---

## Overview

Phase 6 wires the AI brain into every corner of BookSage. The user should be able to select any text in the Book Reader or Notes Viewer and instantly get AI help — summarize, explain, translate, simplify. A persistent sidebar chat holds the full session. View 5 (AIChatView) becomes a full-screen chat studio with multi-chapter context loading. The Python `ai_chat.py` backend already exists; this phase is primarily frontend + wiring.

**Primary Agent:** `frontend-specialist`  
**Secondary Agents:** `backend-specialist` (Python extensions), `database-architect` (chat_sessions table)

---

## Success Criteria

- [x] Select text anywhere → `✦ Ask AI` pill appears → click → popup opens with AI response
- [x] Right-click → Copilot submenu → quick actions auto-send and respond
- [x] Copilot Sidebar toggles from BookReader and NotesViewer toolbars
- [x] AIChatView (View 5) renders full chat with context selector
- [x] Model selector shows live availability dots based on configured API keys
- [x] Chat sessions persist to SQLite and reload on app restart
- [x] `npm run build` with zero errors

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| UI | React 18 + TypeScript + Vanilla CSS | Project standard |
| State | Zustand `chatStore` | Existing store pattern |
| AI Bridge | `invokePython` → `ai_chat.py` | Same IPC as all other phases |
| DB | SQLite `chat_sessions` table | Project standard |
| Markdown | `react-markdown` + `remark-gfm` | Already installed |
| Speech | Browser `SpeechRecognition` API | No extra dependency |

---

## File Structure

```
src/components/copilot/
  ├── CopilotPopup.tsx        ← Floating panel on text selection
  ├── CopilotPopup.css
  ├── CopilotSidebar.tsx      ← Pinned right-side chat panel
  ├── CopilotSidebar.css
  ├── ContextMenu.tsx         ← Custom right-click menu
  ├── ContextMenu.css
  ├── ModelSelector.tsx       ← Provider + model dropdown
  ├── ChatMessage.tsx         ← Single message bubble
  └── QuickActions.tsx        ← Preset prompt buttons

src/components/views/
  ├── AIChatView.tsx          ← Full-screen chat (replace 9-line stub)
  └── AIChatView.css

src/stores/
  └── chatStore.ts            ← Full rewrite with session management

python/
  ├── ai_chat.py              ← Add quick_action + translate support
  └── main.py                 ← Add translate_text, quick_action commands
```

---

## Task Breakdown

### PHASE 0 — Database & Backend Extension

---

#### T-01 | SQLite Migration — `chat_sessions` table
- **Agent:** `database-architect`
- **Priority:** P0 (blocker for T-09)
- **Dependencies:** none
- **INPUT:** `src/services/dbService.ts` (existing)
- **OUTPUT:** `chat_sessions` table created on app init; typed CRUD wrappers added
- **VERIFY:** `getAllChatSessions(bookId)` returns `[]` on fresh DB; `saveChatSession(...)` inserts a row and `getChatSession(id)` retrieves it

```sql
CREATE TABLE IF NOT EXISTS chat_sessions (
  id          TEXT PRIMARY KEY,
  book_id     TEXT REFERENCES books(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'New Chat',
  messages    TEXT NOT NULL DEFAULT '[]',
  context_mode TEXT DEFAULT 'chapter',
  model_name  TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

ALTER TABLE chapters ADD COLUMN IF NOT EXISTS ai_insights TEXT;
```

**Wrappers to add in `dbService.ts`:**
- `saveChatSession(session)` — upsert
- `getAllChatSessions(bookId)` — list for sidebar
- `deleteChatSession(id)` — with cascade
- `getChapterInsights(chapterId)` — read pinned AI insights

---

#### T-02 | Python: Extend `ai_chat.py` + `main.py`
- **Agent:** `backend-specialist`
- **Priority:** P0 (blocker for T-07)
- **Dependencies:** none
- **INPUT:** `python/ai_chat.py`, `python/main.py`
- **OUTPUT:** Two new commands: `quick_action` and `translate_text`

**`quick_action` command payload:**
```json
{ "command": "quick_action", "action": "summarize|eli5|explain|shorten|lengthen|grammar|rephrase", "text": "...", "provider": "gemini", "api_key": "...", "model_name": "..." }
```

**`translate_text` command payload:**
```json
{ "command": "translate_text", "text": "...", "target_language": "Spanish", "provider": "gemini", "api_key": "...", "model_name": "..." }
```

**`chat_message` extension:** Accept optional `context_mode: "chapter"|"book"|"custom"` and `chapters: ChapterJSON[]` for multi-chapter injection.

**VERIFY:** `invokePython({ command: "quick_action", action: "eli5", text: "Power corrupts", ... })` returns `{ status: "success", response: "..." }`

---

### PHASE 1 — Core Components

---

#### T-03 | `chatStore.ts` — Zustand store rewrite
- **Agent:** `frontend-specialist`
- **Priority:** P1 (blocker for all UI)
- **Dependencies:** T-01
- **INPUT:** existing `src/stores/chatStore.ts` (currently minimal)
- **OUTPUT:** Full store with session management

**State shape:**
```typescript
interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string; ts: number; }
interface ChatSession { id: string; bookId: string; title: string; messages: ChatMessage[]; contextMode: 'chapter'|'book'|'custom'; modelName: string; createdAt: number; updatedAt: number; }

interface ChatStore {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  selectedText: string;         // from BookReader/NotesViewer selection
  selectionRect: DOMRect | null;
  showPopup: boolean;
  showSidebar: boolean;
  showContextMenu: boolean;
  contextMenuPos: { x: number; y: number };
  // actions
  sendMessage(message: string, context: string): Promise<void>;
  createSession(bookId: string): ChatSession;
  loadSessions(bookId: string): Promise<void>;
  setSelectedText(text: string, rect: DOMRect): void;
  clearSelection(): void;
  toggleSidebar(): void;
  pinInsight(chapterId: string, content: string): Promise<void>;
}
```

**VERIFY:** `useChatStore.getState().createSession(bookId)` returns a valid session object with UUID

---

#### T-04 | `ModelSelector.tsx` component
- **Agent:** `frontend-specialist`
- **Priority:** P1 (blocker for T-05, T-06, T-08)
- **Dependencies:** none
- **INPUT:** `src/stores/settingsStore.ts` (has provider/apiKey/modelName)
- **OUTPUT:** Reusable dropdown with grouped providers + availability dots

**Rules:**
- Read `settingsStore` to determine which providers have API keys configured
- Green dot = key present; grey dot = key missing
- Compact variant (for popup) vs. full variant (for sidebar + chat view)
- Selecting a model updates `settingsStore.modelName`

**VERIFY:** Render `<ModelSelector />` → dropdown shows grouped list → selecting "gemini-1.5-pro" updates store → persists on reload

---

#### T-05 | `CopilotPopup.tsx` + `CopilotPopup.css`
- **Agent:** `frontend-specialist`
- **Priority:** P1 (core feature)
- **Dependencies:** T-03, T-04, T-02
- **INPUT:** `chatStore.selectedText`, `chatStore.selectionRect`
- **OUTPUT:** Draggable floating popup component

**UI Spec:**
```
┌─[drag-handle]─────────────────────[✕]─┐
│ ✦ BookSage Copilot                     │
│ ┌────────────────────────────────────┐ │
│ │ Context: "The 48 Laws of Power..." │ │ ← selected text (truncated)
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ Ask anything about this...    [→] │ │ ← textarea + send btn
│ └────────────────────────────────────┘ │
│ [ModelSelector compact]                │
│ ── Response ──────────────────────────│
│ [AI response renders here]             │
│ [⟳ Regenerate]  [📋 Copy]  [📌 Pin]  │
└────────────────────────────────────────┘
```

**Behavior:**
- Draggable via drag handle (use `onMouseDown` + `mousemove` on `document`)
- Viewport clamping: never goes off-screen
- `Enter` to send, `Shift+Enter` for newline
- Response streams in character-by-character (simulate with `setInterval` on chunks or real streaming)
- Shows loading dots `● ● ●` while waiting
- `Pin` button calls `chatStore.pinInsight(chapterId, response)`

**VERIFY:** Select text → popup opens → type question → AI responds → response renders as markdown → copy button copies text

---

#### T-06 | `ContextMenu.tsx` + `ContextMenu.css`
- **Agent:** `frontend-specialist`
- **Priority:** P1 (core feature)
- **Dependencies:** T-03, T-02
- **INPUT:** `chatStore.selectedText`, `chatStore.contextMenuPos`
- **OUTPUT:** Custom context menu that replaces native right-click

**Menu items (in order):**
1. `✦ Add to Chat Context` — appends to sidebar input context
2. `💬 Quick Ask` — opens CopilotPopup
3. `───`
4. `📋 Summarize` → quick_action: summarize → auto-send in popup
5. `🧠 Simplify (ELI5)` → quick_action: eli5 → auto-send
6. `💡 Explain` → quick_action: explain → auto-send
7. `✂️ Make Shorter` → quick_action: shorten → auto-send
8. `📝 Make Longer` → quick_action: lengthen → auto-send
9. `✅ Fix Grammar` → quick_action: grammar → auto-send
10. `🌐 Translate to ▶` → submenu: Spanish, French, Arabic, Urdu, German, Chinese, Japanese, Portuguese, Italian, Russian
11. `───`
12. `📌 Save as Highlight` → calls bookStore highlight creation
13. `📋 Copy` → `navigator.clipboard.writeText`

**Rules:**
- `contextmenu` event on BookReader + NotesViewer wrappers calls `e.preventDefault()` then sets store position
- Auto-close on: click outside, `Esc`, scroll
- Smart flip: if near right/bottom edge, open left/upward

**VERIFY:** Right-click in BookReader → custom menu appears → click "Summarize" → popup opens with summary response

---

#### T-07 | `CopilotSidebar.tsx` + `CopilotSidebar.css`
- **Agent:** `frontend-specialist`
- **Priority:** P1 (core feature)
- **Dependencies:** T-03, T-04, T-01
- **INPUT:** `chatStore` (sessions, messages, isLoading)
- **OUTPUT:** Persistent collapsible right panel

**UI Spec:**
```
┌─ ✦ BookSage Copilot ──────[↔][✕]─┐
│ Context: The 48 Laws of Power     │ ← book context badge
│ Chapter: Law 3 — Conceal...       │
├───────────────────────────────────┤
│ [Preset: What is this about?]     │ ← quick preset pills
│ [Preset: Core lesson?]            │
├───────────────────────────────────┤
│                                   │
│  USER: Can you explain Law 3?     │
│  AI: Law 3 teaches that...        │
│  [Copy] [Pin] [🔄 Regenerate]     │
│                                   │
│  USER: Give me examples           │
│  AI: Here are 3 real examples...  │
│                                   │
│ ── Suggested Follow-ups ──────── │
│ [What other laws relate?] [...]   │
├───────────────────────────────────┤
│ ┌───────────────────────────────┐ │
│ │ Ask about this book...   [🎤]│ │
│ └───────────────────────────────┘ │
│ [ModelSelector]    [Send ▶]       │
│ [Clear Chat] [Export MD] [New💬]  │
└───────────────────────────────────┘
```

**Features:**
- Width: 320px default, resizable via drag handle
- Collapses to icon rail on toggle (slides out with CSS transition)
- Context badge: shows current book + current chapter (from bookStore + notesViewer state)
- Context mode toggle: `[Chapter] [Book] [Custom]` tabs above chat
- Preset prompt pills (5 one-click questions)
- Suggested follow-up pills rendered after each AI response (3 pills from AI)
- Voice input button `🎤` uses `SpeechRecognition` API
- Export chat as `.md` via Tauri `dialog.save()`
- Sessions persist to SQLite via T-01 wrappers

**VERIFY:** Toggle sidebar → it slides in/out → send message → AI responds → close app → reopen → session still there

---

#### T-08 | `ChatMessage.tsx` + `FollowUpPills.tsx`
- **Agent:** `frontend-specialist`
- **Priority:** P1 (sub-component for T-07)
- **Dependencies:** T-03
- **INPUT:** `ChatMessage` object from store
- **OUTPUT:** Styled message bubble + follow-up pill row

**ChatMessage:**
- User: right-aligned dark bubble
- AI: left-aligned, teal-left-border bubble
- AI messages render content with `react-markdown`
- Hover reveals action row: `[📋 Copy]` `[📌 Pin Insight]`
- Typing indicator: 3 animated dots while `isLoading`

**FollowUpPills:**
- Row of 3 clickable pill buttons below AI messages
- Clicking auto-sends the question as next user message
- Follow-up questions must be extracted from AI response (structured output format in `ai_chat.py`)

**VERIFY:** Render `<ChatMessage role="assistant" content="**Bold** and `code`" />` → markdown renders correctly

---

### PHASE 2 — View Integration

---

#### T-09 | Wire `BookReader.tsx` for text selection + context menu
- **Agent:** `frontend-specialist`
- **Priority:** P2 (depends on all copilot components)
- **Dependencies:** T-05, T-06, T-07
- **INPUT:** `src/components/views/BookReader.tsx`
- **OUTPUT:** Text selection → pill + context menu wired; sidebar toggle button added

**Changes:**
1. Add `useEffect` listening to `mouseup` on the PDF container
2. On selection: call `chatStore.setSelectedText(text, rect)` → shows `CopilotPill`
3. On `contextmenu`: `e.preventDefault()` + set `chatStore.contextMenuPos` + `showContextMenu: true`
4. Mount `<CopilotPopup />` and `<ContextMenu />` and `<CopilotSidebar />` inside BookReader root
5. Add sidebar toggle button `✦` to the reader toolbar (next to search/zoom controls)

**VERIFY:** Select text in PDF → pill appears → right-click → context menu appears → click Summarize → popup opens and responds

---

#### T-10 | Wire `NotesViewer.tsx` — replace stub with real copilot
- **Agent:** `frontend-specialist`
- **Priority:** P2
- **Dependencies:** T-05, T-06, T-07
- **INPUT:** `src/components/views/NotesViewer.tsx` (Phase 5 stub copilot pill)
- **OUTPUT:** Replace the toast-only stub with real copilot popup

**Changes:**
1. Import and mount `<CopilotPopup />`, `<ContextMenu />`, `<CopilotSidebar />`
2. The existing `mouseup` listener in NotesViewer already sets selection — hook it to `chatStore.setSelectedText`
3. Add `contextmenu` handler same as T-09
4. Add sidebar toggle to notes toolbar
5. Context injected = current chapter's JSON (`core_lesson + summary + teachings`)

**VERIFY:** Select text in notes → pill + context menu work → sidebar remembers chapter context when switching chapters

---

#### T-11 | `AIChatView.tsx` — full rewrite
- **Agent:** `frontend-specialist`
- **Priority:** P2
- **Dependencies:** T-03, T-04, T-07, T-08
- **INPUT:** Existing 9-line stub
- **OUTPUT:** Full-screen three-column chat studio

**Layout:**
```
┌─[Context Selector]─┬────[Chat Thread]────┬─[Session Info]─┐
│                    │                     │                 │
│ 📚 Book: 48 Laws  │  USER: Hello        │ Model: Gemini   │
│                    │  AI: Hi there!      │ Tokens: ~4,200  │
│ Context Mode:      │  USER: Explain...   │                 │
│ ○ Chapter          │  AI: ...            │ Sessions:       │
│ ● Book Summary     │                     │ > New Chat      │
│ ○ Custom           │ [Suggested Pills]   │ > Session 1     │
│                    │                     │ > Session 2     │
│ Chapters:          ├─────────────────────┤                 │
│ [x] Law 1         │ [textarea + send]   │ [New Chat]      │
│ [x] Law 2         │ [ModelSelector]     │ [Export MD]     │
│ [ ] Law 3         │ [🎤] [Clear]        │ [Delete]        │
└────────────────────┴─────────────────────┴─────────────────┘
```

**Features:**
- Left panel: context mode selector + chapter multi-select checkboxes
- Center: full message thread (reuses `ChatMessage` + `FollowUpPills`)
- Right: session list from SQLite, new chat, export, model info
- Context injected based on mode:
  - `chapter`: active chapter JSON (same as sidebar)
  - `book`: all chapter `core_lesson` + `summary` concatenated
  - `custom`: only checked chapters in left panel
- Token estimate shown as `~X,XXX tokens` (rough: 1 token ≈ 4 chars)

**VERIFY:** Open View 5 → select "Book Summary" mode → send "What is the main theme?" → AI response references multiple chapters

---

### PHASE 3 — Polish & Extras

---

#### T-12 | Floating Copilot Orb (Global)
- **Agent:** `frontend-specialist`
- **Priority:** P3 (NICE)
- **Dependencies:** T-07
- **INPUT:** `src/App.tsx`
- **OUTPUT:** Persistent `✦` button floating on all views

**Spec:**
- Positioned `fixed` bottom-right (32px margin)
- 48×48px circular button with teal gradient + glow pulse animation
- `onClick` → `chatStore.toggleSidebar()`
- Draggable to any screen corner (snaps to closest corner on release)
- Hides automatically when sidebar is open (to avoid overlap)

**VERIFY:** Navigate to LibraryView → orb visible → click → sidebar slides in → orb hides

---

#### T-13 | Persona Selector
- **Agent:** `frontend-specialist`
- **Priority:** P3 (NICE)
- **Dependencies:** T-07
- **INPUT:** `src/stores/settingsStore.ts`, `CopilotSidebar.tsx`
- **OUTPUT:** Persona dropdown in sidebar header; persona injected into system prompt

**Personas & prompts:**
- 🎓 Scholar: "Respond as an academic expert. Be detailed, cite principles."
- 👨‍🏫 Teacher: "Explain simply, use analogies and real-world examples."
- 🔥 Coach: "Be direct, motivational, and action-focused."
- 🤔 Devil's Advocate: "Challenge my assumptions. What could go wrong?"

**VERIFY:** Select "Coach" persona → send message → response tone is noticeably different (action-oriented)

---

#### T-14 | Voice Input
- **Agent:** `frontend-specialist`
- **Priority:** P3 (NICE)
- **Dependencies:** T-05, T-07
- **INPUT:** Browser `SpeechRecognition` API
- **OUTPUT:** Mic button in sidebar + popup input areas

**Spec:**
- `Alt+M` toggles microphone
- Recording indicator: red pulsing dot on mic button
- Final transcript fills textarea (user reviews before send)
- Graceful fallback: hide mic button if API not supported

**VERIFY:** Click mic → speak "What is the core lesson?" → text appears in input field

---

### PHASE X — Verification

---

#### TX-01 | Lint + Type Check
```bash
npm run lint && npx tsc --noEmit
```

#### TX-02 | Build Test
```bash
npm run build
```

#### TX-03 | Manual Smoke Test Checklist
- [x] Open BookReader → select text → pill appears
- [x] Click pill → popup opens → AI responds
- [x] Right-click → context menu → Summarize → popup auto-responds
- [x] Right-click → Translate to Spanish → popup shows Spanish text
- [x] Sidebar toggle works from BookReader toolbar
- [x] Sidebar context badge shows correct book + chapter name
- [x] Send message in sidebar → AI responds with book context
- [x] Switch chapter → sidebar context badge updates
- [x] Open AIChatView (View 5) → select "Book Summary" mode → chat works
- [x] Restart app → chat sessions still visible in AIChatView
- [x] Model selector shows green dot for configured provider
- [x] Floating orb visible on LibraryView → click → opens sidebar
- [x] Export chat → saves valid Markdown file

#### TX-04 | Run UX Audit
```bash
python .agents/skills/frontend-design/scripts/ux_audit.py .
```

---

## Dependency Graph

```
T-01 (DB) ─────────────────────────────────────────┐
T-02 (Python) ──────────────────────────────────────┤
T-03 (chatStore) ◄── T-01 ─────────────────────────┤
T-04 (ModelSelector) ─────────────────────────────  │
T-05 (CopilotPopup) ◄── T-03 + T-04 + T-02         │
T-06 (ContextMenu) ◄── T-03 + T-02                  │
T-07 (CopilotSidebar) ◄── T-03 + T-04 + T-01       │
T-08 (ChatMessage) ◄── T-03                         │
T-09 (BookReader wire) ◄── T-05 + T-06 + T-07       │
T-10 (NotesViewer wire) ◄── T-05 + T-06 + T-07      │
T-11 (AIChatView) ◄── T-03 + T-04 + T-07 + T-08 ───┘
T-12 (Orb) ◄── T-07
T-13 (Persona) ◄── T-07
T-14 (Voice) ◄── T-05 + T-07
```

**Parallel batches:**
- **Batch A** (no deps): T-01, T-02, T-04
- **Batch B** (after A): T-03, T-05, T-06, T-08
- **Batch C** (after B): T-07, T-09, T-10
- **Batch D** (after C): T-11, T-12, T-13, T-14

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Popup positioning near screen edges | Viewport clamping math: clamp `x` to `[0, window.width - popupWidth]` |
| Chat context too large (entire book) | Inject only `core_lesson + summary` per chapter (~200 tokens each); show token counter |
| `SpeechRecognition` not supported (Tauri WebView) | Feature-detect on mount; hide mic button if unavailable |
| Streaming not supported by all providers | Simulate streaming with chunked `setInterval` on the complete response |
| SQLite `ALTER TABLE` fails if column exists | Use `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ... IF NOT EXISTS` pattern |

---

## ✅ PHASE X COMPLETE
- Lint: [x]
- Type Check: [x]
- Build: [x]
- Manual Smoke Test: [x]
- Date: 2026-08-10
