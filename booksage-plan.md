# BookSage — Project Plan (v3)

## Goal
Build BookSage Studio: a self-contained Windows desktop app where users read books, view AI-generated notes, and chat with an AI copilot — all without leaving the app.

## Tasks

- [x] **Phase 0 — Scaffold** → Verify: window opens, icon sidebar switches 5 view placeholders
  - [x] Init Tauri v2 + React 18 + TypeScript project
  - [x] Extend CSS token system with v3 additions (heading red, copilot, nav tokens)
  - [x] Build `IconSidebar.tsx` with 5 view icons
  - [x] Set up Zustand stores: `bookStore`, `settingsStore`, `uiStore`, `chatStore`
  - [x] Configure Python sidecar + `requirements.txt`

- [x] **Phase 1 — PDF Engine** → Verify: CLI splits book into chapter `.txt` files
  - [x] `pdf_handler.py`: text + TOC via PyMuPDF
  - [x] `chapter_splitter.py`: TOC + regex fallback
  - [x] `main.py`: JSON-in/JSON-out CLI entry point

- [x] **Phase 2 — AI Extractor** → Verify: chapter `.txt` → valid JSON; chat returns contextual response
  - [x] `AIClient` base + `GeminiClient`, `OpenAIClient`, `ClaudeClient`, `OllamaClient`
  - [x] JSON schema validation + retry
  - [x] `ai_chat.py`: session-based chat with chapter context injection

- [x] **Phase 3 — Pipeline View** → Verify: PDF loads → chapters appear → AI processes → lesson shown
  - [x] Port `ChapterList`, `PreviewTabs`, `ExportPanel` from `GUI/` mockup
  - [x] Wire all Tauri `invoke()` calls to sidecar
  - [x] Live status badges, progress bar, donut chart, log

- [x] **Phase 4 — Book Reader** → Verify: PDF pages render; text selection detected
  - [x] `PDFCanvas.tsx` using `pdfjs-dist`
  - [x] `PageControls.tsx`: prev/next/jump/zoom
  - [x] `useTextSelection.ts`: captures selection string + screen position

- [x] **Phase 4.5 — Reader Polish & Feature Completeness** → Verify: TOC sidebar, progress bar, highlights persist, Ctrl+F search works
  - **🔴 CORE — Navigation & Reading**
  - [x] Keyboard shortcuts — Arrow keys, Space (next page), PgUp/PgDn (verify all wired)
  - [x] TOC sidebar — clickable chapter list inside BookReader, jumps to correct page
  - [x] Remember last read position — save/restore current page to SQLite `books.last_page`
  - [x] Reading progress bar — `currentPage / totalPages` % bar fixed at bottom of reader
  - [x] Two-page spread view — side-by-side page mode toggle in `PageControls`
  - **🔴 CORE — Annotations & Highlights**
  - [x] Multi-color text highlighting — 4 color choices (Yellow, Green, Blue, Pink)
  - [x] Highlight persistence — new `highlights` SQLite table; reload on every page draw
  - [x] Export annotations to Markdown — "Export Highlights" generates a grouped `.md` file
  - **🔴 CORE — Search**
  - [x] `Ctrl+F` full-text search within PDF — uses `pdfjs-dist` `getTextContent()`
  - [x] Navigate search matches — Up/Down arrows, match count indicator ("3 of 12")
  - **🔴 CORE — AI Stubs (wired in Phase 6)**
  - [x] Select text → AI Explain/Summarize stub pill above selection
  - [x] Select text → Simplify language stub pill
  - **🔴 CORE — Layout**
  - [x] Split view (Book + Notes side-by-side) — draggable divider, wire toolbar toggle
  - **🟡 HIGH — Display & Themes**
  - [x] Sepia / Warm tone mode — CSS filter toggle in reader toolbar
  - [x] Invert PDF colors (night mode) — CSS invert filter toggle
  - **🟡 HIGH — Navigation**
  - [x] Thumbnail strip / page preview panel — collapsible left panel, click to jump
  - [x] Distraction-free / Focus mode — hide sidebar/toolbar, toggle with F11
  - [x] Bookmarks — star any page, save to `bookmarks` SQLite table
  - **🟡 HIGH — Annotations**
  - [x] Underline / Strikethrough markup modes
  - [x] Sticky note / Pop-up comment on any highlight
  - [x] Annotation sidebar — all highlights listed by page, click to jump
  - [x] Search within annotations sidebar
  - **🟡 HIGH — AI Stubs**
  - [x] Select text → Translate stub
  - [ ] "Story So Far" AI recap button on book open (if `last_page > 1`)
  - [ ] Inline word definition on `Ctrl+click`
  - **🟡 HIGH — Stats**
  - [x] Reading time estimate (`"~X min left"`) in status bar
  - [x] Pages read today / this week tracker in SQLite
  - [x] TTS stub button in toolbar (wire to `SpeechSynthesis`)
  - **🟢 NICE — Power-user extras**
  - [x] True black / OLED mode CSS variant
  - [x] Custom background color picker in display settings
  - [ ] Minimap scroll indicator in scrollbar gutter
  - [x] Reading streak counter on Library home screen
  - [x] Time spent reading per book (SQLite session tracking)
  - [ ] Vim-style J/K navigation (optional toggle)
  - [x] Customizable keyboard shortcuts settings tab
  - [x] Adjustable TTS speed slider (0.5× – 2.5×)
  - [x] Freehand annotation / draw on canvas
  - **Database migrations**
  - [x] `ALTER TABLE books ADD COLUMN last_page INTEGER DEFAULT 1`
  - [x] `ALTER TABLE books ADD COLUMN reading_time_secs INTEGER DEFAULT 0`
  - [x] `ALTER TABLE books ADD COLUMN pages_read_total INTEGER DEFAULT 0`
  - [x] Create `highlights` table (id, book_id, page_num, color, rects, text, note, created_at)
  - [x] Create `bookmarks` table (id, book_id, page_num, label, created_at)

- [x] **Phase 5 — Notes Viewer** → Verify: chapter `.md` renders with Obsidian visual grammar
  - [x] `MarkdownRenderer.tsx` with `react-markdown` + `remark-gfm`
  - [x] Custom CSS: red headings, red inline code pills, callout blocks
  - [x] `ChapterNav.tsx`: left panel chapter jumping

- [x] **Phase 6 — AI Copilot** → Verify: select text → right-click → Summarize → popup response appears
  - [x] `ContextMenu.tsx`: right-click menu with Copilot submenu
  - [x] `CopilotPopup.tsx`: floating panel anchored to selection
  - [x] `ModelSelector.tsx`: all providers + availability dots
  - [x] `CopilotSidebar.tsx`: pinned chat panel for deep sessions
  - [x] Wire to `ai_chat.py`

- [ ] **Phase 7 — Library View** → Verify: two processed books show as cards; clicking opens correct view
  - [ ] `LibraryView.tsx`: book grid with thumbnail, title, progress
  - [ ] Library index persisted in `BookSage_Projects/library.json`
  - [ ] `LibraryView.tsx`: book grid with thumbnail, title, progress
  - [ ] Library index persisted in `BookSage_Projects/library.json`

- [ ] **Phase 8 — Settings & Polish** → Verify: API key saved to OS keychain; failed chapters retry
  - [ ] Full Settings dialog (4 tabs)
  - [ ] `keyring` secret storage + Test Connection
  - [ ] Retry per chapter + Retry All Failed
  - [ ] Optional Obsidian export via File menu

- [ ] **Phase 9 — Packaging** → Verify: `.msi` installs, app runs on clean Windows VM
  - [ ] PyInstaller sidecar bundle
  - [ ] Tauri NSIS/WiX installer config

## Done When
- [ ] Icon sidebar switches all 5 views
- [ ] Full pipeline: PDF → AI extraction → notes rendered in-app
- [ ] Copilot popup works on text selection in Reader and Notes
- [ ] Library view tracks all processed books
- [ ] `.msi` installer works on clean Windows machine
- [ ] API keys never stored in plaintext

## Notes
- Stack: Tauri v2 + React 18 + TypeScript + Python 3.11 sidecar
- PDF rendering: `pdfjs-dist` (JS, no server needed)
- Markdown rendering: `react-markdown` + `remark-gfm` + Obsidian-style CSS
- Obsidian export is OPTIONAL, not required — BookSage is now the destination
- Branch per phase: `phase/0-scaffold` through `phase/9-packaging`
- See `RoadMap.md` for full specs, JSON schema, copilot flow, and folder structure
