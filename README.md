<div align="center">

  <img src="assets/logo.png" alt="BookSage Studio Logo" width="180" style="border-radius: 28px; box-shadow: 0 8px 32px rgba(0, 150, 136, 0.25);" />

  # BookSage Studio

  ### *The Local-First AI Reading & Structured Learning Desktop App*

  <p align="center">
    <b>Read deeper. Extract structured knowledge. Chat with your books privately.</b>
  </p>

  <!-- Badges -->
  <p align="center">
    <a href="https://v2.tauri.app/"><img src="https://img.shields.io/badge/Tauri-v2.0-24C8D8?style=flat-square&logo=tauri&logoColor=white" alt="Tauri v2" /></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 18" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python 3.11" /></a>
    <a href="https://www.sqlite.org/"><img src="https://img.shields.io/badge/SQLite-Local_DB-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-Proprietary-e05252?style=flat-square" alt="License Proprietary" /></a>
    <img src="https://img.shields.io/badge/Platform-Windows-0078D6?style=flat-square&logo=windows&logoColor=white" alt="Platform" />
    <img src="https://img.shields.io/badge/Privacy-100%25_Local--First-brightgreen?style=flat-square" alt="Local First" />
  </p>

  <p align="center">
    <a href="#-key-features">✨ Key Features</a> •
    <a href="#-visual-showcase">📸 Visual Showcase</a> •
    <a href="#-architecture">🏗️ Architecture</a> •
    <a href="#-quick-start">⚡ Quick Start</a> •
    <a href="#-ai-copilot--rag-engine">🤖 AI Copilot</a> •
    <a href="#-roadmap">🗺️ Roadmap</a>
  </p>

</div>

---

## 💡 What is BookSage Studio?

**BookSage Studio** is an all-in-one desktop application engineered for serious readers, researchers, and lifelong learners. Instead of juggling detached PDF readers, separate note-taking apps, and generic cloud chatbots, BookSage combines everything into a unified, **local-first learning studio**.

Drop in any PDF book or document. BookSage automatically splits chapters, extracts comprehensive structured insights (teachings, actionable steps, core lessons, key quotes, and Obsidian tags), and delivers an immersive reader backed by a **persistent, context-aware AI Copilot** and an **instant dictionary engine**.

---

## 📸 Visual Showcase

<div align="center">

| 📖 Immersive PDF Reader (Spread View & Highlights) | 📝 Obsidian-Style Notes & Flashcards |
| :---: | :---: |
| <img src="assets/screenshots/reader-spread-view.png" alt="PDF Reader View" width="460" style="border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" /> | <img src="assets/screenshots/notes-flashcards.png" alt="Notes Studio View" width="460" style="border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" /> |
| *Two-page 3D spread, 6 color themes, margin cropping & draw layer* | *Structured chapter summaries, action steps & interactive flashcards* |

| 🎨 Draggable Book Cover Popup & Downward Showcase | 📚 <kbd>Ctrl+Click</kbd> Inline Dictionary & Theme Picker |
| :---: | :---: |
| <img src="assets/screenshots/cover-drawer-showcase.png" alt="Book Cover Showcase" width="460" style="border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" /> | <img src="assets/screenshots/word-definition-modal.png" alt="Inline Word Definition Modal" width="460" style="border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" /> |
| *Real cover art from PDF, uncompressed morphing card, and reading stats* | *Zero-token definitions, phonetics, audio player, AI nuance & 5 themes* |

| ✦ Context-Aware AI Copilot Sidebar | 🎭 4 AI Personas & Configurable Presets |
| :---: | :---: |
| <img src="assets/screenshots/copilot-sidebar.png" alt="Copilot Sidebar" width="460" style="border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" /> | <img src="assets/screenshots/copilot-personas-presets.png" alt="AI Personas and Presets" width="460" style="border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" /> |
| *Live token counter badge, chapter context & interactive follow-up chips* | *Scholar, Teacher, Coach, Devil's Advocate & custom prompt manager* |

| 💬 Full-Screen AI Chat Studio & Citations | ⏳ "Story So Far" Spoiler-Free Book Recap |
| :---: | :---: |
| <img src="assets/screenshots/ai-chat-studio.png" alt="AI Chat Studio" width="460" style="border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" /> | <img src="assets/screenshots/story-so-far-recap.png" alt="Story So Far Recap" width="460" style="border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" /> |
| *Multi-chapter RAG context selector & interactive citation jumping* | *Chronological recap modal & welcome-back resume reading banner* |

</div>

---

## ✨ Key Features

### 📖 1. Next-Gen PDF Reading Experience
- **Multiple Layout Modes:** Seamlessly switch between **Single Page**, **Continuous Infinite Scroll**, and **Two-Page 3D Realistic Spread Mode**.
- **6 Curated Reader Themes:** High-contrast `Dark`, clean `Light`, warm `Sepia`, eye-strain reducing `Night`, pure black `OLED`, and distraction-free `Focus Mode (F11)`.
- **Custom Duotone SVG Tinting:** Customize PDF page background and text tint colors for optimal readability in any lighting environment.
- **Smart Margin Cropping:** Crop empty page margins dynamically to maximize reading real estate.
- **Draggable Book Cover Popup & Downward Slide Showcase:**
  - **Dynamic Cover Art:** Renders the active book's cover artwork directly from PDF page 1 onto HTML canvas at 2x Retina resolution.
  - **Retractable Floating Bar:** Displays title, author, cover thumbnail, and a center drag handle (`═`). Horizontally draggable across the reading canvas with coordinates remembered across sessions.
  - **Smart Auto-Hide & Re-Summon:** Automatically slides upward to tuck away after 4.5 seconds of idle reading. Hovering pauses the timer, and a subtle "Cover ▾" tab remains pinned to the top edge for instant access.
  - **Downward Sliding Dropdown:** Clicking the thumbnail opens a large showcase card sliding directly beneath the trigger element with exact matching width (`375px`). Features reading progress percentage, pages remaining, and a "Jump to Cover (Page 1)" action.
  - **Non-Intrusive Interaction:** Zero background blur, no cursor or focus lock, and instant dismissal when clicking anywhere outside.
- **Full Annotation Suite:**
  - 4-color text highlighters with customizable opacity and styles (underline, strikethrough).
  - Freehand Pen and Eraser layer with full **Unified Undo/Redo** history.
  - Sticky notes and pop-up comments on any highlight.
  - Searchable annotation sidebar with instant page navigation.
  - One-click annotation export to clean Markdown.
- **Synchronized Text-to-Speech (TTS):** Character-proportional word-by-word highlighted reading voice powered by a native Python engine.

---

### 📚 2. Instant Dictionary & Inline Word Definitions
- **<kbd>Ctrl+Click</kbd> Smart Lookup:** Click any word in the PDF reader or Notes viewer to reveal an instant definition popover with an authentic macOS definition cursor cue.
- **Zero-Token Free Dictionary Integration:** Powered by the Free Dictionary API for instant offline-cached definitions, phonetic transcription, part of speech, and audio pronunciation.
- **AI Chapter Thematic Context:** Generates book-specific nuance explaining how the author uses the term within the active chapter.
- **Curated Modal Theme Picker:** Customize popup aesthetics on the fly with 5 curated themes:
  - 🍵 `Sepia Parchment` • 🌲 `Dark Emerald` • 🌑 `Dark Charcoal` • ⚪ `Clean Light` • 🌌 `OLED Midnight`.
- **In-Modal Font Scaling:** Adjust definition text size directly via `A-` / `A+` controls.
- **Local SQLite Cache:** Caches lookups in the local database for instantaneous repeat lookups.

---

### 🧠 3. Automated AI Knowledge Extraction Pipeline
- **Chapter Splitting:** Automatic table of contents detection and regex fallback using high-speed `PyMuPDF`.
- **Structured JSON Synthesis:** Converts raw book text into standardized, high-density study guides:
  - 📌 **Executive Summary & Core Lesson:** The central takeaway distilled.
  - 🛠️ **Key Teachings & Techniques:** Step-by-step methodologies and explanations.
  - ✅ **Actionable Implementation Steps:** Ready-to-use checklist items.
  - 💬 **Supporting Quotes:** Key passages extracted with source context.
  - 🏷️ **Obsidian Tags & Difficulty Rating:** Categorization for personal knowledge management (PKM).
- **Universal AI Model Support:**
  - Google Gemini (`gemini-2.5-flash`, `gemini-1.5-pro`)
  - OpenAI (`gpt-4o`, `gpt-4o-mini`)
  - Anthropic Claude (`claude-3-5-sonnet`)
  - Groq & DeepSeek
  - **Ollama (100% Offline Local LLMs)**

---

### 📝 4. Interactive Notes Studio & Obsidian Vault Bridge
- **Obsidian Visual Grammar:** Beautiful typography with obsidian-style red headers, styled callouts, and code blocks.
- **Interactive Checklists:** Track your progress as you implement teachings into your daily workflow.
- **Flashcard Study Mode:** Turn chapter lessons into interactive, flippable flashcards for spaced repetition.
- **Native Obsidian Export:** Export clean, beautifully formatted `.md` vault files ready for Obsidian, Logseq, or Notion.
- **Pinned AI Insights:** Pin key takeaways or copilot responses directly to your book's Notes view with direct page jump links.

---

### ✦ 5. In-App AI Copilot & Full Chat Studio
- **Persistent Copilot Sidebar:** Resizable right-side assistant docked directly alongside the reader and notes views.
- **Visual Context Token Estimator:** Live token badge in the sidebar header with real-time recalculation across chapter, full-book, or custom selections.
- **Selection Popup & Smart Context Menu:** Select any text and right-click to trigger:
  - 📋 *Summarize*, 🧠 *Simplify (ELI5)*, 💡 *Explain*, ✂️ *Make Shorter/Longer*, ✅ *Fix Grammar*, 🌐 *Translate (10+ languages)*.
  - 🎨 *Rephrase*, ✍️ *Continue Writing*, 📊 *Extract Key Data*.
- **4 Distinct AI Personas:**
  - 🎓 **Scholar:** Deep, academic, theoretical analysis with principle citations.
  - 👨‍🏫 **Teacher:** Clear, simplified, patient breakdowns with practical analogies.
  - 🔥 **Coach:** Motivating, punchy, action-oriented execution advice.
  - 🤔 **Devil's Advocate:** Socratic critical thinking, challenging assumptions and edge cases.
- **Minimalist Persona Badges:** Assistant responses display clean persona indicator tags across the Sidebar, Chat Studio, and Floating Popup.
- **Configurable AI Presets:** Fully customizable sidebar prompt presets in Settings Dialog (add, reorder, edit prompts, and toggle default buttons).
- **"Story So Far" Recap Engine:** Catch up on what you've read with spoiler-free chronological recaps and welcome-back resume banners.
- **Interactive Follow-Up Chips:** Generates clickable follow-up questions at the end of conversational responses.
- **Source-Grounded Citations (`[Ch. 4 ↗]`):** Interactive citation badges teleport the reader canvas directly to the cited chapter and page.

---

### 🔒 6. 100% Local-First & Private
- **Local SQLite Database:** All reading progress, highlights, drawings, bookmarks, definitions, notes, and chat histories stay on your machine.
- **Zero Plaintext Credentials:** API keys are encrypted and stored safely via the native OS keychain (`keyring`).
- **Offline Capable:** Run completely offline using local models via Ollama.

---

## 🏗️ Architecture

BookSage Studio is built on an ultra-responsive, modular multi-process architecture:

```mermaid
graph TD
    subgraph Frontend ["Desktop Frontend (React 18 + TypeScript + Zustand)"]
        UI["App Shell (App.tsx)"]
        Reader["Book Reader (PDF.js + Web Canvas)"]
        Drawer["Book Cover Drawer & Showcase"]
        Notes["Notes Viewer (ReactMarkdown + remark-gfm)"]
        Chat["AI Chat Studio & Copilot Sidebar"]
        Store["State Layer (bookStore, chatStore, uiStore)"]
    end

    subgraph DesktopShell ["Tauri v2 Native Host (Rust)"]
        IPC["Tauri IPC & Core Plugins"]
        Dialog["Native Dialogs & File System"]
        SQL["SQLite Persistence Plugin"]
    end

    subgraph Sidecar ["Python 3.11 Backend Sidecar (PyInstaller Bundle)"]
        Main["IPC Command Dispatcher (main.py)"]
        PDF["PDF Engine (PyMuPDF / fitz)"]
        Splitter["Chapter Splitter (TOC + Regex)"]
        TTS["TTS Engine (Word-Level Sync)"]
        Dict["Context Dictionary & Recap Engine"]
        AI["AI Client Engine (Gemini, OpenAI, Claude, Ollama)"]
    end

    UI --> Store
    Store --> IPC
    Reader --> Drawer
    Reader --> IPC
    Chat --> IPC
    IPC --> SQL
    IPC --> Dialog
    IPC --> Main
    Main --> PDF
    Main --> Splitter
    Main --> TTS
    Main --> Dict
    Main --> AI
```

---

## 💻 Tech Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Desktop Shell** | [Tauri v2](https://v2.tauri.app/) | Minimal memory footprint (~40MB RAM), native Rust performance, secure sandbox. |
| **Frontend** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Type-safe, modular UI components with high render efficiency. |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) | Lightweight, un-opinionated store with persistent SQLite and LocalStorage sync. |
| **PDF Rendering** | [pdfjs-dist](https://mozilla.github.io/pdf.js/) | Fast in-browser canvas rendering with custom double-buffering. |
| **Markdown Engine** | [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm) | Custom component overrides for interactive citations, badges, and callouts. |
| **Python Sidecar** | [Python 3.11](https://www.python.org/) + [PyMuPDF](https://pymupdf.readthedocs.io/) | High-speed PDF text/TOC extraction, regex parsing, and streaming AI orchestration. |
| **Database** | [SQLite](https://www.sqlite.org/) via `@tauri-apps/plugin-sql` | Robust, local-first ACID storage for annotations, sessions, and book metadata. |
| **Styling** | Vanilla CSS Tokens (`_group.css`) | Zero runtime CSS overhead, full control over themes and high-contrast duotone filters. |

---

## ⚡ Quick Start

### Prerequisites
Make sure you have the following installed on your machine:
- **Node.js** (v18.0 or higher) — [Download Node.js](https://nodejs.org/)
- **Rust & Cargo** — [Install Rust](https://www.rust-lang.org/tools/install)
- **Python 3.11** — [Download Python](https://www.python.org/downloads/)

---

### 📥 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Waleed-Khalid-dev/BookSage.git
cd BookSage

# Install frontend dependencies
npm install

# Install Python sidecar dependencies
cd python
pip install -r requirements.txt
cd ..
```

---

### 🚀 2. Run in Development Mode

```bash
# Start frontend and Tauri development environment
npm run tauri dev
```

---

### 📦 3. Build Production Installer (`.msi` / `.exe`)

```bash
# Build the production release bundle
npm run tauri build
```
The output installer will be generated in `src-tauri/target/release/bundle/`.

---

## 🗺️ Project Roadmap & Phase Status

- [x] **Phase 0: Project Scaffold** — Tauri v2 + React 18 + Zustand stores + Python Sidecar
- [x] **Phase 1: PDF Engine** — PyMuPDF extraction, TOC detection, chapter chunking
- [x] **Phase 2: AI Extraction Engine** — Structured JSON schema validation, multi-model clients
- [x] **Phase 3: Pipeline Studio** — Chapter queue, live progress visualization, batch retries
- [x] **Phase 3.5: Local SQLite Persistence** — Automatic schema migrations, persistent database
- [x] **Phase 4: High-Performance PDF Reader** — Single, continuous, and 3D Two-Page Spread views
- [x] **Phase 4.5: Reader Polish & Annotations** — 6 themes, margin crop, SVG duotone, highlights, freehand pen
- [x] **Phase 5: Obsidian-Style Notes Studio** — Interactive teachings, study checklists, flashcards
- [x] **Phase 5b/c: Obsidian Vault Export & Notes TTS** — One-click vault export & word-level TTS
- [x] **Phase 6: In-App AI Copilot Studio** — Sidebar, selection popup, 4 personas, multi-chapter RAG, citations, and pinned insights
- [x] **Phase 6 Polish: Inline Dictionary & Visual Showcase** — <kbd>Ctrl+Click</kbd> dictionary, 5 modal themes, draggable book cover popup & downward showcase panel
- [ ] **Phase 7: Enhanced Library View** — Visual shelf management, reading goals, and import analytics *(Next Action)*
- [ ] **Phase 8: Settings & Keyring Security** — Hardware-backed credential management
- [ ] **Phase 9: Production Packaging** — WiX/NSIS signed releases

---

## 🤝 Contributing

Contributions, issues, and feature suggestions are always welcome!

1. Fork the Project (`https://github.com/Waleed-Khalid-dev/BookSage`)
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License & Intellectual Property

Copyright © 2026 Waleed Khalid. All Rights Reserved.

This project is currently in its core development phase and is licensed as **Proprietary & Source-Available**. Access to this repository is provided strictly for personal code review and evaluation. Unauthorized copying, distribution, modification, commercial deployment, or creating derivative software is strictly prohibited without prior written permission from the author. See [`LICENSE`](LICENSE) for complete terms.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/Waleed-Khalid-dev">Waleed Khalid</a> • Designed for lifelong learners.</sub>
</div>
