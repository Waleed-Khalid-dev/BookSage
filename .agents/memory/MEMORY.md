# Memory Index
> BookSage project — updated 2026-07-30

## User
- [user] Windows power-user, runs PowerShell, uses Google Antigravity as AI tool → user-preferences.md
- [user] Building open-source project, hosted publicly on GitHub → user-preferences.md
- [user] Uses Replit for UI mockup generation (Replit phase now COMPLETE) → user-preferences.md
- [user] Uses Obsidian with plugins (Copilot by Logan Yang, Omnisearch, Editing Toolbar) → user-preferences.md
- [user] Prefers concise but complete responses; likes tables → user-preferences.md

## Project
- [project] BookSage: AI-powered book reading + notes studio, Tauri v2 + React 18 + TypeScript + Python 3.11 sidecar → booksage-project.md
- [project] Repo is PUBLIC on GitHub, MIT license → booksage-project.md
- [project] Stack: Tauri v2, React 18, TypeScript, Zustand, pdfjs-dist, react-markdown, Python 3.11, PyMuPDF, Gemini/OpenAI/Claude/Ollama, Jinja2 → tech-decisions.md
- [project] CSS: vanilla CSS variables, no Tailwind, font: Inter + JetBrains Mono → tech-decisions.md
- [project] Accent: teal #009688; Headings in reader/notes: red #e05252 (Obsidian-matched) → tech-decisions.md
- [project] Branch per phase: phase/0-scaffold to phase/9-packaging; main <- dev <- phase/* → booksage-project.md
- [project] Obsidian export is OPTIONAL — app is self-contained reading studio → booksage-project.md
- [project] 9 commits on main, all pushed to GitHub as of 2026-07-30 → booksage-project.md
- [project] ALL 7 UI MOCKUPS COMPLETE — Replit design phase is DONE → booksage-project.md
- [project] NEXT STEP: Phase 2 AI Extractor with Gemini. (Phase 0 & 1 COMPLETE) → booksage-project.md
- [project] Mobile (iOS + Android) planned post-v1.0: React Native + Expo + hosted FastAPI + Supabase → booksage-project.md
- [project] Desktop is LOCAL-FIRST: no auth, no cloud DB needed for v1.0 → tech-decisions.md
- [project] Git email fixed: all commits attributed to apex.remake@gmail.com (Waleed Khalid) → tech-decisions.md

## Reference — GUI Mockups (ALL COMPLETE)
- [reference] GUI/AppShell.tsx: full app shell, icon nav, 5 view stubs DONE → booksage-project.md
- [reference] GUI/CopilotPopup.tsx: floating copilot popup, model selector, quick actions DONE → booksage-project.md
- [reference] GUI/ContextMenu.tsx: right-click menu with Copilot submenu + Translate DONE → booksage-project.md
- [reference] GUI/MainWindow.tsx: pipeline view (chapter list + preview + export) DONE → booksage-project.md
- [reference] GUI/SettingsDialog.tsx: settings modal 4 tabs DONE → booksage-project.md
- [reference] GUI/LibraryView.tsx: 252 lines — search, stats bar, book grid, hover actions, empty state DONE → booksage-project.md
- [reference] GUI/BookReaderFull.tsx: 447 lines — 3-panel reader (chapter list + PDF canvas + info panel) DONE → booksage-project.md
- [reference] Full roadmap at: RoadMap.md (v3) — 9 phases + pitfalls + mobile future work → booksage-project.md
- [reference] Project plan at: booksage-plan.md (v3) — 9 phases with verify criteria → booksage-project.md
- [reference] Coding standards: project-conventions.md (git, TS, Python, CSS, file org) → project-conventions.md
- [reference] Phase 0 Scaffold & Phase 1 PDF Engine: COMPLETE & verified. → booksage-project.md
- [reference] Phase 2 AI Extractor: COMPLETE & verified. Using `gemini-flash-latest` bypassed quota limits. → booksage-project.md
- [reference] Phase 3 Pipeline View: COMPLETE & verified. Ported UI mockups to Vanilla CSS + wired Zustand state. → booksage-project.md
- [reference] Phase 3 Pipeline Debug: Identified missing API key issue, preparing to refactor PipelineView to match Tailwind GUI mockups -> booksage-project.md
- [reference] Phase 3 Final Polish: COMPLETE. Fixed btoa encoding, UI themes, added Retry Failed, persisted settings. → booksage-project.md
- [reference] Phase 3 Markdown Audit & Multi-Select: COMPLETE & verified. Fixed missing markdown fields, added batch retry → booksage-project.md
- [decision] Use SQLite (Phase 3.5) for session persistence instead of localStorage for production readiness. → booksage-project.md
- [reference] Phase 3.5 SQLite Persistence Layer: COMPLETE & verified. Fixed Rust cache build issues. Strictly following roadmap: Next step is Phase 4 (Book Reader). → booksage-project.md

## Skills
- [skill] /checkpoint — saves memory + commits + pushes. Run at end of every phase → .agents/skills/checkpoint-save/SKILL.md
