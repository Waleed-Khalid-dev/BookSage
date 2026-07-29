# Memory Index
> BookSage project — updated 2026-07-29

## User
- [user] Windows power-user, runs PowerShell, uses Google Antigravity as AI tool → user-preferences.md
- [user] Building open-source project, hosted publicly on GitHub → user-preferences.md
- [user] Uses Replit for UI mockup generation (daily limit applies) → user-preferences.md
- [user] Uses Obsidian with plugins (Copilot by Logan Yang, Omnisearch, Editing Toolbar) → user-preferences.md
- [user] Prefers concise but complete responses; likes tables → user-preferences.md

## Project
- [project] BookSage: AI-powered book reading + notes studio, Tauri v2 + React 18 + TypeScript + Python 3.11 sidecar → booksage-project.md
- [project] Repo is PUBLIC on GitHub, MIT license → booksage-project.md
- [project] Stack: Tauri v2, React 18, TypeScript, Zustand, pdfjs-dist, react-markdown, Python 3.11, PyMuPDF, Gemini/OpenAI/Claude/Ollama, Jinja2 → tech-decisions.md
- [project] CSS: vanilla CSS variables, no Tailwind, font: Inter + JetBrains Mono → tech-decisions.md
- [project] Accent: teal #009688; Headings in reader/notes: red #e05252 (Obsidian-matched) → tech-decisions.md
- [project] Branch per phase: phase/0-scaffold → phase/9-packaging; main ← dev ← phase/* → booksage-project.md
- [project] Obsidian export is OPTIONAL — app is self-contained reading studio, not an Obsidian feeder → booksage-project.md
- [project] Git initialized, 3 commits made as of 2026-07-29. Repo connected to GitHub (public) → booksage-project.md
- [project] GUI folder contains all Replit-generated mockup TSX files — source of truth for design → booksage-project.md
- [project] Always create a new dedicated branch for major code changes → project-conventions.md
- [project] AG Kit only supports Gemini CLI and Google Antigravity (not other AI coding tools) → project-conventions.md
- [project] Component metadata uses SemVer while toolkit releases use CalVer → tech-decisions.md

## Reference
- [reference] GUI/AppShell.tsx: full app shell with icon nav + Library/Reader/Notes/Chat views — BUILT ✅ → booksage-project.md
- [reference] GUI/CopilotPopup.tsx: floating copilot popup with model selector, quick actions — BUILT ✅ → booksage-project.md
- [reference] GUI/ContextMenu.tsx: right-click menu with Copilot submenu + Translate sub-menu — BUILT ✅ → booksage-project.md
- [reference] GUI/MainWindow.tsx: pipeline view (chapter list + preview + export) — BUILT ✅ → booksage-project.md
- [reference] GUI/SettingsDialog.tsx: settings modal 4 tabs — BUILT ✅ → booksage-project.md
- [reference] REMAINING screens: Library View enhanced + Book Reader enhanced → replit-prompt-remaining.md
- [reference] Replit UI prompt lives at: .agents/memory/replit-prompt-remaining.md → replit-prompt-remaining.md
- [reference] Full roadmap at: RoadMap.md (v3) — 9 phases, Phase 0 not yet started (code) → booksage-project.md
- [reference] Project plan at: booksage-plan.md (v3) — 9 phases with verify criteria → booksage-project.md
