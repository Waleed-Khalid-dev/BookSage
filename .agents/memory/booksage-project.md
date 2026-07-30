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
| 4 | Book Reader | ⏳ Not started |
| 5 | Notes Viewer | ⏳ Not started |
| 6 | AI Copilot | ⏳ Not started |
| 7 | Library View | ⏳ Not started |
| 8 | Settings & Polish | ⏳ Not started |
| 9 | Packaging | ⏳ Not started |

**Current status: Phase 3 complete. Next action = Phase 4.**

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
