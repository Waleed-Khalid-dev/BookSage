# BookSage Studio

**An AI-powered book reading and learning studio for Windows.**

Drop in any PDF book. BookSage extracts chapter-by-chapter notes using AI, renders them in a built-in Obsidian-style viewer, and lets you read the original book page-by-page — all with an integrated AI copilot you can invoke on any selected text.

---

## What BookSage Does

- **PDF Ingestion** — Open any PDF book via file dialog. BookSage extracts full text and uses the PDF's table of contents to split the book into individual chapters.
- **AI Lesson Extraction** — For each chapter, BookSage calls your configured AI model (Gemini, OpenAI, Claude, or a local Ollama instance) and extracts: a summary, the author's teachings, the core lesson, and step-by-step implementation guidance — all as structured, validated JSON.
- **Built-in Book Reader** — Read the original PDF page-by-page inside the app, with zoom controls and word-by-word navigation.
- **Obsidian-Style Notes Viewer** — AI-generated notes are rendered as beautiful Markdown with the same visual grammar as Obsidian: red H1/H2 headings, inline code pills, callout blocks, and GFM tables.
- **Integrated AI Copilot** — Select any text in the reader or notes viewer, right-click, and invoke the Copilot. A floating panel appears with quick actions (Summarize, Simplify, Explain like I'm 5, Make shorter/longer) or a free-form chat input. Supports all configured AI providers with a live model-switcher dropdown.
- **Book Library** — A home screen grid showing all your processed books with cover thumbnails, chapter counts, and processing progress.
- **Optional Obsidian Export** — If you use Obsidian, you can still export notes as `.md` files with full frontmatter, wiki-links, and Obsidian callout syntax.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop Shell | Tauri v2 (Rust) |
| Frontend | React 18 + TypeScript |
| Styling | Vanilla CSS with CSS variables |
| PDF Rendering | pdfjs-dist (Mozilla) |
| Markdown Rendering | react-markdown + remark-gfm |
| State | Zustand |
| PDF/AI Backend | Python 3.11 (bundled sidecar) |
| PDF Engine | PyMuPDF (fitz) |
| AI Providers | Gemini, OpenAI, Claude, Ollama |
| Secrets | OS keychain via keyring |
| Installer | Tauri NSIS/WiX → `.msi` |

---

## Status

> 🔨 **Active Development** — Phase 0 (scaffold) in progress.

See [`RoadMap.md`](RoadMap.md) for the full technical blueprint and [`booksage-plan.md`](booksage-plan.md) for the current task list.

---

## Getting Started (Development)

```bash
# Prerequisites: Rust, Node 20+, Python 3.11+
git clone https://github.com/YOUR_USERNAME/BookSage.git
cd BookSage
npm install
cd python && pip install -r requirements.txt && cd ..
npm run tauri dev
```

---

## License

MIT — open source, free to use and modify.
