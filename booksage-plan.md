# BookSage — Project Plan

## Goal
Build BookSage: a Windows desktop app that transforms any PDF book into structured Obsidian Markdown lesson notes using AI, packaged as a native `.msi` installer.

## Tasks

- [ ] **Phase 0 — Scaffold** → Verify: `npm run tauri dev` opens the window with all three panels visible
  - [ ] Install Rust, Node 20, Python 3.11, Tauri CLI
  - [ ] Init Tauri + React + TypeScript project
  - [ ] Port GUI components from `GUI/` into `src/components/`
  - [ ] Set up Python sidecar directory + `requirements.txt`

- [ ] **Phase 1 — PDF Engine** → Verify: CLI splits 48_laws.pdf into 48 `.txt` chapter files
  - [ ] `pdf_handler.py`: text + TOC extraction via PyMuPDF
  - [ ] `chapter_splitter.py`: TOC method + regex fallback
  - [ ] `main.py`: JSON-in/JSON-out CLI entry point

- [ ] **Phase 2 — AI Extractor** → Verify: Single chapter `.txt` → valid JSON with all schema fields
  - [ ] Abstract `AIClient` base class
  - [ ] `GeminiClient`, `OpenAIClient`, `ClaudeClient`, `OllamaClient` implementations
  - [ ] JSON schema validation + one-shot fix retry
  - [ ] Prompt template system with placeholder substitution

- [ ] **Phase 3 — GUI Skeleton** → Verify: Open PDF → chapter list populates, Settings tabs all work
  - [ ] Wire Tauri `invoke()` commands to Python sidecar
  - [ ] Zustand stores: `useBookStore`, `useSettingsStore`
  - [ ] Chapter list with live status badges
  - [ ] Settings dialog: all 4 tabs functional

- [ ] **Phase 4 — Integration Loop** → Verify: 5-chapter test PDF processes fully, center panel shows lesson
  - [ ] "Generate Lessons" async pipeline
  - [ ] Pause / resume / re-run single chapter
  - [ ] Center panel: Raw Text / AI Output / Markdown Source tabs
  - [ ] Live progress bar + donut chart + export log

- [ ] **Phase 5 — Obsidian Export** → Verify: 48 `.md` files in Obsidian with correct frontmatter
  - [ ] `markdown_gen.py`: Jinja2 template → Obsidian-flavored Markdown
  - [ ] `file_manager.py`: copy to vault folder with conflict resolution
  - [ ] Master `_index.md` generation

- [ ] **Phase 6 — Settings & Error Handling** → Verify: API key saved to keychain, failed chapters retry
  - [ ] OS keychain storage via `keyring`
  - [ ] "Test Connection" validates live API
  - [ ] Retry button per chapter + "Retry All Failed"

- [ ] **Phase 7 — Packaging** → Verify: `.msi` installs and runs on clean Windows VM
  - [ ] Bundle Python sidecar with PyInstaller
  - [ ] Tauri NSIS/WiX installer config
  - [ ] Test on clean VM

## Done When
- [ ] App installs from `.msi` on a clean Windows machine with no dev tools
- [ ] Full pipeline: PDF → AI → `.md` → Obsidian vault works end-to-end
- [ ] API keys never touch disk (OS keychain only)
- [ ] All 8 phases committed with meaningful git messages

## Notes
- Stack: Tauri v2 + React 18 + TypeScript + Python 3.11 sidecar
- Default AI: Gemini free tier (1,500 req/day — sufficient for most books)
- GUI design is fully defined in `GUI/` — direct port, do not redesign
- Branch per phase: `phase/0-scaffold`, `phase/1-pdf-engine`, etc.
- See `RoadMap.md` for full technical specs, JSON schema, and Jinja2 template
