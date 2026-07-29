---
type: project
created: 2026-07-29
updated: 2026-07-29
---

# Project Conventions — BookSage

## Git Conventions
- Commit after every sub-task — keep GitHub contribution streak active
- Conventional Commits format: `feat:` `fix:` `docs:` `chore:` `refactor:` `test:`
- Branch per phase: `phase/0-scaffold`, `phase/1-pdf-engine`, etc.
- Branch from `dev`, never from `main`
- Push after every session ends

## TypeScript / React
- Named exports only (`export function MyComponent()` — never `export default`)
- No `any` types
- All colors via `var(--bs-*)` CSS variables — never hardcoded hex in JSX
- Exception: `#f3efe5` (book paper cream) and `#252525` (book body text) are intentional "book" colors, not app colors
- Components > 150 lines → extract sub-components
- State: Zustand stores only; no prop-drilling beyond 2 levels

## Python Sidecar
- Type hints on all function signatures
- Docstring on every public function
- All AI calls return strict JSON; validate with schema before use
- API keys: always via `keyring`, never via file or env var

## CSS / Design
- Token system lives in `src/index.css` (ported from `GUI/_group.css`)
- No Tailwind — vanilla CSS variables only
- Fonts: Inter (body) + JetBrains Mono (code, numbers, logs)
- Use class `booksage-mono` for all numeric/monospace elements

## File Organization
- Layout components: `src/components/layout/`
- View components: `src/components/views/`
- Feature sub-components: `src/components/[feature]/`
- Zustand stores: `src/stores/`
- Custom hooks: `src/hooks/`
- Tauri IPC definitions: `src/lib/tauri.ts`

## Phase Completion Criteria
- A phase is only DONE when its verify criterion in `booksage-plan.md` passes
- Do not start the next phase until current phase is verified
- Commit with `feat: complete phase N — [phase name]` when verified

## What NOT to Commit
- `.env` files
- `BookSage_Projects/` output directory (gitignored)
- `*.exe` build outputs
- Python `__pycache__/` and `.pyc` files
- OS files: `.DS_Store`, `Thumbs.db`
