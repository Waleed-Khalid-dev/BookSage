# Contributing to BookSage

Thank you for your interest in contributing to BookSage! This guide covers everything you need to get started.

---

## Project Overview

BookSage is a self-contained desktop reading and learning studio built with:
- **Tauri v2** (Rust shell)
- **React 18 + TypeScript** (frontend)
- **Python 3.11** (AI/PDF processing sidecar)

See [`RoadMap.md`](RoadMap.md) for the full technical blueprint.

---

## Development Setup

### Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Rust | stable | `rustup --version` |
| Node.js | 20+ | `node --version` |
| Python | 3.11+ | `python --version` |
| Tauri CLI | v2 | `cargo tauri --version` |

### Install

```bash
git clone https://github.com/YOUR_USERNAME/BookSage.git
cd BookSage

# Frontend dependencies
npm install

# Python backend dependencies
cd python && pip install -r requirements.txt && cd ..

# Start development server
npm run tauri dev
```

---

## Branching Strategy

```
main         ← Tagged releases only
└── dev      ← Integration branch
     └── phase/X-name  ← Feature branches (one per roadmap phase)
```

**Always branch from `dev`, never from `main`.**

```bash
git checkout dev
git pull origin dev
git checkout -b phase/3-pipeline-view
```

---

## Commit Convention

We use **Conventional Commits**:

```
feat: add PDF page renderer to BookReader
fix: correct chapter split regex for books without TOC
docs: update RoadMap with Phase 4 details
chore: bump pdfjs-dist to 4.2.67
refactor: extract ModelSelector into standalone component
test: add unit tests for chapter_splitter.py
```

---

## Phase-Based Development

Each phase has a **verify criterion** listed in `booksage-plan.md`. A phase is only complete when its verify step passes. Do not merge a phase branch until verification succeeds.

---

## Code Standards

- **TypeScript:** No `any` types. All components as named exports.
- **CSS:** All colors via `var(--bs-*)` tokens. No hardcoded hex in JSX (except intentional book-paper colors).
- **Python:** Type hints on all function signatures. Docstring on every public function.
- **Components:** Single responsibility. If a component exceeds 150 lines, extract sub-components.

---

## Reporting Issues

Use GitHub Issues. Include:
1. OS version
2. Steps to reproduce
3. Expected vs. actual behavior
4. Error message / screenshot if applicable

---

## License

By contributing, you agree your contributions are licensed under the [MIT License](LICENSE).
