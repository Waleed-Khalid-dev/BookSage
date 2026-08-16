---
type: project
created: 2026-07-29
updated: 2026-07-29
---

# BookSage Project State

## What BookSage Is
BookSage Studio is a self-contained Windows desktop reading and learning app. Users drop in a PDF book, AI extracts chapter-by-chapter structured notes, and users can read the book, view notes, and chat with an AI copilot — all without leaving the app. Obsidian export is an optional bonus, not the core.

## Repository
- GitHub: Public, MIT license
- Local path: `d:\[Project]\BookSage`
- Git status: 3 commits on `main` as of 2026-07-29
  1. `chore: initial commit — project scaffold + roadmap + GUI assets`
  2. `docs: expand RoadMap.md to v2.0 — full technical blueprint + project plan`
  3. `docs: v3 pivot — BookSage Studio (reader + notes viewer + AI copilot in-app)`
- Branching: `main ← dev ← phase/X-slug`

## Tech Stack (locked)
| Layer | Choice |
|-------|--------|
| Desktop shell | Tauri v2 |
| Frontend | React 18 + TypeScript |
| Styling | Vanilla CSS variables (`_group.css` tokens) |
| PDF rendering | pdfjs-dist |
| Markdown rendering | react-markdown + remark-gfm |
| State | Zustand (bookStore, settingsStore, uiStore, chatStore) |
| Python backend | Python 3.11 sidecar (bundled by PyInstaller) |
| PDF engine | PyMuPDF (fitz) |
| AI providers | Gemini (default), OpenAI, Claude, Ollama |
| Secrets | OS keychain via `keyring` |
| Packaging | Tauri NSIS/WiX → `.msi` |

## Five App Views
1. Library — book grid, import, search
2. Book Reader — PDF canvas, page nav, copilot on selection
3. Notes Viewer — Obsidian-style Markdown rendering
4. Pipeline — chapter split + AI extraction + export (original MainWindow)
5. AI Chat — full session with book context

## Design System (CSS tokens)
- `--bs-bg: #1a1a1a` · `--bs-panel: #242424` · `--bs-surface: #2e2e2e`
- `--bs-accent: #009688` (teal) — primary CTA, active states
- `--bs-heading: #e05252` (red) — H1/H2 in reader/notes (Obsidian-matched)
- `--bs-code-bg: #2a1a1a` · `--bs-code-text: #e05252` — inline code pills
- `--bs-copilot-bg: #1e2a2a` · `--bs-copilot-border: #2a4a46`
- `--bs-nav-icon: #8a8a8a` · `--bs-nav-active: #009688`
- Fonts: Inter (body) + JetBrains Mono (code, logs)

## AI Copilot Pattern
- Select text → "✦ Copilot" pill appears above selection
- Right-click → custom ContextMenu with Copilot submenu
- Actions: Summarize, Simplify, Explain like I am 5, Make shorter/longer, Fix grammar, Translate
- Floating CopilotPopup: drag handle, selected text preview, quick action pills, free-form input, model selector dropdown
- Model selector shows: green dot (connected) vs grey "Needs API key"

## AI JSON Output Schema
```json
{
  "chapter_title": "...", "chapter_number": 3,
  "summary": "...", "teachings": [{"technique":"...","explanation":"..."}],
  "core_lesson": "...", "implementation_steps": ["..."],
  "supporting_quotes": ["..."], "obsidian_tags": ["#strategy"],
  "difficulty_to_implement": "Medium"
}
```

## GUI Mockup Files (Replit-generated, in GUI/ folder)
| File | Status | What It Is |
|------|--------|------------|
| `MainWindow.tsx` | ✅ Built | Pipeline view (chapter list + 3-tab center + export panel) |
| `SettingsDialog.tsx` | ✅ Built | Settings modal with 4 tabs |
| `AppShell.tsx` | ✅ Built | Full app shell: icon nav + Library/Reader/Notes/Chat views |
| `CopilotPopup.tsx` | ✅ Built | Floating copilot popup with model selector + quick actions |
| `ContextMenu.tsx` | ✅ Built | Right-click menu with Copilot submenu + Translate sub-menu |
| Library View enhanced | ⏳ Remaining | Needs richer card design for Replit tomorrow |
| Book Reader enhanced | ⏳ Remaining | Needs PDF canvas + reading info panel for Replit tomorrow |

## Development Phase Status
| Phase | Name | Status |
|-------|------|--------|
| 0 | Scaffold (Tauri + React + Python) | ✅ Done |
| 1 | PDF Engine | ✅ Done |
| 2 | AI Extractor | ✅ Done |
| 3 | Pipeline View | ✅ Done |
| 3.5 | SQLite Persistence | ✅ Done |
| 4 | Book Reader | ✅ Done |
| 4.5 | Reader Polish | ✅ Done |
| 5 | Notes Viewer | ✅ Done |
| 6 | AI Copilot | ✅ Done |
| 7 | Library View | ⏳ Not started |
| 8 | Settings & Polish | ⏳ Not started |
| 9 | Packaging | ⏳ Not started |

**Current status: Phase 6 complete (AI Copilot). Next action = Phase 7 (Library View).**

### Session 2026-08-07 Notes
- Implemented global Keyboard Shortcuts with persistent Zustand store.
- Added "Shortcuts" Settings modal for assigning custom bindings (TTS, highlight, drawing, undo/redo).
- Updated Unified Undo/Redo stack to support Highlights, Underlines, and Strikethroughs smoothly.

### Session 2026-08-12 Notes (Phase 6 IPC Bridge Polish)
- Resolved Windows CLI character limit crash by upgrading the React-to-Python IPC bridge.
- `invokePython` now securely writes large AI payloads (e.g., 5-page text selections) to temporary files in `appLocalDataDir`.
- `main.py` updated to read `--file` arguments, bypassing the 32k character limit and URL encoding overhead.
- Granted Tauri v2 `@tauri-apps/plugin-fs` strict permissions (`fs:allow-write-text-file`, `fs:allow-mkdir`) in `default.json`.
- Scrubbed legacy `apiKey` references from `PipelineView.tsx`, `AIChatView.tsx`, and `bookStore.ts` to prevent UI crashes.

### Session 2026-08-10 Notes (Phase 6 AI Copilot Completed)
- Implemented `CopilotOrb` globally available across views for quick access.
- Implemented `useSpeechRecognition` hook for voice input support in the chat.
- Checked off Batch D in the task list and updated `copilot-features.md`.
- Completed AI Copilot Phase 6 integration (Sidebar, Chat View, Context Menu, Popup, Voice).
- Fixed Context Menu visual bug where missing API keys didn't properly gray out submenus.
- Fixed `CopilotSidebar` crash when opened without an API key (due to legacy key variable removal).
- Implemented "Add to Chat Context" to automatically paste selected text directly into the chat input box.

### Session 2026-08-07 Notes (Phase 5)
- **Completed Phase 5 (Notes Viewer):**
  - Built an interactive, Obsidian-inspired UI rendered dynamically from AI-extracted JSON.
  - Implemented 'Key Insights' (global list) and 'Flashcard' (active recall) view modes.
  - Resolved Tauri FS ACL errors by using `invokePython` to fetch local files securely.
  - Handled varying JSON array-wrapping edge cases for robust parsing.
  - Persisted user notes, studied status, and implementation steps progress to SQLite.

### Session 2026-08-07 Notes
- Added CSS transform-based zoom stability for highlighting and TTS
- Implemented persistent customizable text selection color and opacity
- Refined annotation toolbar: added underline and strikethrough color picker
- Fixed strikethrough alignment to center on lowercase letters
- Separated layer blending to fix opacity of lines vs highlight blocks
- Refactored AudioToolbar to use DOM-independent tracking offsets
- Re-architected TTSHighlightLayer scaling to prevent CSS transition fighting
- Updated reader_feature_research to mark completed UI/UX improvements

## Key Files
- `RoadMap.md` — v3, full technical blueprint
- `booksage-plan.md` — v3, 9-phase task list
- `README.md` — public-facing description
- `GUI/` — all Replit mockup TSX + screenshots
- `.agents/memory/` — this memory system
- `C:\Users\Ace\.gemini\antigravity\brain\81b4e0a9-.../replit-ui-prompt.md` — Replit prompt artifact

### Session 2026-07-30 Notes
- **Built Phase 0 & Phase 1:** Scaffolding complete (Tauri v2 + React 18) and Python sidecar PDF engine built (`pdf_handler.py`, `chapter_splitter.py`, `main.py`).
- **Verified:** PDF split by chapters using PyMuPDF successfully outputs to `Documents/BookSage_Projects`. React frontend builds cleanly.
- **Built Phase 2 (AI Extractor):** Developed AI extractor backend with `GeminiClient` and strict JSON schema generation with one-shot retry logic. Added session-based chat with context injection (`ai_chat.py`).
- **Verified:** `gemini-flash-latest` accurately extracts JSON chapter lessons and bypasses restrictive API quotas.
- **Built Phase 3 (Pipeline View):** Configured Tauri `shell:allow-execute` capabilities. Implemented `pythonService.ts` for sidecar IPC and `bookStore.ts` for state management. Refactored Tailwind-based `MainWindow.tsx` to Vanilla CSS (`PipelineView.tsx`, `PipelineView.css`, `DonutChart.tsx`, `ActivityBarChart.tsx`) ensuring strict compliance with the no-Tailwind rule.
- **Next:** Phase 4 — Book Reader.

### Session 2026-07-31 Notes
- **Debugged Phase 3 Pipeline:** Identified cause of immediate extraction failures (empty API key).
- **Refactoring UI:** Reverting PipelineView back to the exact Tailwind-based GUI mockup to match RoadMap.md specifications.
- **Fixed Encoding & UI Accessibility:** Replaced `btoa` with Unicode-safe encoder (`encodeURIComponent`) in `pythonService.ts` to fix extraction crashes on special characters. Fixed light/dark mode CSS bugs in `PipelineView` (chapter titles & dropdown readability).
- **Added Robustness & Persistence:** Implemented "Retry Failed" feature. Wrapped `bookStore.ts` with Zustand `persist` middleware to save API Key and Model choice to localStorage across app restarts.
- **Multi-chapter selection & Markdown Rendering Fix:** Added multi-select retry logic. Fixed UI and backend Python script to properly render `Quotes`, `Difficulty to Implement`, and `Tags` missing from the markdown export.
- **Decision:** Use SQLite (Phase 3.5) for proper session persistence instead of localStorage to support production-grade long-term storage and the upcoming Library View.
- **Next:** Phase 3.5 — SQLite Persistence Layer or Phase 4 — Book Reader.

### Session 2026-08-01 Notes
- **Storage & Build Resolution:** Resolved a massive disk space crash on the C: drive caused by Rust compiler artifacts. Moved the Windows Page File to D: and restored the Rust environment to maintain the build system.
- **Completed Phase 3.5 (SQLite Persistence):** 
  - Integrated `tauri-plugin-sql` and successfully created `booksage.db` in the AppData directory.
  - Implemented `dbService.ts` to perform CRUD operations (upsertBook, upsertChapter).
  - Wired `bookStore.ts` to save and resume extraction state into SQLite, completely bypassing localStorage for chapter data.
  - Fixed a Tauri capabilities error by explicitly enabling `sql:allow-execute` in `default.json`.
- **Verified:** Extracted 34 chapters, closed the app midway, and confirmed the SQLite DB perfectly saved the `done` and `process` state for future resumption.
- **Roadmap Validation:** Checked `RoadMap.md` to verify that Phase 7 (Library View) correctly dictates how the saved SQLite books will be visually loaded into the UI.
- **Next:** Phase 4 (Book Reader).

### Session 2026-08-03 Notes
- **Completed Phase 4 (Book Reader):**
  - Built Continuous and Single Page reading modes.
  - Fixed native PDF text selection by using pdfjs-dist native CSS.
  - Fixed infinite render loop in Continuous mode by removing IntersectionObserver state dependency.
  - Implemented highlight extraction rendering and context menu removal feature.
  - Resolved trackpad pinch-to-zoom by enabling zoomHotkeysEnabled in Tauri.
- **Next:** Phase 5 — Notes Viewer or Phase 6 — AI Copilot.

### Session 2026-08-04 Notes
- **Completed Phase 4 (Book Reader) Refinements:**
- **Fixed Render Crashes:** Added ErrorBoundary and fixed hooks execution order.
- **Fixed Zoom & Layout Bugs:** Removed flexbox vertical squishing, enforced strict `overflow: hidden` to prevent text layer bleed, and stabilized continuous mode viewport jumping.
- **Text Selection:** Validated perfect sync between internal pdf.js coordinates and rendered text layers.
- **Next:** Phase 4.5 (Reader Polish) or Phase 5 (Notes Viewer) or Phase 6 (AI Copilot).

### Session 2026-08-07 Notes (Phase 5)
- **Completed Phase 5 (Notes Viewer):**
  - Built an interactive, Obsidian-inspired UI rendered dynamically from AI-extracted JSON.
  - Implemented 'Key Insights' (global list) and 'Flashcard' (active recall) view modes.
  - Resolved Tauri FS ACL errors by using `invokePython` to fetch local files securely.
  - Handled varying JSON array-wrapping edge cases for robust parsing.
  - Persisted user notes, studied status, and implementation steps progress to SQLite.

### Session 2026-08-07 Notes
- Added CSS transform-based zoom stability for highlighting and TTS
- Implemented persistent customizable text selection color and opacity
- Refined annotation toolbar: added underline and strikethrough color picker
- Fixed strikethrough alignment to center on lowercase letters
- Separated layer blending to fix opacity of lines vs highlight blocks
- Refactored AudioToolbar to use DOM-independent tracking offsets
- Re-architected TTSHighlightLayer scaling to prevent CSS transition fighting
- Updated reader_feature_research to mark completed UI/UX improvements

## Key Files
- `RoadMap.md` — v3, full technical blueprint
- `booksage-plan.md` — v3, 9-phase task list
- `README.md` — public-facing description
- `GUI/` — all Replit mockup TSX + screenshots
- `.agents/memory/` — this memory system
- `C:\Users\Ace\.gemini\antigravity\brain\81b4e0a9-.../replit-ui-prompt.md` — Replit prompt artifact

### Session 2026-07-30 Notes
- **Built Phase 0 & Phase 1:** Scaffolding complete (Tauri v2 + React 18) and Python sidecar PDF engine built (`pdf_handler.py`, `chapter_splitter.py`, `main.py`).
- **Verified:** PDF split by chapters using PyMuPDF successfully outputs to `Documents/BookSage_Projects`. React frontend builds cleanly.
- **Built Phase 2 (AI Extractor):** Developed AI extractor backend with `GeminiClient` and strict JSON schema generation with one-shot retry logic. Added session-based chat with context injection (`ai_chat.py`).
- **Verified:** `gemini-flash-latest` accurately extracts JSON chapter lessons and bypasses restrictive API quotas.
- **Built Phase 3 (Pipeline View):** Configured Tauri `shell:allow-execute` capabilities. Implemented `pythonService.ts` for sidecar IPC and `bookStore.ts` for state management. Refactored Tailwind-based `MainWindow.tsx` to Vanilla CSS (`PipelineView.tsx`, `PipelineView.css`, `DonutChart.tsx`, `ActivityBarChart.tsx`) ensuring strict compliance with the no-Tailwind rule.
- **Next:** Phase 4 — Book Reader.

### Session 2026-07-31 Notes
- **Debugged Phase 3 Pipeline:** Identified cause of immediate extraction failures (empty API key).
- **Refactoring UI:** Reverting PipelineView back to the exact Tailwind-based GUI mockup to match RoadMap.md specifications.
- **Fixed Encoding & UI Accessibility:** Replaced `btoa` with Unicode-safe encoder (`encodeURIComponent`) in `pythonService.ts` to fix extraction crashes on special characters. Fixed light/dark mode CSS bugs in `PipelineView` (chapter titles & dropdown readability).
- **Added Robustness & Persistence:** Implemented "Retry Failed" feature. Wrapped `bookStore.ts` with Zustand `persist` middleware to save API Key and Model choice to localStorage across app restarts.
- **Multi-chapter selection & Markdown Rendering Fix:** Added multi-select retry logic. Fixed UI and backend Python script to properly render `Quotes`, `Difficulty to Implement`, and `Tags` missing from the markdown export.
- **Decision:** Use SQLite (Phase 3.5) for proper session persistence instead of localStorage to support production-grade long-term storage and the upcoming Library View.
- **Next:** Phase 3.5 — SQLite Persistence Layer or Phase 4 — Book Reader.

### Session 2026-08-01 Notes
- **Storage & Build Resolution:** Resolved a massive disk space crash on the C: drive caused by Rust compiler artifacts. Moved the Windows Page File to D: and restored the Rust environment to maintain the build system.
- **Completed Phase 3.5 (SQLite Persistence):** 
  - Integrated `tauri-plugin-sql` and successfully created `booksage.db` in the AppData directory.
  - Implemented `dbService.ts` to perform CRUD operations (upsertBook, upsertChapter).
  - Wired `bookStore.ts` to save and resume extraction state into SQLite, completely bypassing localStorage for chapter data.
  - Fixed a Tauri capabilities error by explicitly enabling `sql:allow-execute` in `default.json`.
- **Verified:** Extracted 34 chapters, closed the app midway, and confirmed the SQLite DB perfectly saved the `done` and `process` state for future resumption.
- **Roadmap Validation:** Checked `RoadMap.md` to verify that Phase 7 (Library View) correctly dictates how the saved SQLite books will be visually loaded into the UI.
- **Next:** Phase 4 (Book Reader).

### Session 2026-08-03 Notes
- **Completed Phase 4 (Book Reader):**
  - Built Continuous and Single Page reading modes.
  - Fixed native PDF text selection by using pdfjs-dist native CSS.
  - Fixed infinite render loop in Continuous mode by removing IntersectionObserver state dependency.
  - Implemented highlight extraction rendering and context menu removal feature.
  - Resolved trackpad pinch-to-zoom by enabling zoomHotkeysEnabled in Tauri.
- **Next:** Phase 5 — Notes Viewer or Phase 6 — AI Copilot.

### Session 2026-08-04 Notes
- **Completed Phase 4 (Book Reader) Refinements:**
- **Fixed Render Crashes:** Added ErrorBoundary and fixed hooks execution order.
- **Fixed Zoom & Layout Bugs:** Removed flexbox vertical squishing, enforced strict `overflow: hidden` to prevent text layer bleed, and stabilized continuous mode viewport jumping.
- **Text Selection:** Validated perfect sync between internal pdf.js coordinates and rendered text layers.
- **Next:** Phase 4.5 (Reader Polish) or Phase 5 (Notes Viewer) or Phase 6 (AI Copilot).

### Session 2026-08-05 Notes
- **Completed Phase 4.5 (Reader Polish):**
  - **Full-Text Search:** Integrated PyMuPDF `search_for` via IPC. Replaced `window.find()` with a robust backend engine. Highlight rectangles are rendered over the PDF natively.
  - **Annotation System:** Upgraded highlights with 4 colors, sticky notes, and a dedicated Annotations Sidebar displaying both bookmarks and highlights.
  - **Visual Polish:** Added on-canvas sticky note indicator icons, a reading progress bar in the header, and improved hotkey bindings.
  - **Virtualization:** Implemented a highly performant PDF Thumbnail Strip in the sidebar using `@tanstack/react-virtual` to dynamically render mini canvases without lagging the UI.
  - **Two-Page Spread:** Implemented a true side-by-side Book view (`SpreadReader`) with automatic cover page handling (even=left, odd=right), smart 2-page jump navigation, smooth 3D page flip animations, and a realistic central spine gradient.
  - **Collapsible Sidebar:** Maximized reading focus with a fully collapsible sidebar, utilizing smooth width transitions and a floating toggle button.
  - **Drawing Tools:** Added freehand Pen tool, dynamic Eraser tool with hit-detection, and customizable pen/eraser size sliders.
  - **Undo/Redo System:** Implemented a robust in-memory stack for tracking drawing/erasing actions with UI buttons and keyboard shortcuts (Ctrl+Z / Ctrl+Y).
  - **Display Themes:** Added Invert PDF Colors toggle, and custom PDF Background and Text Tint color pickers utilizing CSS mix-blend-mode and dynamic SVG Duotone filters for perfect color mapping without losing image fidelity.
  - **Margin Control:** Implemented Smart Margin Cropping using a robust CSS transform strategy, allowing users to dynamically slice off baked-in PDF white space without breaking the document's absolute layout or virtualized scrolling engine. Font Size and Line Spacing controls were deferred to the upcoming Markdown Notes Viewer.
  - **Rendering Stability & Performance:** Fixed 0x0 container initialization bug causing persistent blank pages in Single Page mode. Restored offscreen canvas double-buffering to eliminate black flickering during page transitions. Optimized Continuous Reader scroll performance by increasing IntersectionObserver margin to 800% (8-viewport prefetch) and implementing a precise 25ms debounce on the worker queue, completely eliminating "unloaded white page" flashes during rapid scrolling. Added Highlight Opacity persistence slider.
  - **Focus Mode & Annotations:** Implemented native distraction-free Focus Mode (F11/Maximize) with smooth UI transitions and auto-collapsing panels. Added Annotation Export feature (Markdown/Text) via Tauri fs/dialog. Integrated global database search (Cmd+K) for querying highlights and custom notes across all books with jump-to-page navigation.
  - **Reading Stats & Gamification:** Designed and implemented a comprehensive Reading Stats modal. Created `reading_sessions` SQLite table to securely log active reading periods. Engineered real-time calculation logic for personal average reading speed to output dynamic "Time Remaining" estimates. Displayed global stats (Daily Pages, Weekly Pages) and integrated a 🔥 Reading Streak algorithm that retroactively checks consecutive days read, gamifying the user experience.
- **Next:** Phase 5 (Notes Viewer) or Phase 6 (AI Copilot).

### Session 2026-08-09 Notes (Phase 5b)
- **Completed Phase 5b (Split View):**
  - Built a resizable Split View layout for side-by-side Book Reader and Notes Viewer.
  - Implemented draggable divider with 20% to 80% width clamping.
  - Added 'Split View' toggle in IconSidebar and bound a customizable global hotkey (`Ctrl + \`).
  - Integrated state management via Zustand `uiStore` to persist the split state when switching views.
- **Completed Phase 5b (Obsidian Export):**
  - Implemented "Export to Obsidian" feature in NotesViewer.
  - Integrated `@tauri-apps/plugin-dialog` to launch native folder selection.
  - Wired frontend button to `export_chapters` Python backend command via `invokePython`.
  - Added `ChapterUserData` interface to `dbService.ts` for strict typing.
  - Provided user feedback with intuitive toast notifications on success/failure.

### Session 2026-08-10 Notes (Phase 5c)
- **Completed Phase 5c (TTS on Notes & Polish):**
  - Integrated Text-to-Speech (TTS) into the Notes Viewer using a global `ttsStore` for state sync.
  - Restored high-fidelity, character-proportional word-by-word tracking in Python (`tts_engine.py`) to eliminate sync lag.
  - Sanitized PDF input to strip soft line breaks, ensuring fluid TTS playback.
  - Resolved UI CSS conflicts in Notes Viewer, replacing hardcoded `px` fonts with `em`/`inherit` so the font slider scales the entire view perfectly.
  - Contextually hid the 'Type' (highlighting) button in the AudioToolbar when in the Notes view.
  - Enforced global playback cancellation (`window.speechSynthesis.cancel()`) on stop to prevent ghost audio from fallback voices.
  - Added responsive `flexWrap: wrap` and smart text truncation to the Book Reader toolbar so it reflows cleanly in narrow Split View setups.

### Session 2026-08-10 Notes (Phase 4.5 Fix)
- **Search Navigation Fix:** Refactored PDF search jump logic to use robust native `scrollIntoView` anchoring.
- **Spread Mode Scrolling:** Eliminated manual horizontal padding math in Spread Mode by polling for a unique `active-search-highlight` DOM ID, fixing search jump misalignment.
- **Render Awaiting:** Increased search jump polling timeout to 5 seconds to gracefully handle slow PDF rendering hardware.

### Session 2026-08-10 Notes (Phase 6)
- **Completed Phase 6 (AI Copilot):**
  - Integrated `CopilotPopup`, `ContextMenu`, and `CopilotSidebar` into both `BookReader` and `NotesViewer`.
  - Upgraded `useTextSelection` to stream selection data directly to `chatStore`, powering context-aware AI interactions.
  - Built full-screen `AIChatView` studio with 3-column layout: Session List, Chat Thread, and Input Area.
  - Implemented features: Preset Prompts grid, Persona selection (`scholar`, `teacher`, `coach`, `devil`), follow-up pill buttons, and markdown response rendering.
  - Confirmed Python sidecar integration for `chat_message` command.

### Session 2026-08-14 Notes (Bug Fixes)
- **Continuous Mode Text Selection:** Fixed Chromium CSS gap bug by switching margin to padding, completely restoring multi-page text selection logic without dropping text.
- **Selection Virtualization Lock:** Implemented 'Selection Lock' state in uiStore that forces pages trapped inside a dragging selection to stay mounted regardless of IntersectionObserver status, guaranteeing native DOM selection integrity.
- **Gapless Scroll Toggle:** Turned the padding gap fix into a feature toggle inside Display Settings for users who prefer seamless PDF scrolling.

### Session 2026-08-15 Notes (Copilot Fixes)
- **Copilot UI Fixes:** Fixed bottom orb overlapping the page controls, added font size increase/decrease buttons in the Copilot sidebar, and added tooltips for personas (Scholar, Teacher, Coach, Devil's Advocate).
- **Sidebar UX:** Made the Copilot sidebar resizable and bound it to `uiStore` to remember width across sessions.
- **Pipeline Data Integrity:** Fixed race conditions where chapters were prematurely marked green without generated lessons. Refactored `bookStore.ts` extractions to use ID-based tracking.
- **Chat Export:** Refactored Tauri Chat Export to properly use Tauri v2's `@tauri-apps/plugin-dialog` and `@tauri-apps/plugin-fs` natively, with dynamic session-title filenames, fixing silent fallback downloads.

### Session 2026-08-16 Notes (AI Chat Theme Contrast & Settings Theme Selector)
- **Regenerate Response:** Added `regenerateLastMessage` in `chatStore.ts`, providing a 🔄 Regenerate action in `CopilotSidebar` and `AIChatView`.
- **Sidebar Scope:** Scoped `CopilotSidebar` in `App.tsx` to mount only in Reader and Notes views.
- **AI Chat Theme Contrast:** Replaced hardcoded dark colors in `AIChatView.css` with `--bs-*` CSS variables, restoring full readability and contrast in Light and Sepia modes.
- **Settings Theme Selector:** Added a new **Theme & Appearance** tab in `SettingsDialog.tsx` with visual preview swatches for all 6 themes (Dark, Light, Sepia, Night, OLED, Focus) wired to `useBookStore`.
- **Next:** Phase 7 (Library View).

### Session 2026-08-17 Notes (AI Chat Font Controls & Reading Chapter Sync)
- **AI Chat Font Controls:** Added `A-` and `A+` font scaling buttons to `AIChatView.tsx` with scalable relative em units in `AIChatView.css`.
- **Reading Chapter Context Sync:** Wired `AIChatView` to track active reader chapter via `lastPage`, synced `contextMode` with `chatStore`, passed `activeChapter.path` to Python `chat_with_context`, and added an active chapter header indicator badge.

### Session 2026-08-17 Notes (Timestamps, Custom Chapter Selection, & Polish)
- **Message Timestamps:** Added subtle formatted timestamps (`formatTime(msg.ts)`) under both user and AI message bubbles in `CopilotSidebar` and `AIChatView`.
- **Copilot Sidebar Markdown:** Ported full markdown styling (headers `h1-h3`, tables, blockquotes, code blocks `pre`/`code`, lists) from `AIChatView.css` into `CopilotSidebar.css`.
- **Custom Chapter Selection (AIChatView):** Implemented multi-chapter selection modal/popover in `AIChatView.tsx` with live search, "Select All / Clear All", chapter checkboxes with extraction indicators, and full raw text toggle.
- **Dynamic Context Warning:** Added real-time warning for 3+ chapters with full raw text, styled with high contrast across Light, Sepia, and Dark themes.
- **SQLite Persistence:** Stored `custom_chapter_ids` and `include_raw_text` in SQLite `chat_sessions` table with migrations, restoring exact context scope per session.
- **Python Sidecar Context Engine:** Extended `chat_with_context` in `ai_chat.py` and `main.py` to parse complete structured JSON data + optional raw `.txt` content for custom selected chapters.
- **Mic Button Cleanup:** Removed microphone button from `AIChatView.tsx` to match sidebar AI cleanup.
- **Next:** Phase 7 (Library View).



