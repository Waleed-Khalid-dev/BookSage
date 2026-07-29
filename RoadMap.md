📘 BookSage: End‑to‑End PDF → Obsidian Lesson Extractor
Roadmap & System Blueprint

1. App Vision & Core Purpose
One‑sentence mission
Drop a PDF book in, press a button, get chapter‑by‑chapter Markdown files—each containing a summary, the author’s teachings, the core lesson, and a practical implementation guide—all saved directly into your Obsidian vault.

Goal
Eliminate the time‑sink of manually reading and note‑taking from dense non‑fiction books (Robert Greene style). Replace it with AI‑generated, structured “lesson DNA” that you can review in Obsidian.

Target user
You. A Windows power‑user who owns digital copies of books and wants to absorb their essence fast, with a local‑first GUI, complete control over output, and no coding required.

2. Core Features (What the App Does)
2.1 PDF Ingestion & Text Extraction
Select a .pdf file via file dialog.

Extract full plain text using a fast, layout‑preserving engine (PyMuPDF under the hood).

Also extract the embedded Table of Contents (bookmarks) if present (this is the smart chapter splitter).

2.2 Intelligent Chapter Splitting
Primary method: Use the PDF’s own TOC to locate each chapter’s start/end page.

Example: “Chapter 1: Never Outshine the Master” → pages 1–18.

Fallback method: If no TOC exists, split by regex detecting patterns like Chapter \d+, CHAPTER ONE, etc.

Result: A list of separate .txt files, one per chapter, saved in a project folder.

2.3 AI‑Powered Lesson Extraction (per chapter)
For each chapter text, call an external AI model (your API key) with a structured prompt to extract:

Summary: Concise “what happens” (narrative recap).

What the author teaches: Every technique, law, or principle presented.

Core lesson: The single most actionable insight.

How to implement: Step‑by‑step application in real life.

(Bonus) Direct quotes that support each point (to ground against hallucination).

The AI must return a JSON object following a strict schema, so the app can parse it reliably.

2.4 Markdown Generation & Obsidian Export
Convert the JSON into beautifully formatted Markdown.

Each chapter becomes one .md file, or you can combine all chapters into a master document with ![[link]] (your choice).

One‑click export to a user‑specified Obsidian vault folder (e.g., C:\Obsidian\Vault\BookNotes\48Laws).

2.5 Interactive Chapter Management
List all detected chapters with their titles and page ranges.

Allow the user to preview the raw text of any chapter.

Manually edit the AI output before saving (optional).

Re‑run extraction for a single chapter if needed.

Track progress: “Chapter 3/48 processed…”

2.6 Configuration & Settings
API key management (Gemini, OpenAI, Claude, or local Ollama endpoint).

Model selection and parameter tweaking (temperature, max tokens).

Output folder picker (with a browse button).

Option to include/exclude quotes, or adjust prompt template.

3. User Interface Design (GUI Blueprint for the Picture)
You mentioned you’ll paste a GUI picture into Antigravity. Here’s exactly what that screen should contain, so your tool builds the right thing.

3.1 Main Window Layout (Windows‑native style)
Title bar: BookSage – PDF to Obsidian Lessons

Top Toolbar / Ribbon:

Open PDF button (folder icon)

Extract Text button (document icon)

Split Chapters button (scissors icon)

Generate Lessons button (brain/sparkle icon)

Export All button (Obsidian vault icon)

Settings gear icon

Main Content Area – Three‑Panel Layout (resizable):

Left Panel (Chapter List)

A vertical list of chapters with checkboxes.

Each item shows: chapter number, title, page range, and status (unprocessed / processing / done / error).

Right‑click context menu: “Preview raw text”, “Re‑extract”, “Edit markdown”.

Center Panel (Preview / Editor)

Tabs: Raw Text | AI Output (Formatted) | Markdown Source.

When a chapter is selected, you see the extracted text or the AI‑generated lesson.

The Markdown Source tab allows manual edits before saving.

Right Panel (Export & Vault)

Current project name (derived from PDF filename).

Output folder path (with a “Change” button).

Obsidian vault sync status: “Will save to Vault/BookNotes/48Laws”.

A big “Export All to Obsidian” button.

Progress bar and log/output console below.

Status Bar at the bottom

Shows: “PDF loaded: 48_laws.pdf | 48 chapters detected | 15 chapters processed”

3.2 Settings Dialog (pop‑up)
AI Provider: Dropdown [Gemini, OpenAI, Claude, Local (Ollama)].

API Key field (masked) with “Test Connection” button.

Model name: Text field (e.g., gemini-1.5-pro).

Prompt Template tab: editable text area with placeholders {chapter_title}, {chapter_text}.

Output Schema preview: shows the expected JSON structure.

Fallback splitter options: regex pattern for manual chapter detection.

Save / Cancel buttons.

4. Technical Architecture (for Antigravity to Set Up)
The entire app will be a single Windows executable built with a GUI framework. Here are the logical components and how they connect:

4.1 Frontend (GUI)
Framework: Electron + React/Vue (or Tauri for lighter weight) if you want web‑based UI packed as desktop. Alternatively, Python + PySide6/PyQt6 for a native‑looking Windows app.

Antigravity suggestion: Use Tauri + vanilla HTML/CSS/JS for a small, fast bundle, or let the tool choose. The roadmap is technology‑agnostic.

The GUI calls a local backend service (or direct Python functions) via IPC.

4.2 Backend (Processing Engine)
All heavy lifting is done by Python scripts that the GUI triggers as subprocesses or via a Python‑embedded runtime (e.g., PyOxidizer, Nuitka).
Modules:

pdf_handler.py – PyMuPDF for text + TOC extraction.

chapter_splitter.py – TOC logic and regex fallback.

ai_extractor.py – Sends chapter text to chosen AI API, parses JSON output.

markdown_generator.py – Converts JSON to Markdown using a Jinja2 template.

file_manager.py – Saves chapter .txt and final .md files, copies to Obsidian folder.

4.3 AI Integration
APIs: Gemini API (free tier is generous), OpenAI, or Anthropic.

All calls use structured output (e.g., Gemini’s response_schema parameter, OpenAI’s function calling, or just a strict system prompt).

Fallback local model via Ollama’s API (port 11434) – no internet needed.

The app should store the last used model and key in a local config file (encrypted).

4.4 Data Flow (End‑to‑End)
text
[PDF file]
   ↓
PyMuPDF → raw text + TOC
   ↓
Split by TOC → chapter_01.txt … chapter_N.txt
   ↓  (for each)
AI API ← chapter_text + structured prompt
   → JSON {summary, teachings, lesson, implementation}
   ↓
JSON + markdown template → chapter_01.md … chapter_N.md
   ↓
Copy all .md files → user’s Obsidian vault folder
   ↓
Done. User opens Obsidian and sees the notes.
Project folder structure inside a temp directory:

text
BookSage_Projects/
  └── 48_laws_of_power/
       ├── raw_text/
       │    ├── full.txt
       │    └── chapters/
       │         ├── 01_Chapter_1.txt
       │         ├── 02_Chapter_2.txt
       │         └── ...
       ├── lessons/
       │    ├── 01_Chapter_1.md
       │    ├── 02_Chapter_2.md
       │    └── ...
       └── config.json (settings for this book)
5. User Journey Step‑by‑Step
Launch BookSage.exe – a clean window appears.

Click Open PDF – select The 48 Laws of Power.pdf.

The app loads the file, extracts text and TOC.

Left panel populates with 48 chapter entries.

Status bar: “48 chapters found using PDF bookmarks.”

(Optional) Click a chapter to preview raw text in centre panel. Verify splitting is correct.

(First time only) Open Settings → enter Gemini API key, select model, save.

Click Generate Lessons.

The app loops through unprocessed chapters (or selected ones).

Progress bar updates; logs appear in the console.

The left panel updates statuses.

As each chapter is done, the centre panel shows the AI‑generated Markdown. You can edit if needed.

Click Export All to Obsidian.

A dialog asks for Obsidian vault folder (or uses the pre‑configured path).

All .md files are copied there.

A confirmation popup: “48 files exported to Vault/BookNotes/48Laws”.

Open Obsidian – the book notes appear in the file explorer, ready to read, link, and review.

6. Development Milestones (Roadmap for Building)
Tell Antigravity to follow this phased build. Each phase is a working increment.

Phase 1: The PDF Engine (Core)
Build a background Python script that takes a PDF path and outputs:

full.txt

A folder of chapter_XX.txt files split by TOC (or regex).

Package as a callable CLI, so the GUI can just run a command.

Milestone: Dropping a PDF on the script produces separate chapter files.

Phase 2: The AI Extractor Module
Write the prompt template and JSON schema.

Create a Python function that reads a chapter text, sends it to the chosen AI API, and returns the parsed dictionary.

Test with Gemini’s free tier on a few sample chapters.

Milestone: From a single .txt chapter, you get a validated JSON with the four fields.

Phase 3: The GUI Skeleton
Set up a window with the three‑panel layout (use placeholder data).

Implement file open dialog, chapter list population, and raw text preview.

Wire the “Open PDF” button to call Phase 1’s script asynchronously.

Milestone: You can load a PDF and see the chapter list.

Phase 4: Full Integration – The Loop
Connect “Generate Lessons” button to iterate over chapters, call AI script, display results.

Add progress bar and log console.

Enable Markdown preview and editing.

Milestone: App can process an entire book with AI and show results in the GUI.

Phase 5: Export & Obsidian Sync
Build the Markdown generator using a template (you can define a beautiful template).

Implement “Export All” – copies files to the chosen Obsidian folder.

Add Obsidian‑flavoured features: wikilinks [[Chapter 2]], frontmatter (tags, aliases).

Milestone: Full cycle working – PDF → Obsidian vault.

Phase 6: Polish & Settings
Settings dialog: API key management, model switch, prompt editing.

Error handling: If a chapter fails, retry button, skip, log the error.

Dark mode / theming (optional).

Package as a single .exe installer using PyInstaller, Nuitka, or Tauri’s bundler.

Milestone: Ready to hand to any non‑technical user.

7. Potential Pitfalls & Mitigations
Challenge	Mitigation
PDF TOC is missing	Fallback to regex split. Offer user manual correction: drag to set page ranges.
AI hallucination / missed teachings	Use grounded prompts with “include direct quotes” and verify JSON schema. Let user re‑extract.
Large books exceed AI token limit	Process chapter‑by‑chapter; each chapter is well within limits. The biggest Greene chapter is under 10k tokens.
API costs	Default to Gemini free tier (1,500 req/day). Add local Ollama option for 100% free.
Character encoding issues (special symbols)	Use UTF‑8 consistently.
Export folder already has files	Ask user to overwrite, merge, or create a new subfolder with timestamp.