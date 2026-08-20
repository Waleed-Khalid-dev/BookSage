# Plan: BookSage Studio GitHub README & Visual Overhaul (`readme-overhaul.md`)

> **Goal:** Transform the repository's `README.md` into a world-class, showcase-ready GitHub presentation that highlights all of BookSage's cutting-edge capabilities, architecture, and aesthetics, complete with an AI-generated brand logo and structured screenshot showcase spaces.

---

## 🎨 1. Brand Logo Generation Plan

- **Tool:** `generate_image` tool.
- **Concept:** Modern, minimalist, futuristic app logo featuring an open glowing book seamlessly blending into a wise geometric sage owl silhouette, styled with dark glassmorphism, glowing emerald/teal (`#009688`) accents, and clean vector aesthetics.
- **Output Target:** `assets/logo.png` & `assets/banner.png`.

---

## 📐 2. README Structure & Content Blueprint

The redesigned `README.md` will follow modern top-tier GitHub open-source repository design (similar to Supabase, Cursor, Tauri, and Raycast):

### Section 1: Hero Header
- Centered Logo (`assets/logo.png`) with title `BookSage Studio`.
- Catchy sub-headline: *"The Local-First AI Reading & Structured Learning Desktop Studio"*.
- Badges strip:
  - Tauri v2 · React 18 · TypeScript · Python 3.11 · PyMuPDF · SQLite · License MIT · PRs Welcome.
- Clean Table of Contents / Quick Jump Anchors.

### Section 2: Product Showcase & Screenshot Slots
- Primary Hero App Showcase banner placeholder (`assets/screenshots/hero-overview.png`).
- 4-grid visual feature showcase:
  - 📖 **Immersive PDF Reader & Spread Mode** (`assets/screenshots/reader-spread-view.png`)
  - 📝 **Obsidian-Style Interactive Notes & Flashcards** (`assets/screenshots/notes-flashcards.png`)
  - ✦ **Persistent AI Copilot & Context Menu** (`assets/screenshots/copilot-sidebar.png`)
  - 💬 **Full AI Chat Studio with Multi-Chapter RAG & Citations** (`assets/screenshots/ai-chat-studio.png`)

### Section 3: Deep Feature Breakdown (With Rich Typography)
1. **Immersive PDF Engine:**
   - Two-Page 3D Spread Mode, Single, and Continuous Infinite Scroll.
   - 6 Curated Themes: Dark, Light, Sepia, Night, OLED Pure Black, Focus Mode.
   - Smart Margin Cropping & SVG Duotone Text/Background filters.
   - Highlighting, Freehand Pen/Drawing, Eraser, Undo/Redo stack, Sticky Notes.
   - Native PyMuPDF Full-Text Search with real-time match cycling.
   - Character-precise Text-to-Speech (TTS) with word-by-word proportional highlighting.

2. **Automated AI Extraction Pipeline:**
   - Instant chapter splitting and structured JSON extraction:
     - Summaries, Key Teachings, Core Lessons, Actionable Step Checklists, Supporting Quotes, Difficulty Levels, and Obsidian `#tags`.
   - Multi-model flexibility: Gemini, OpenAI, Claude, Groq, Ollama (Local/Offline LLM), DeepSeek.

3. **Interactive Knowledge Studio:**
   - Obsidian-style markdown visual grammar.
   - Dynamic Study Mode with Flashcards.
   - One-click native Obsidian Vault Markdown Export.

4. **Copilot & Full Chat Studio:**
   - Persistent Resizable Copilot Sidebar + Floating Selection Popup.
   - Right-click Context Menu with 10+ instant AI actions.
   - 4 AI Personas: Scholar 🎓, Teacher 👨‍🏫, Coach 🔥, Devil's Advocate 🤔.
   - **Source-Grounded Citations:** Clickable `[Ch. 4: Title ↗]` chips jumping PDF canvas to exact source pages.
   - Custom Multi-Chapter Context Selector with optional full raw text injection.

5. **Local-First Architecture & Privacy:**
   - 100% offline-ready, local SQLite database, encrypted OS keychain for API keys.

### Section 4: System Architecture
- Mermaid sequence/block diagram illustrating:
  `Tauri v2 Desktop Shell` <—> `React 18 / Zustand Stores` <—> `SQLite DB` <—> `Python 3.11 Sidecar (PyMuPDF & AI Clients)`.
- Tech Stack specification table.

### Section 5: Getting Started & Developer Guide
- Prerequisites (Node.js, Rust/Cargo, Python 3.11).
- Step-by-step setup commands for development and building `.msi` Windows bundles.

### Section 6: Project Roadmap & Contribution Guidelines
- Interactive phase checklist (Phases 0–6 Complete, Phase 7 in progress).
- License (MIT) & Contributor attribution.

---

## 📋 3. Step-by-Step Execution Plan

| Step # | Action | Tools / Files |
| :--- | :--- | :--- |
| **Step 1** | Generate brand logo asset | `generate_image` → `assets/logo.png` |
| **Step 2** | Create assets folder structure | Create `assets/screenshots/` with `.gitkeep` & placeholder guide |
| **Step 3** | Author comprehensive `README.md` | `write_to_file` → `d:\[Project]\BookSage\README.md` |
| **Step 4** | Stage, commit, and push to GitHub | `git add`, `git commit`, `git push origin main` |
| **Step 5** | Verify remote GitHub presentation | Verify git status and provide instructions for screenshot uploads |

---

## ❓ Feedback & Review

- Does this structure capture everything you want featured?
- Once you approve, you can say **proceed** or run **/create**, and I will generate the brand logo and build the new `README.md`.
