# BookSage — AI-Powered Book Studio

> **Version:** 3.0 · **Status:** Active Development · **Last Updated:** 2026-07-29

---

## 🎯 Mission Statement

> *BookSage is a self-contained desktop reading and learning studio. Drop in any PDF book, let AI extract structured lesson notes chapter by chapter, then read the book, study the notes, and chat with an AI copilot — all without leaving the app.*

**Target User:** A Windows power-user who reads dense non-fiction (Robert Greene, Naval Ravikant, etc.) and wants to extract maximum insight without wasting hours on manual note-taking. Everything is local-first, private, zero cloud dependency.

**The pivot from v2.0:** The original design exported Markdown files to Obsidian. BookSage v3 is the destination — a complete reading studio with a built-in book reader, an Obsidian-style notes viewer, and an AI copilot that activates on selected text. Users never need Obsidian installed.

---

## ✅ Feasibility Assessment (v3 additions)

| New Feature | Verdict | Notes |
|-------------|---------|-------|
| In-app Markdown rendering | ✅ Achievable | `react-markdown` + `remark-gfm` + custom CSS matching Obsidian's visual grammar |
| PDF page-by-page reader | ✅ Achievable | `pdfjs-dist` renders PDF pages as canvas elements inside React |
| Text selection → Copilot popup | ✅ Achievable | `window.getSelection()` + `mouseup` event → floating panel positioned near cursor |
| Context menu Copilot actions | ✅ Achievable | Custom React context menu on right-click replaces native menu |
| AI sidebar chat | ✅ Achievable | Persistent panel; shares the same AI client layer from Phase 2 |
| Model switcher dropdown | ✅ Achievable | React select showing all configured providers with availability status dots |
| Split-view (book + notes) | ✅ Achievable | CSS flexbox with a draggable divider between panels |
| Icon-based navigation sidebar | ✅ Achievable | Standard VS Code-style icon rail with view switching |

---

## 🏛️ App Architecture v3

```
BookSage Studio — Five Views, One App

┌────────────────────────────────────────────────────────────────────┐
│  Title Bar                                              [─][□][✕]  │
├──┬─────────────────────────────────────────────────────────────────┤
│  │                                                                  │
│🏠│  VIEW 1: Library / Home                                          │
│  │  Grid of processed books with cover art, progress, last opened  │
│  │                                                                  │
│📖│  VIEW 2: Book Reader                                             │
│  │  Page-by-page PDF renderer · word nav · text-select → Copilot   │
│  │                                                                  │
│📝│  VIEW 3: Notes Viewer                                            │
│  │  Obsidian-style rendered Markdown · chapter list · Copilot       │
│  │                                                                  │
│🔄│  VIEW 4: Process Pipeline (original MainWindow)                  │
│  │  Chapter splitting · AI extraction · progress tracking           │
│  │                                                                  │
│🤖│  VIEW 5: AI Chat (full session)                                  │
│  │  Full-screen copilot chat with book context loaded               │
│  │                                                                  │
│⚙️│  Settings Dialog (modal overlay)                                 │
├──┴─────────────────────────────────────────────────────────────────┤
│  Status Bar                                                         │
└────────────────────────────────────────────────────────────────────┘

Floating Layer (renders on top of any view):
  └── Copilot Popup — appears on text selection, dismisses on click-away
```

---

## 🗺️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  BookSage Desktop App  (Tauri v2 shell)                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Frontend: React 18 + TypeScript                        │   │
│  │                                                         │   │
│  │  Navigation: Icon sidebar (VS Code-style)               │   │
│  │  Views: Library · BookReader · NotesViewer ·            │   │
│  │          Pipeline · AIChat                              │   │
│  │  Floating: CopilotPopup (over any view)                 │   │
│  │  Modal: SettingsDialog                                  │   │
│  │                                                         │   │
│  │  State: Zustand (bookStore · settingsStore · uiStore)   │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │ Tauri Commands (IPC)                  │
│  ┌──────────────────────▼──────────────────────────────────┐   │
│  │  Python Sidecar (bundled, no user install needed)       │   │
│  │                                                         │   │
│  │  pdf_handler.py      ← PyMuPDF (text + TOC)             │   │
│  │  chapter_splitter.py ← TOC + regex                      │   │
│  │  ai_extractor.py     ← Gemini / OpenAI / Claude / Ollama│   │
│  │  ai_chat.py          ← Session-based chat with context  │   │
│  │  markdown_gen.py     ← Jinja2 templates                 │   │
│  │  file_manager.py     ← I/O, optional Obsidian export    │   │
│  │  config_manager.py   ← keyring for API keys             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  pdfjs-dist (JS)       ← PDF page rendering in BookReader      │
│  react-markdown (JS)   ← Markdown rendering in NotesViewer     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔩 Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Desktop Shell | Tauri v2 | ~5MB bundle, native `.msi`, Rust sidecar management |
| Frontend | React 18 + TypeScript | Existing mockup is already React/TSX |
| Styling | Vanilla CSS + CSS Variables | Existing `_group.css` token system, zero framework lock-in |
| PDF Rendering | `pdfjs-dist` (Mozilla) | Industry standard; renders real PDF pages in-browser canvas |
| Markdown Rendering | `react-markdown` + `remark-gfm` | Full GFM support; custom component overrides for Obsidian-style headings |
| State Management | Zustand | Lightweight, no boilerplate; stores: book, settings, UI, chat |
| Fonts | Inter + JetBrains Mono | Locked in `_group.css` |
| Python Backend | Python 3.11 sidecar | PDF/AI logic; bundled by PyInstaller |
| PDF Engine | PyMuPDF (fitz) | Text + TOC extraction |
| AI APIs | Gemini, OpenAI, Claude, Ollama | Multi-provider unified interface |
| Templating | Jinja2 | Markdown generation |
| Secret Storage | keyring (OS keychain) | API keys never hit disk |
| Packaging | Tauri bundler → `.msi` | Self-contained Windows installer |

---

## 🎨 Design System

### Design Philosophy
BookSage Studio mirrors the Obsidian visual language: deep dark backgrounds, crimson/red heading accents (matching the Obsidian screenshots provided), clean inter-panel borders, and a monospace log area. The teal `#009688` accent is used for primary actions and interactive states, while red-family colors carry heading hierarchy in reading views.

### Extended Color Tokens

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `--bs-bg` | `#1a1a1a` | `#f4f4f5` | Root window |
| `--bs-panel` | `#242424` | `#e8e8ea` | Sidebars, toolbars |
| `--bs-surface` | `#2e2e2e` | `#dddde0` | Cards, inputs |
| `--bs-accent` | `#009688` | `#00796b` | CTA buttons, active states |
| `--bs-heading` | `#e05252` | `#c0392b` | H1/H2 in reader/notes (Obsidian-matched) |
| `--bs-code-bg` | `#2a1a1a` | `#fde8e8` | Inline code background |
| `--bs-code-text` | `#e05252` | `#c0392b` | Inline code text |
| `--bs-callout-border` | `#4a7a9b` | `#2980b9` | Obsidian callout left-border |
| `--bs-nav-icon` | `#8a8a8a` | `#777` | Icon sidebar inactive |
| `--bs-nav-active` | `#009688` | `#00796b` | Icon sidebar active view |
| `--bs-copilot-bg` | `#1e2a2a` | `#e8f5f3` | Copilot popup background |
| `--bs-done` | `#4caf50` | `#388e3c` | Success badges |
| `--bs-process` | `#ff9800` | `#e65100` | Processing spinner |
| `--bs-error` | `#f44336` | `#c62828` | Error states |

---

## 📁 Project Folder Structure (v3)

```
BookSage/
├── .agents/                      ← AG Kit
├── GUI/                          ← Reference mockup files
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/main.rs               ← IPC + sidecar launch
├── src/
│   ├── main.tsx
│   ├── App.tsx                   ← Router: view switching via icon sidebar
│   ├── index.css                 ← All CSS tokens (extended _group.css)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── IconSidebar.tsx   ← VS Code-style nav rail
│   │   │   ├── TitleBar.tsx
│   │   │   └── StatusBar.tsx
│   │   ├── views/
│   │   │   ├── LibraryView.tsx   ← NEW: book grid / home screen
│   │   │   ├── BookReader.tsx    ← NEW: PDF page renderer
│   │   │   ├── NotesViewer.tsx   ← NEW: Obsidian-style Markdown viewer
│   │   │   ├── PipelineView.tsx  ← Renamed from MainWindow (chapter list + export)
│   │   │   └── AIChatView.tsx    ← NEW: Full AI chat session view
│   │   ├── reader/
│   │   │   ├── PDFCanvas.tsx     ← pdfjs-dist page renderer
│   │   │   ├── PageControls.tsx  ← prev/next/jump-to-page
│   │   │   └── WordHighlighter.tsx ← word-by-word navigation
│   │   ├── notes/
│   │   │   ├── MarkdownRenderer.tsx ← react-markdown with Obsidian CSS
│   │   │   ├── ChapterNav.tsx    ← left chapter list for notes view
│   │   │   └── CalloutBlock.tsx  ← Obsidian [!tip] [!note] callouts
│   │   ├── copilot/
│   │   │   ├── CopilotPopup.tsx  ← Floating panel on text selection
│   │   │   ├── CopilotSidebar.tsx ← Pinned right-side chat panel
│   │   │   ├── ContextMenu.tsx   ← Right-click menu with Copilot submenu
│   │   │   ├── ModelSelector.tsx ← Provider + model dropdown
│   │   │   └── QuickActions.tsx  ← Summarize/Simplify/Explain/etc.
│   │   ├── pipeline/
│   │   │   ├── ChapterList.tsx   ← Chapter list with status badges
│   │   │   ├── PreviewTabs.tsx   ← Raw Text / AI Output / Markdown Source
│   │   │   ├── ExportPanel.tsx   ← Right panel: progress, charts, log
│   │   │   ├── DonutChart.tsx
│   │   │   ├── ActivityBarChart.tsx
│   │   │   ├── ToolbarButton.tsx
│   │   │   └── StatusBadge.tsx
│   │   └── settings/
│   │       └── SettingsDialog.tsx
│   ├── stores/
│   │   ├── bookStore.ts          ← Current book, chapters, processing state
│   │   ├── settingsStore.ts      ← API keys, model, output folder
│   │   ├── uiStore.ts            ← Active view, theme, sidebar state
│   │   └── chatStore.ts          ← Chat history, active context
│   ├── hooks/
│   │   ├── useTextSelection.ts   ← Detects text selection, triggers Copilot
│   │   ├── usePDF.ts             ← pdfjs-dist wrapper
│   │   └── useTauri.ts           ← Typed invoke() wrappers
│   └── lib/
│       └── tauri.ts              ← All Tauri command definitions
├── python/
│   ├── requirements.txt
│   ├── main.py                   ← JSON-in/JSON-out CLI
│   ├── pdf_handler.py
│   ├── chapter_splitter.py
│   ├── ai_extractor.py           ← Lesson extraction
│   ├── ai_chat.py                ← NEW: session chat with book context
│   ├── markdown_gen.py
│   ├── file_manager.py
│   ├── config_manager.py
│   └── templates/
│       └── chapter.md.j2
├── BookSage_Projects/            ← Runtime output (gitignored)
├── .gitignore
├── README.md
├── booksage-plan.md
└── RoadMap.md
```

---

## 🤖 AI Copilot — Interaction Design

### Text Selection → Copilot Flow

```
User selects text in BookReader or NotesViewer
    ↓
mouseup event fires → useTextSelection hook captures:
    - selected text string
    - bounding rect of selection (x, y, width, height)
    ↓
Small "Copilot" pill button appears just above selection
    ↓
User right-clicks → Custom ContextMenu renders:
    ┌─────────────────────────────────┐
    │  Add selection to chat context  │
    │  Quick Ask                      │
    │  ─────────────────────────────  │
    │  Summarize                      │
    │  Simplify                       │
    │  Explain like I am 5            │
    │  Make shorter                   │
    │  Make longer                    │
    │  Fix grammar and spelling       │
    │  Translate to...                │
    └─────────────────────────────────┘
    ↓
Clicking an action opens CopilotPopup anchored to selection:
    ┌──────────────────────────────────┐
    │ [drag handle]              [✕]  │
    │ Ask a question...                │
    │ ┌────────────────────────┐  [→] │
    │ │ gemini-2.0-flash  ⬇  │      │
    │ └────────────────────────┘      │
    │ ● Note context included         │
    └──────────────────────────────────┘
```

### Model Selector Dropdown (matches screenshot exactly)

```
gemini-2.0-flash          ● (green = connected)
gemini-1.5-pro            ● (green)
─────────────────────────────
gpt-4o                    ○ Needs API key
gpt-4o-mini               ○ Needs API key
─────────────────────────────
claude-sonnet-4            ○ Needs API key
─────────────────────────────
Ollama (local)            ● (if running)
```

---

## 🤖 AI JSON Schema (unchanged from v2)

```json
{
  "chapter_title": "Law 3: Conceal Your Intentions",
  "chapter_number": 3,
  "summary": "Narrative recap...",
  "teachings": [{ "technique": "Use Decoys", "explanation": "..." }],
  "core_lesson": "The single most actionable insight.",
  "implementation_steps": ["Step 1...", "Step 2..."],
  "supporting_quotes": ["Direct quote from text..."],
  "obsidian_tags": ["#strategy", "#power", "#deception"],
  "difficulty_to_implement": "Medium"
}
```

---

## 🚀 Development Phases (v3 Updated)

### Phase 0 — Scaffold
- [ ] Install: Rust, Node 20, Python 3.11, Tauri CLI
- [ ] `npm create tauri-app@latest` → choose React TypeScript template, identifier: `com.booksage.studio`
- [ ] Extend `_group.css` with v3 tokens (`--bs-heading`, `--bs-code-bg`, `--bs-nav-*`, `--bs-copilot-*`)
- [ ] Build `IconSidebar.tsx`: 5 icons, active state, view switching
- [ ] Build `App.tsx`: view router controlled by `uiStore.activeView`
- [ ] Set up Zustand stores: `bookStore`, `settingsStore`, `uiStore`, `chatStore`
- **Verify:** Window opens with icon sidebar; clicking icons switches view placeholder

### Phase 1 — PDF Engine
- [ ] `pdf_handler.py`: `extract_text()` + `extract_toc()` via PyMuPDF
- [ ] `chapter_splitter.py`: TOC-based split + regex fallback
- [ ] `main.py`: JSON-in/JSON-out CLI
- **Verify:** `python main.py '{"cmd":"extract","pdf":"path"}'` produces chapter `.txt` files

### Phase 2 — AI Extractor
- [ ] Abstract `AIClient` + `GeminiClient`, `OpenAIClient`, `ClaudeClient`, `OllamaClient`
- [ ] Structured JSON output + schema validation + one-shot retry
- [ ] `ai_chat.py`: session-based chat with book context injection
- **Verify:** Single chapter → valid JSON; chat session returns contextual responses

### Phase 3 — Pipeline View (Port from mockup)
- [ ] Port `ChapterList`, `PreviewTabs`, `ExportPanel` from GUI mockup
- [ ] Wire Tauri `invoke()` to PDF + AI backend
- [ ] Live status badges, progress bar, donut chart, export log
- **Verify:** Load PDF → chapter list populates → AI processes → center panel shows lesson

### Phase 4 — Book Reader View
- [ ] `PDFCanvas.tsx`: render PDF pages using `pdfjs-dist`
- [ ] `PageControls.tsx`: prev/next, page number input, zoom
- [ ] `WordHighlighter.tsx`: word-by-word mode with keyboard nav
- [ ] `useTextSelection.ts`: capture selection + bounding rect
- **Verify:** Open PDF → pages render → text selectable → selection detected

### Phase 5 — Notes Viewer
- [ ] `MarkdownRenderer.tsx`: `react-markdown` with Obsidian-matching CSS
  - H1/H2 in `--bs-heading` red
  - Inline code: `--bs-code-bg` / `--bs-code-text` red pill style
  - Callout blocks: `[!tip]`, `[!note]`, `[!warning]` with colored left borders
  - Tables, task lists (GFM) via `remark-gfm`
- [ ] `ChapterNav.tsx`: left panel chapter list for jumping between notes
- [ ] Chapter-to-chapter navigation with keyboard shortcuts
- **Verify:** Processed chapter `.md` renders with full Obsidian visual grammar

### Phase 6 — AI Copilot Layer
- [ ] `ContextMenu.tsx`: custom right-click menu with Copilot submenu
- [ ] `CopilotPopup.tsx`: floating panel anchored to text selection
  - Drag handle, close button, text input, model selector, send button
  - Quick action buttons pre-filled with selected text
- [ ] `ModelSelector.tsx`: dropdown with all providers + availability dots
- [ ] `CopilotSidebar.tsx`: pinned right panel for extended chat sessions
- [ ] Wire to `ai_chat.py` via Tauri; inject selected text as context
- **Verify:** Select text in NotesViewer → right-click → Summarize → response appears in popup

### Phase 7 — Library View
- [ ] `LibraryView.tsx`: grid of all processed books
  - Book card: auto-generated cover (first page thumbnail), title, chapter count, progress %
  - "Open Book" → switches to BookReader; "View Notes" → switches to NotesViewer
  - Search bar to filter library
- [ ] Persist library index in `BookSage_Projects/library.json`
- **Verify:** Process two books → library shows both cards → clicking opens correct view

### Phase 8 — Settings, Error Handling, Optional Export
- [ ] Full Settings dialog: AI Provider, Prompt Template, Output Schema, Chapter Detection tabs
- [ ] OS keychain storage via `keyring`; "Test Connection" validates live API
- [ ] Retry per chapter + "Retry All Failed"
- [ ] **Optional Obsidian export** retained as a "File → Export to Obsidian Vault" menu item
- **Verify:** API key saved to keychain; failed chapter retries; export creates `.md` in vault folder

### Phase 9 — Packaging
- [ ] Bundle Python sidecar with PyInstaller → `booksage_engine.exe`
- [ ] Tauri NSIS/WiX installer config for Windows
- [ ] Test on clean Windows VM (no Python, no Node)
- **Verify:** `.msi` installs → app opens → full pipeline works

---

## ⚠️ Pitfalls & Mitigations

| Challenge | Mitigation |
|-----------|------------|
| Scanned PDF (image-only) | Detect zero text extraction → error: "This PDF is scanned. Use an OCR tool first." |
| pdfjs-dist large bundle | Code-split; load only in BookReader view |
| Copilot popup positioning near screen edge | Flip popup above/below selection based on available viewport space |
| Chat context too large (long book) | Inject only active chapter + summary of others; not full book |
| PDF has no TOC | Regex fallback; Manual Split Mode drag handles |
| API rate limits | Exponential backoff; configurable inter-request delay |
| Export folder conflict | Overwrite / Skip / Timestamped subfolder dialog |

---

## 🔁 Git Branching Strategy

```
main   ← Tagged releases
  └── dev
       ├── phase/0-scaffold
       ├── phase/1-pdf-engine
       ├── phase/2-ai-extractor
       ├── phase/3-pipeline-view
       ├── phase/4-book-reader
       ├── phase/5-notes-viewer
       ├── phase/6-copilot
       ├── phase/7-library
       ├── phase/8-settings
       └── phase/9-packaging
```

---

## 📊 MVP Definition of Done

- [ ] Icon sidebar switches between all 5 views
- [ ] PDF loads and renders page-by-page in BookReader
- [ ] AI extracts all chapters; notes render with full Obsidian visual grammar
- [ ] Text selection in any view triggers Copilot context menu
- [ ] CopilotPopup appears, sends query, displays response
- [ ] Library view shows all processed books with progress
- [ ] App installs from `.msi` on clean Windows machine
- [ ] Zero API keys stored in plaintext

---

*This is a living document. Update after each phase merge to `dev`.*

---

## 📱 Future Work — Mobile Platform

> **Planned after Windows desktop app reaches v1.0 (Phase 9 complete).**

BookSage will be rebuilt as a native mobile app for iOS and Android. The core AI pipeline (Python sidecar → JSON schema) is already platform-agnostic, so the primary work is a mobile-first UI layer.

### Target Platforms
- **iOS** — iPhone + iPad
- **Android** — phones + tablets

### Mobile Tech Stack (Planned)

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | React Native + Expo | Maximum code-sharing with existing React components |
| Navigation | React Navigation v7 | Stack + Tab navigator |
| PDF rendering | `react-native-pdf` | Native PDF rendering |
| Markdown | `react-native-markdown-display` | Obsidian-style rendering on mobile |
| AI backend | Hosted Python API (FastAPI) | Sidecar won't work on mobile — requires a cloud endpoint |
| Local storage | SQLite via `expo-sqlite` | Local-first, syncs to cloud optionally |
| Auth | Sign in with Google / Apple ID | Required only for cloud sync |
| Cloud sync | Supabase (Postgres + Auth + Storage) | Optional; users can stay fully offline |

### Mobile-Specific Features
- Touch reader: swipe left/right to turn pages, pinch-to-zoom
- Floating Copilot: tap-and-hold any text → Copilot overlay (replaces desktop right-click)
- Offline-first: all downloaded books and processed notes available without internet
- iCloud / Google Drive sync for notes and library across devices
- Share extension: "Share PDF to BookSage" from the iOS Files app
- Haptic feedback on chapter completion and AI response received

### Mobile Development Phases

| Phase | Goal |
|-------|------|
| M0 | React Native + Expo scaffold, CSS token port to StyleSheet |
| M1 | PDF viewer + swipe-based book reader |
| M2 | Notes viewer (Markdown + Obsidian styling on mobile) |
| M3 | AI pipeline via hosted FastAPI (same logic as Python sidecar) |
| M4 | Copilot tap-to-select overlay + quick actions |
| M5 | Library screen + optional cloud sync |
| M6 | App Store + Google Play submission |

### Architecture Note for Mobile
Mobile requires a **hosted AI backend** — not a bundled sidecar:
- FastAPI server wrapping `ai_extractor.py` + `ai_chat.py` (reuse the same Python logic)
- User accounts (auth) to associate books and notes with a user ID
- Supabase recommended for DB + Auth + file storage in one service

> 📌 **This milestone begins only after Windows Phase 9 is complete and the desktop app is stable.**