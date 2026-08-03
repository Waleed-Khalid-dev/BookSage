# 📚 BookSage Reader — Feature Research
> Aggregated from: Adobe Acrobat, Readwise Reader, Kindle, Foxit, PDF-XChange, Moon+ Reader, Drawboard PDF, Xodo, Sumatra PDF

---

## 🏆 Priority Legend
| Tag | Meaning |
|-----|---------|
| 🔴 **CORE** | Must-have for any serious reader. Users will expect it. |
| 🟡 **HIGH** | Strong differentiator. Makes the product feel premium. |
| 🟢 **NICE** | Bonus feature that wows power users. |

---

## 1. 📖 Core Reading Experience

| Feature | Source App | Priority | Notes |
|---------|-----------|----------|-------|
| Smooth page rendering (canvas) | All | 🔴 CORE | Already done with pdfjs-dist |
| Single page / Two-page spread view | Adobe, Foxit | 🔴 CORE | Side-by-side reading mode |
| Continuous scroll mode | Adobe, Readwise | 🔴 CORE | Scroll through all pages like a webpage |
| Zoom in/out + fit-to-width | All | 🔴 CORE | Already done |
| Page jump input (go to page X) | All | 🔴 CORE | Already done |
| Keyboard shortcuts (Arrow keys, PgUp/Dn) | Sumatra, Foxit | 🔴 CORE | Fast navigation without mouse |
| Table of Contents sidebar | Adobe, Foxit, Okular | 🔴 CORE | Jump directly to chapters from TOC |
| Thumbnail strip / page preview | Adobe, Foxit | 🟡 HIGH | Small previews of all pages |
| Remember last read position | Kindle, Readwise | 🔴 CORE | Reopen book at the exact page you left |
| Reading progress bar | Kindle, Moon+ | 🔴 CORE | % progress shown at bottom |
| Distraction-free / Focus mode | Readwise, Moon+ | 🟡 HIGH | Hide all UI, only show the text |

---

## 2. 🎨 Display & Themes

| Feature | Source App | Priority | Notes |
|---------|-----------|----------|-------|
| Dark mode / Night mode | All | 🔴 CORE | Already using dark theme — great |
| Sepia / Warm tone mode | Kindle, Moon+ | 🟡 HIGH | Eye-friendly warm color filter |
| True black mode (OLED) | Moon+ | 🟢 NICE | Pure black background |
| Custom background color picker | Moon+ | 🟢 NICE | User-defined reading background |
| Invert PDF colors (white-on-black) | Sumatra, Okular | 🟡 HIGH | Makes scanned PDFs readable at night |
| Font size control (for reflowed text) | Kindle, Readwise | 🟡 HIGH | For EPUBs / clean view mode |
| Line spacing & margin control | Moon+, Readwise | 🟢 NICE | Readability fine-tuning |

---

## 3. 🖊 Annotation & Highlights

| Feature | Source App | Priority | Notes |
|---------|-----------|----------|-------|
| Highlight text in multiple colors | Adobe, Readwise, Kindle | 🔴 CORE | Select text → choose highlight color |
| Underline / Strikethrough text | Adobe, Foxit | 🟡 HIGH | Additional markup modes |
| Sticky note / Pop-up comment on highlight | Adobe, Foxit, Xodo | 🟡 HIGH | Add a private note to any highlight |
| Draw / freehand annotation | Drawboard, Adobe | 🟢 NICE | Stylus/mouse drawing on the PDF |
| Annotation sidebar / list | Adobe, Readwise | 🟡 HIGH | See all highlights in one panel |
| Export annotations to Markdown | Readwise | 🔴 CORE | This is BookSage's killer feature! |
| Search within annotations | Readwise, Adobe | 🟡 HIGH | Find a specific note you made |
| Highlight sync across sessions | Readwise, Kindle | 🔴 CORE | Persist highlights in SQLite DB |

---

## 4. 🤖 AI Integration (BookSage's Core Edge)

| Feature | Source App | Priority | Notes |
|---------|-----------|----------|-------|
| Select text → AI explain/summarize | Readwise Ghostreader | 🔴 CORE | Phase 6 Copilot — already planned |
| Select text → Simplify language | Readwise | 🔴 CORE | "Explain like I'm 5" button |
| Select text → Translate | Readwise, Adobe | 🟡 HIGH | Multi-language support |
| Chat with the document | Readwise, Adobe AI | 🔴 CORE | Ask questions grounded in the book |
| AI-generated chapter summary | Readwise | 🔴 CORE | Already building this in pipeline view! |
| AI-generated "Story So Far" recap | Kindle AI | 🟡 HIGH | Resumption summary after a break |
| AI themed highlights (find connections) | Readwise | 🟢 NICE | "Show me all highlights about leadership" |
| Inline word definition on long-press | Kindle, Readwise | 🟡 HIGH | Tap a word → dictionary + AI explain |

---

## 5. 🔍 Search

| Feature | Source App | Priority | Notes |
|---------|-----------|----------|-------|
| Full-text search within current PDF | All | 🔴 CORE | Ctrl+F to find any word on any page |
| Search with highlight & jump | Adobe, Foxit | 🔴 CORE | Navigate matches with arrow keys |
| Search across all books in library | Readwise | 🟡 HIGH | "Find passages about X in any book" |

---

## 6. 📐 Layout & Navigation

| Feature | Source App | Priority | Notes |
|---------|-----------|----------|-------|
| Split view (Book + Notes side-by-side) | iPad Reader apps | 🔴 CORE | Already in BookSage architecture! |
| Bookmarks (mark a specific page) | Adobe, Kindle, Foxit | 🟡 HIGH | Star/flag important pages |
| Bookmark sidebar | Adobe, Foxit | 🟡 HIGH | List of all saved bookmarks |
| Chapter overview panel | Adobe, Readwise | 🔴 CORE | Left sidebar with TOC chapters |
| Minimap scroll indicator | PDF-XChange | 🟢 NICE | Tiny preview of full doc as you scroll |

---

## 7. 📊 Reading Stats & Gamification

| Feature | Source App | Priority | Notes |
|---------|-----------|----------|-------|
| Reading time estimate ("X min left") | Kindle, Readwise | 🟡 HIGH | "32 minutes left in this chapter" |
| Total pages read today/this week | Kindle | 🟡 HIGH | Reading streak & habit tracking |
| Reading streak counter | Kindle | 🟢 NICE | Motivational daily habit tracking |
| Time spent reading per book | Moon+ | 🟢 NICE | Reading journal stats |

---

## 8. 🎧 Audio & Accessibility

| Feature | Source App | Priority | Notes |
|---------|-----------|----------|-------|
| Text-to-speech (TTS) | Kindle, Moon+, Readwise | 🟡 HIGH | Listen to any page being read aloud |
| Adjustable TTS speed | Moon+, Kindle | 🟢 NICE | 0.5x to 2.5x playback |
| Word highlighting during TTS | Readwise Audio | 🟡 HIGH | Word lights up as it's spoken |

---

## 9. ⌨️ Keyboard & Power User Shortcuts

| Feature | Source App | Priority | Notes |
|---------|-----------|----------|-------|
| Vim-style keybindings (J/K navigation) | Sumatra | 🟢 NICE | Power user mode |
| Customizable keyboard shortcuts | PDF-XChange | 🟢 NICE | User remaps any key |
| Arrow key / scroll wheel page turn | All | 🔴 CORE | Standard expected behavior |
| `Ctrl+F` full-text search | All | 🔴 CORE | Universal shortcut |
| `Ctrl++/-` zoom | All | 🔴 CORE | Standard zoom shortcut |
| Space bar for next page | Sumatra, Foxit | 🟡 HIGH | One-hand reading |

---

## 🎯 Recommended Build Order for BookSage

### Phase 4.5 (Finish Reader — Immediate Wins)
These are `🔴 CORE` features not yet done that will make the reader actually usable:

1. **`Ctrl+F` full-text search** — Search within the current PDF
2. **TOC sidebar** — Use the book's parsed chapter list to jump to pages
3. **Remember last page** — Save page number to SQLite, restore on open
4. **Progress bar** — Show % completion at the bottom of the reader
5. **Continuous scroll mode** — Scroll through all pages without clicking next
6. **Multi-color highlights** — Let users select and highlight text in 4 colors, saved to DB
7. **Keyboard shortcuts** — Arrow keys, Space, PgUp/PgDn, Ctrl+F

### Phase 5 (Notes) + Phase 6 (Copilot) — Already Planned ✅
The AI Copilot + Chat with Document features are exactly what Readwise Ghostreader does, and BookSage already has the architecture for it.

### Future Phases
- Reading stats & streaks
- Text-to-speech with word highlighting
- Bookmark sidebar
- Sepia/warm theme
- Library-wide search across all books

---

> **Bottom line:** BookSage already has the right architecture. The gap is polish: search, bookmarks, highlights, and session memory. Fill those gaps and BookSage is better than most apps because it also has the AI pipeline + notes viewer built in.
