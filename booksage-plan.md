# BookSage — Project Plan (v3)

## Goal
Build BookSage Studio: a self-contained Windows desktop app where users read books, view AI-generated notes, and chat with an AI copilot — all without leaving the app.

## Tasks

- [ ] **Phase 0 — Scaffold** → Verify: window opens, icon sidebar switches 5 view placeholders
  - [ ] Init Tauri v2 + React 18 + TypeScript project
  - [ ] Extend CSS token system with v3 additions (heading red, copilot, nav tokens)
  - [ ] Build `IconSidebar.tsx` with 5 view icons
  - [ ] Set up Zustand stores: `bookStore`, `settingsStore`, `uiStore`, `chatStore`
  - [ ] Configure Python sidecar + `requirements.txt`

- [ ] **Phase 1 — PDF Engine** → Verify: CLI splits book into chapter `.txt` files
  - [ ] `pdf_handler.py`: text + TOC via PyMuPDF
  - [ ] `chapter_splitter.py`: TOC + regex fallback
  - [ ] `main.py`: JSON-in/JSON-out CLI entry point

- [ ] **Phase 2 — AI Extractor** → Verify: chapter `.txt` → valid JSON; chat returns contextual response
  - [ ] `AIClient` base + `GeminiClient`, `OpenAIClient`, `ClaudeClient`, `OllamaClient`
  - [ ] JSON schema validation + retry
  - [ ] `ai_chat.py`: session-based chat with chapter context injection

- [ ] **Phase 3 — Pipeline View** → Verify: PDF loads → chapters appear → AI processes → lesson shown
  - [ ] Port `ChapterList`, `PreviewTabs`, `ExportPanel` from `GUI/` mockup
  - [ ] Wire all Tauri `invoke()` calls to sidecar
  - [ ] Live status badges, progress bar, donut chart, log

- [ ] **Phase 4 — Book Reader** → Verify: PDF pages render; text selection detected
  - [ ] `PDFCanvas.tsx` using `pdfjs-dist`
  - [ ] `PageControls.tsx`: prev/next/jump/zoom
  - [ ] `useTextSelection.ts`: captures selection string + screen position

- [ ] **Phase 5 — Notes Viewer** → Verify: chapter `.md` renders with Obsidian visual grammar
  - [ ] `MarkdownRenderer.tsx` with `react-markdown` + `remark-gfm`
  - [ ] Custom CSS: red headings, red inline code pills, callout blocks
  - [ ] `ChapterNav.tsx`: left panel chapter jumping

- [ ] **Phase 6 — AI Copilot** → Verify: select text → right-click → Summarize → popup response appears
  - [ ] `ContextMenu.tsx`: right-click menu with Copilot submenu
  - [ ] `CopilotPopup.tsx`: floating panel anchored to selection
  - [ ] `ModelSelector.tsx`: all providers + availability dots
  - [ ] `CopilotSidebar.tsx`: pinned chat panel for deep sessions
  - [ ] Wire to `ai_chat.py`

- [ ] **Phase 7 — Library View** → Verify: two processed books show as cards; clicking opens correct view
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
