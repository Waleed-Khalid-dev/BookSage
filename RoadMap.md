# 📘 BookSage — Development Roadmap & System Blueprint
> **Version:** 2.0 · **Status:** Active Development · **Last Updated:** 2026-07-29

---

## 🎯 Mission Statement

> *Drop a PDF book in, press a button, get chapter-by-chapter Markdown files — each containing a rich summary, the author's teachings, the core lesson, and a practical implementation guide — all saved directly into your Obsidian vault.*

**Target User:** A Windows power-user who reads dense non-fiction (Robert Greene, Naval Ravikant, etc.) and wants to extract "lesson DNA" from each chapter without spending hours manually note-taking. Everything is local-first, private, and fully controlled.

---

## ✅ Feasibility Assessment

| Concern | Verdict | Notes |
|---------|---------|-------|
| PDF text extraction | ✅ Fully achievable | PyMuPDF (fitz) is battle-tested, handles 99% of books |
| TOC/chapter splitting | ✅ Fully achievable | PDF bookmarks + regex fallback covers all cases |
| AI lesson extraction | ✅ Fully achievable | Structured output (JSON mode) via Gemini/OpenAI |
| Obsidian vault sync | ✅ Trivial | Simple file copy to a user-chosen directory |
| Token limits | ✅ Not a problem | Even the longest Greene chapter is < 8,000 tokens |
| Desktop GUI | ✅ Achievable | Tauri + React is the recommended stack (see §4) |
| Packaging as `.exe` | ✅ Achievable | Tauri produces a native Windows installer natively |
| Offline/local AI | ✅ Achievable | Ollama REST API (localhost:11434) as fallback |

**Verdict: The entire vision is buildable. No blockers exist. All dependencies are stable, well-documented, and free.**

---

## 🗺️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  BookSage Desktop App  (Tauri shell)                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Frontend: React + TypeScript + CSS                     │   │
│  │  (MainWindow · SettingsDialog · PreviewPanel)           │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │ Tauri Commands (IPC)                  │
│  ┌──────────────────────▼──────────────────────────────────┐   │
│  │  Backend: Python sidecar (called via Tauri invoke)      │   │
│  │                                                         │   │
│  │  pdf_handler.py      ← PyMuPDF                          │   │
│  │  chapter_splitter.py ← TOC + Regex                      │   │
│  │  ai_extractor.py     ← Gemini / OpenAI / Ollama         │   │
│  │  markdown_gen.py     ← Jinja2 templates                 │   │
│  │  file_manager.py     ← I/O, vault copy                  │   │
│  │  config_manager.py   ← Settings, encrypted API keys     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Local Storage                                          │   │
│  │  BookSage_Projects/<book-slug>/                         │   │
│  │    raw_text/  ·  chapters/  ·  lessons/  ·  config.json │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────┐
              │   Obsidian Vault Folder   │
              │  Vault/BookNotes/<book>/  │
              │   law-01-outshine.md  ...  │
              └───────────────────────────┘
```

---

## 🔩 Tech Stack Decision

| Layer | Choice | Why |
|-------|--------|-----|
| **Desktop Shell** | **Tauri v2** | Tiny bundle (~5MB vs Electron's 150MB), native Windows feel, Rust backend, ships as a real `.msi` installer |
| **Frontend** | **React 18 + TypeScript** | The GUI mockup is already in React/TSX. Direct reuse of `MainWindow.tsx` + `SettingsDialog.tsx` |
| **Styling** | **Vanilla CSS with CSS variables** | Already defined in `_group.css`. The entire design system is token-based (`--bs-accent`, `--bs-panel`, etc.) |
| **Fonts** | **Inter + JetBrains Mono** | Already locked in via Google Fonts import in `_group.css` |
| **Python Backend** | **Python 3.11+ (sidecar)** | All PDF/AI logic runs as a subprocess bundled inside the Tauri app |
| **PDF Engine** | **PyMuPDF (fitz)** | Fast, reliable, extracts text AND TOC bookmarks |
| **AI APIs** | **Gemini (default), OpenAI, Claude, Ollama** | Multi-provider with a unified interface layer |
| **Templating** | **Jinja2** | Clean Markdown generation from JSON data |
| **Secret Storage** | **keyring (system OS keychain)** | Never store API keys in plaintext |
| **Packaging** | **Tauri bundler → `.msi` installer** | Self-contained, no Python install required for end-user |

---

## 🎨 GUI Design System (from existing mockup)

The design is already defined. The `GUI/` folder contains production-ready components.

### Color Tokens (from `_group.css`)

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `--bs-bg` | `#1a1a1a` | `#f4f4f5` | Root window background |
| `--bs-panel` | `#242424` | `#e8e8ea` | Sidebar, toolbar, footer |
| `--bs-surface` | `#2e2e2e` | `#dddde0` | Cards, inputs |
| `--bs-accent` | `#009688` | `#00796b` | Primary actions, highlights |
| `--bs-done` | `#4caf50` | `#388e3c` | Success states |
| `--bs-process` | `#ff9800` | `#e65100` | In-progress spinner |
| `--bs-error` | `#f44336` | `#c62828` | Error badges |

### UI Layout (three-panel, from `MainWindow.tsx`)

```
┌────────────────────────────────────────────────────────────────┐
│  Title Bar: BookSage – PDF to Obsidian Lessons        [─][□][✕] │
├────────────────────────────────────────────────────────────────┤
│  [Open PDF] [Extract Text] [Split Chapters] | [✦ Generate]     │
│  [Export All]                              ☀️━●  [Settings]    │
├──────────────┬─────────────────────────┬───────────────────────┤
│ Chapters(48) │  Raw Text │AI Output│MD  │  Project Name        │
│ ──────────── │ ─────────────────────  │  Output Folder [..] │
│ ☑ 1 Never.. │                         │  ✅ Vault Sync Ready  │
│ ☑ 2 Never.. │   Law 3: Conceal Your  │  [Export All →Obsidian│
│ ☑ 3 Conceal │   Intentions           │  ──────────────────── │
│ ⟳ 4 Always. │                         │  Progress: 15/48 ███░│
│ ☑ 5 So Much │   Core Principle: ...  │  ──────────────────── │
│ □ 6 Court.. │   Key Tactics:         │  📊 Donut + Bar Charts│
│ ✗ 7 Get Oth │   Historical Example:  │  ──────────────────── │
│ □ 8 Make... │                         │  Export Log           │
│   ...        │   847 words · 4,231 ch │  [10:42] ✓ Law 1 ... │
├──────────────┴─────────────────────────┴───────────────────────┤
│  PDF: 48_laws.pdf | 48 chapters | 15 processed  Model: gemini  │
└────────────────────────────────────────────────────────────────┘
```

---

## 📁 Final Project Folder Structure

```
BookSage/
├── .agents/                    ← AG Kit (agents, skills, workflows)
├── GUI/                        ← Design mockup reference files
├── src-tauri/                  ← Tauri Rust shell
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       └── main.rs             ← IPC commands + sidecar launch
├── src/                        ← React frontend
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css               ← Global styles (includes _group.css tokens)
│   └── components/
│       ├── MainWindow.tsx      ← Port from GUI/
│       ├── SettingsDialog.tsx  ← Port from GUI/
│       ├── DonutChart.tsx      ← Extract from MainWindow
│       ├── ActivityBarChart.tsx
│       ├── ToolbarButton.tsx
│       └── StatusBadge.tsx
├── python/                     ← Python backend sidecar
│   ├── requirements.txt
│   ├── main.py                 ← CLI entry point (called by Tauri)
│   ├── pdf_handler.py          ← PyMuPDF extraction
│   ├── chapter_splitter.py     ← TOC + regex splitting
│   ├── ai_extractor.py         ← Multi-provider AI client
│   ├── markdown_gen.py         ← Jinja2 → .md files
│   ├── file_manager.py         ← File I/O + vault copy
│   ├── config_manager.py       ← Encrypted settings (keyring)
│   └── templates/
│       └── chapter.md.j2       ← Obsidian-flavoured Markdown template
├── BookSage_Projects/          ← Runtime output (gitignored)
│   └── 48_laws_of_power/
│       ├── raw_text/
│       │   ├── full.txt
│       │   └── chapters/
│       │       ├── 01_Chapter_1.txt
│       │       └── ...
│       ├── lessons/
│       │   ├── 01_Chapter_1.md
│       │   └── ...
│       └── config.json
├── .gitignore
├── README.md
└── RoadMap.md                  ← This file
```

---

## 🤖 AI Integration — JSON Schema

Every AI call returns a **strict JSON object** with this schema:

```json
{
  "chapter_title": "Law 3: Conceal Your Intentions",
  "chapter_number": 3,
  "summary": "Narrative recap of what the chapter covers...",
  "teachings": [
    {
      "technique": "Use Decoys",
      "explanation": "Feign interest in something you do not actually want..."
    }
  ],
  "core_lesson": "The single most actionable insight from this chapter.",
  "implementation_steps": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ],
  "supporting_quotes": [
    "Direct quote from the text that grounds the lesson..."
  ],
  "obsidian_tags": ["#strategy", "#power", "#deception"],
  "difficulty_to_implement": "Medium"
}
```

**System Prompt Template** (stored in Settings → Prompt Template tab):

```
You are an expert book analyst. Analyze the following chapter text and return a 
JSON object that strictly matches the provided schema. Extract the author's 
actual teachings — do NOT summarize, do NOT generalize. Ground every insight 
with a direct quote from the text. If you cannot find a quote, omit that field.

Chapter Title: {chapter_title}
Chapter Text:
---
{chapter_text}
---

Return ONLY valid JSON. No markdown fences, no commentary.
```

---

## 📦 Obsidian Output Format

Each `.md` file exported to the vault will use this Jinja2 template (`chapter.md.j2`):

```markdown
---
title: "{{ chapter_title }}"
book: "{{ book_title }}"
chapter: {{ chapter_number }}
tags: {{ obsidian_tags | join(", ") }}
created: {{ created_date }}
source: BookSage v{{ app_version }}
---

# {{ chapter_title }}

> **Core Lesson:** {{ core_lesson }}

## 📖 Summary

{{ summary }}

## 🎓 What the Author Teaches

{% for t in teachings %}
### {{ t.technique }}
{{ t.explanation }}
{% endfor %}

## 🛠️ How to Implement

{% for step in implementation_steps %}
{{ loop.index }}. {{ step }}
{% endfor %}

## 💬 Supporting Quotes

{% for q in supporting_quotes %}
> "{{ q }}"

{% endfor %}

---

*Generated by BookSage · [[{{ book_title }}]] · Difficulty: {{ difficulty_to_implement }}*
```

---

## 🚀 Development Phases

### Phase 0 — Scaffolding & Environment Setup
**Goal:** Tauri + React + Python sidecar all wired and running locally.

- [ ] Install prerequisites: Rust (stable), Node.js 20+, Python 3.11+, Tauri CLI
- [ ] Run `npm create tauri-app@latest BookSage -- --template react-ts`
- [ ] Copy `GUI/MainWindow.tsx`, `GUI/SettingsDialog.tsx`, `GUI/_group.css` into `src/`
- [ ] Split large `MainWindow.tsx` into sub-components (DonutChart, ActivityBarChart, ToolbarButton, StatusBadge)
- [ ] Create `python/` sidecar directory with `requirements.txt`
- [ ] Configure Tauri sidecar to launch `python/main.py`
- [ ] Create `.env.example` with placeholder keys
- [ ] **Commit:** `feat(phase-0): scaffold Tauri+React+Python sidecar`

**Verify:** `npm run tauri dev` opens the window. All three panels visible.

---

### Phase 1 — PDF Engine (Core Backend)
**Goal:** Drop a PDF → get chapter text files split by TOC or regex.

#### 1.1 Text Extraction (`pdf_handler.py`)
- [ ] Implement `extract_text(pdf_path) -> str` using `fitz.open()`
- [ ] Implement `extract_toc(pdf_path) -> list[dict]` to get bookmark entries `{title, page, level}`
- [ ] Handle encrypted/password-protected PDFs (return friendly error)
- [ ] Handle encoding issues (force UTF-8 with error replacement)

#### 1.2 Chapter Splitting (`chapter_splitter.py`)
- [ ] `split_by_toc(pdf_path, toc) -> list[Chapter]` — use page ranges from TOC
- [ ] `split_by_regex(full_text) -> list[Chapter]` — fallback for PDFs with no bookmarks
  - Patterns: `Chapter \d+`, `CHAPTER [A-Z]+`, `Law \d+`, `Part [IVX]+`
- [ ] Allow user-supplied regex override (stored in config)
- [ ] Write `chapter_XX_title.txt` files to `BookSage_Projects/<slug>/raw_text/chapters/`

#### 1.3 CLI Entry Point (`main.py`)
- [ ] Accept JSON-encoded commands on stdin, return JSON responses on stdout
- [ ] Commands: `extract`, `split`, `extract_ai`, `export`, `get_config`, `save_config`

**Commit:** `feat(phase-1): PDF extraction and chapter splitting engine`

**Verify:** `python main.py '{"cmd":"extract","pdf":"48_laws.pdf"}'` produces chapter `.txt` files.

---

### Phase 2 — AI Extractor Module
**Goal:** Given a chapter `.txt` file, return validated JSON lesson data.

#### 2.1 Unified AI Client (`ai_extractor.py`)
- [ ] Abstract `AIClient` base class with `extract(chapter_title, chapter_text) -> dict`
- [ ] `GeminiClient` — uses `google-generativeai`, structured output via `response_schema`
- [ ] `OpenAIClient` — uses `openai`, structured output via `response_format: json_schema`
- [ ] `ClaudeClient` — uses `anthropic`, output parsed from markdown code fence
- [ ] `OllamaClient` — calls `http://localhost:11434/api/chat`, format-enforced via system prompt
- [ ] Retry logic: 3 attempts with exponential backoff on rate limit / timeout errors
- [ ] Token estimation before call (warn if chapter > 50k chars)

#### 2.2 JSON Validation
- [ ] Validate response against the defined schema (all required fields present)
- [ ] If validation fails, attempt a one-shot "fix" prompt: "Your last response was missing fields. Return corrected JSON."
- [ ] If still invalid after retry, save raw response as `.err.json` and mark chapter as `error`

#### 2.3 Prompt Template System
- [ ] Store default system prompt in `config.json` under `prompt_template`
- [ ] Allow user to edit via Settings → Prompt Template tab
- [ ] Support placeholders: `{chapter_title}`, `{chapter_text}`, `{book_title}`

**Commit:** `feat(phase-2): multi-provider AI extractor with JSON validation`

**Verify:** `python main.py '{"cmd":"extract_ai","chapter_path":"...","provider":"gemini"}'` returns valid JSON.

---

### Phase 3 — GUI Skeleton (Frontend)
**Goal:** React app matches the mockup pixel-perfectly. File dialog and chapter list work.

#### 3.1 Component Setup
- [ ] Port all 5 components from `GUI/` into `src/components/`
- [ ] Set up Tauri `invoke()` wrapper utilities in `src/lib/tauri.ts`
- [ ] Wire "Open PDF" button → Tauri `open()` dialog → `invoke('cmd_extract', {path})`
- [ ] Wire chapter list to display state (array of Chapter objects from backend)
- [ ] Status badges update in real-time (pending / processing / done / error)

#### 3.2 State Management
- [ ] `useBookStore` (Zustand) — global state: current book, chapters[], processing status
- [ ] `useSettingsStore` (Zustand) — API key, model, provider, output folder
- [ ] Persist settings to Tauri's app data directory (not plaintext)

#### 3.3 Settings Dialog
- [ ] "AI Provider" tab: provider dropdown, API key field (masked), Test Connection button
- [ ] "Prompt Template" tab: editable textarea with `{chapter_title}`, `{chapter_text}` placeholders
- [ ] "Output Schema" tab: read-only JSON schema preview
- [ ] "Chapter Detection" tab: regex pattern override field, test against loaded PDF

**Commit:** `feat(phase-3): GUI skeleton with file dialog and chapter list`

**Verify:** Load a PDF → chapter list populates correctly. All tabs in Settings open.

---

### Phase 4 — Full Integration Loop
**Goal:** Click "Generate Lessons" → app processes all chapters → results appear in center panel.

#### 4.1 Processing Pipeline
- [ ] "Generate Lessons" button triggers async processing loop
- [ ] Each chapter: set status to `process` → call AI → parse result → set status to `done` or `error`
- [ ] Process chapters in configurable batch size (default: 1 at a time to avoid rate limits)
- [ ] Allow user to pause / resume processing
- [ ] Allow user to select specific chapters and re-process only those

#### 4.2 Center Panel — Preview/Editor
- [ ] **Raw Text tab:** Displays the extracted chapter `.txt` content
- [ ] **AI Output tab:** Renders the structured lesson data as formatted HTML/Markdown
- [ ] **Markdown Source tab:** Shows the generated `.md` file source, fully editable
- [ ] "Save edits" button in Markdown Source tab persists changes before export

#### 4.3 Progress & Logging
- [ ] Progress bar in right panel: `X / N chapters`
- [ ] Donut chart updates live as chapters complete
- [ ] Export log scrolls and appends timestamped events with color-coded status
- [ ] Activity bar chart updates daily counts from `config.json` history

**Commit:** `feat(phase-4): full AI processing pipeline with live progress`

**Verify:** Run on a 5-chapter test PDF. All 5 reach "done" state. Center panel shows formatted lesson.

---

### Phase 5 — Markdown Generation & Obsidian Export
**Goal:** Beautiful `.md` files land in the correct Obsidian vault folder.

#### 5.1 Markdown Generator (`markdown_gen.py`)
- [ ] Load `chapter.md.j2` template from `python/templates/`
- [ ] Render with Jinja2: inject all JSON fields + metadata (book title, date, app version)
- [ ] Support Obsidian-flavoured features:
  - YAML frontmatter (`title`, `book`, `chapter`, `tags`, `created`)
  - `[[Book Title]]` wiki-link at bottom
  - Obsidian callout blocks for Core Lesson: `> [!tip]`
  - Tag format: `#strategy` (not `#"strategy"`)

#### 5.2 File Manager & Vault Sync (`file_manager.py`)
- [ ] Write `.md` files to `BookSage_Projects/<slug>/lessons/`
- [ ] "Export All to Obsidian" copies all `done` chapters to user-selected vault folder
- [ ] Conflict resolution dialog: Overwrite / Skip / Rename with timestamp
- [ ] "Export Single" option via right-click on any chapter in the list

#### 5.3 Master Index File
- [ ] Generate `_index.md` at vault root: a table of all chapters with links and metadata
- [ ] Format: `| Chapter | Core Lesson | Tags | Status |`

**Commit:** `feat(phase-5): Obsidian markdown generation and vault export`

**Verify:** Export 48 Laws → open Obsidian → 48 `.md` files appear with correct frontmatter + formatting.

---

### Phase 6 — Settings, Error Handling & Config
**Goal:** Full settings dialog works. API keys stored securely. Errors are recoverable.

- [ ] API key saved to OS keychain via `keyring` library (never written to disk)
- [ ] "Test Connection" button validates key with a minimal API call
- [ ] Config file `config.json` stores: provider, model, temperature, max_tokens, output_folder, last_used_book
- [ ] Error recovery: failed chapters show a "Retry" button
- [ ] Batch retry: "Retry All Failed" button
- [ ] Timeout handling: configurable timeout (default 30s), shown in log
- [ ] Rate limit detection: auto-pause + countdown timer shown in UI

**Commit:** `feat(phase-6): settings, secure key storage, error recovery`

---

### Phase 7 — Packaging & Distribution
**Goal:** A single `.msi` installer a non-technical user can run on any Windows machine.

- [ ] Bundle Python sidecar using PyInstaller → single `booksage_engine.exe`
- [ ] Include sidecar in Tauri's resource directory
- [ ] Configure `tauri.conf.json` for Windows installer (NSIS or WiX)
- [ ] Code sign the executable (optional but recommended for SmartScreen bypass)
- [ ] Test on a clean Windows VM (no Python, no Node installed)
- [ ] Write `README.md` with: install steps, first-run guide, Gemini free tier setup

**Commit:** `feat(phase-7): production packaging as Windows installer`

**Verify:** Install from `.msi` on a clean VM → app launches → successfully processes a PDF.

---

### Phase 8 — Polish & Future Features (Post-MVP)
> These are non-blocking enhancements for after the core is working.

- [ ] **Batch book processing:** Queue multiple PDFs
- [ ] **Book library view:** History of all processed books with search
- [ ] **Custom Obsidian templates:** Let user define their own Jinja2 template
- [ ] **Vocabulary extractor:** Pull rare/domain-specific words per chapter with definitions
- [ ] **Mind map export:** Generate a visual map of all laws/principles (Mermaid diagram in `.md`)
- [ ] **Auto-tag suggestions:** AI suggests relevant tags based on themes
- [ ] **Reading progress tracker:** Mark chapters as "reviewed" inside the app
- [ ] **macOS/Linux support:** Tauri is cross-platform; backend already is

---

## ⚠️ Pitfalls & Mitigations

| Challenge | Mitigation |
|-----------|------------|
| **PDF has no TOC** | Regex fallback covers 90% of cases. UI offers "Manual Split Mode": drag handles to set page ranges |
| **Scanned PDF (image-based)** | Detect text extraction failure → show error: "This PDF appears to be scanned. Please use an OCR tool first." |
| **AI hallucination** | Grounded prompts require direct quotes. User can review in the AI Output tab before export. |
| **Chapter exceeds token limit** | Auto-chunk: split at paragraph boundaries, run AI on each chunk, merge results |
| **API rate limits** | Exponential backoff + configurable delay between calls. Default: 1 req/2s |
| **API cost** | Default provider is Gemini free tier (1,500 req/day). 48 chapters = 48 calls. All within free tier. |
| **Character encoding** | `fitz` returns Unicode. All writes use `encoding='utf-8'` |
| **Export folder conflict** | Three-option dialog: Overwrite / Skip / Create timestamped subfolder |
| **App update** | Tauri has built-in `tauri-plugin-updater` for auto-updates |

---

## 🔁 Git Branching Strategy

```
main          ← Always production-ready. Tagged releases here.
  └── dev     ← Integration branch for all phases
       ├── phase/0-scaffold
       ├── phase/1-pdf-engine
       ├── phase/2-ai-extractor
       ├── phase/3-gui-skeleton
       ├── phase/4-integration
       ├── phase/5-obsidian-export
       ├── phase/6-settings
       └── phase/7-packaging
```

**Rule:** Every phase gets its own branch. Merge to `dev` when complete. Merge `dev` → `main` at each milestone. Commit frequently — at least once per sub-task.

---

## 🧪 Testing Strategy

| Type | Tool | What |
|------|------|------|
| Unit (Python) | `pytest` | pdf_handler, chapter_splitter, ai_extractor (mock API) |
| Integration (Python) | `pytest` | Full pipeline on sample PDFs |
| E2E (GUI) | Playwright + Tauri | File dialog, chapter list, export workflow |
| Manual | Dev | Visual review of generated `.md` in Obsidian |

---

## 📊 Success Metrics (MVP Definition of Done)

- [ ] App loads a 48-chapter PDF in < 5 seconds
- [ ] Chapter splitting is correct for ≥ 95% of TOC-based books
- [ ] AI extraction succeeds on first try for ≥ 90% of chapters
- [ ] Generated `.md` opens in Obsidian with correct frontmatter and tags
- [ ] App packages as a single `.msi` and installs on a clean Windows machine
- [ ] Zero API keys stored in plaintext on disk

---

*This roadmap is a living document. Update it after each phase completion.*