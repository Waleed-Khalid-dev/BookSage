---
type: project
created: 2026-07-29
updated: 2026-07-29
---

# Tech Decisions — BookSage

## Stack Decisions (All Locked)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Desktop framework | Tauri v2 | 5MB bundle vs 150MB Electron; native `.msi`; Rust sidecar |
| Frontend | React 18 + TypeScript | Existing mockups already in React/TSX |
| CSS | Vanilla CSS variables | `_group.css` token system; zero framework lock-in |
| PDF rendering | pdfjs-dist (Mozilla) | Industry standard; renders real PDF pages as canvas |
| Markdown rendering | react-markdown + remark-gfm | GFM support + Obsidian-style custom component overrides |
| State management | Zustand | Lightweight, no boilerplate |
| Python backend | Python 3.11 sidecar | Bundled by PyInstaller; user needs no Python installed |
| PDF text engine | PyMuPDF (fitz) | Extracts text + TOC bookmarks |
| AI default | Gemini free tier | 1500 req/day; 48 chapters = 48 calls, well within free tier |
| Secret storage | OS keyring | API keys never written to disk |
| Installer | Tauri NSIS/WiX → .msi | Self-contained Windows installer |
| Obsidian export | Optional only | App is self-contained; not an Obsidian feeder |

## Color Design Decisions
- Primary accent: teal `#009688` (interactive elements, active states)
- Reading headings: red `#e05252` (Obsidian-matched — from screenshots user provided)
- Inline code: dark red pill (`bg: #2a1a1a`, `text: #e05252`)
- Copilot popup bg: `#1e2a2a` (teal-tinted dark, distinct from main bg)
- Book paper color in reader: `#f3efe5` (intentional warm cream — not a CSS variable)

## Project Conventions
- Commit after every sub-task (keep GitHub streak)
- Dedicated branch per phase (`phase/X-name`)
- Named exports only (no default exports in components)
- No `any` types in TypeScript
- All hardcoded colors in JSX must use `var(--bs-*)` tokens
- Exceptions: book paper cream and body text are intentional "book" colors
