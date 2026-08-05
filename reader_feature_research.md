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
| Smooth page rendering (canvas) | All | 🔴 CORE | Already done |
| Single page / Two-page spread view | Adobe, Foxit | 🔴 CORE | Already done |
| Continuous scroll mode | Adobe, Readwise | 🔴 CORE | Already done |
| Zoom in/out + fit-to-width | All | 🔴 CORE | Already done |
| Page jump input (go to page X) | All | 🔴 CORE | Already done |
| Keyboard shortcuts (Arrow keys, PgUp/Dn) | Sumatra, Foxit | 🔴 CORE | Already done |
| Table of Contents sidebar | Adobe, Foxit, Okular | 🔴 CORE | Already done |
| Thumbnail strip / page preview | Adobe, Foxit | 🟡 HIGH | Already done |
| Remember last read position | Kindle, Readwise | 🔴 CORE | Already done |
| Reading progress bar | Kindle, Moon+ | 🔴 CORE | Already done |
| Distraction-free / Focus mode | Readwise, Moon+ | 🟡 HIGH | Already done |

---

## 2. 🎨 Display & Themes

| Feature | Source App | Priority | Notes |
|---------|-----------|----------|-------|
| Dark mode / Night mode | All | 🔴 CORE | Already done |
| Sepia / Warm tone mode | Kindle, Moon+ | 🟡 HIGH | Already done |
| True black mode (OLED) | Moon+ | 🟢 NICE | Already done |
| Custom background color picker | Moon+ | 🟢 NICE | Already done |
| Invert PDF colors (white-on-black) | Sumatra, Okular | 🟡 HIGH | Already done |
| Font size control (for reflowed text) | Kindle, Readwise | 🟡 HIGH | Already done (Notes Viewer) |
| Line spacing & margin control | Moon+, Readwise | 🟢 NICE | Already done (Margin Crop) |

---

## 3. 🖊 Annotation & Highlights

| Feature | Source App | Priority | Notes |
|---------|-----------|----------|-------|
| Highlight text in multiple colors | Adobe, Readwise, Kindle | 🔴 CORE | Already done |
| Underline / Strikethrough text | Adobe, Foxit | 🟡 HIGH | Already done |
| Sticky note / Pop-up comment on highlight | Adobe, Foxit, Xodo | 🟡 HIGH | Already done |
| Draw / freehand annotation | Drawboard, Adobe | 🟢 NICE | Already done (with undo/redo/eraser) |
| Annotation sidebar / list | Adobe, Readwise | 🟡 HIGH | Already done |
| Export annotations to Markdown | Readwise | 🔴 CORE | Not done |
| Search within annotations | Readwise, Adobe | 🟡 HIGH | Not done |
| Highlight sync across sessions | Readwise, Kindle | 🔴 CORE | Already done |

---

## 4. 🤖 AI Integration (BookSage's Core Edge)

| Feature | Source App | Priority | Notes |
|---------|-----------|----------|-------|
| Select text → AI explain/summarize | Readwise Ghostreader | 🔴 CORE | Not done (Phase 6 Copilot) |
| Select text → Simplify language | Readwise | 🔴 CORE | Not done (Phase 6 Copilot) |
| Select text → Translate | Readwise, Adobe | 🟡 HIGH | Not done (Phase 6 Copilot) |
| Chat with the document | Readwise, Adobe AI | 🔴 CORE | Not done (Backend done, UI pending Phase 6) |
| AI-generated chapter summary | Readwise | 🔴 CORE | Already done |
| AI-generated "Story So Far" recap | Kindle AI | 🟡 HIGH | Not done |
| AI themed highlights (find connections) | Readwise | 🟢 NICE | Not done |
| Inline word definition on long-press | Kindle, Readwise | 🟡 HIGH | Not done |

---

## 5. 🔍 Search

| Feature | Source App | Priority | Notes |
|---------|-----------|----------|-------|
| Full-text search within current PDF | All | 🔴 CORE | Already done |
| Search with highlight & jump | Adobe, Foxit | 🔴 CORE | Already done |
| Search across all books in library | Readwise | 🟡 HIGH | Not done |

---

## 6. 📐 Layout & Navigation

| Feature | Source App | Priority | Notes |
|---------|-----------|----------|-------|
| Split view (Book + Notes side-by-side) | iPad Reader apps | 🔴 CORE | Not done (Pending Phase 5) |
| Bookmarks (mark a specific page) | Adobe, Kindle, Foxit | 🟡 HIGH | Already done |
| Bookmark sidebar | Adobe, Foxit | 🟡 HIGH | Already done |
| Chapter overview panel | Adobe, Readwise | 🔴 CORE | Already done |
| Minimap scroll indicator | PDF-XChange | 🟢 NICE | Not done |

---

## 7. 📊 Reading Stats & Gamification

| Feature | Source App | Priority | Notes |
|---------|-----------|----------|-------|
| Reading time estimate ("X min left") | Kindle, Readwise | 🟡 HIGH | Not done |
| Total pages read today/this week | Kindle | 🟡 HIGH | Not done |
| Reading streak counter | Kindle | 🟢 NICE | Not done |
| Time spent reading per book | Moon+ | 🟢 NICE | Not done |

---

## 8. 🎧 Audio & Accessibility

| Feature | Source App | Priority | Notes |
|---------|-----------|----------|-------|
| Text-to-speech (TTS) | Kindle, Moon+, Readwise | 🟡 HIGH | Not done |
| Adjustable TTS speed | Moon+, Kindle | 🟢 NICE | Not done |
| Word highlighting during TTS | Readwise Audio | 🟡 HIGH | Not done |

---

## 9. ⌨️ Keyboard & Power User Shortcuts

| Feature | Source App | Priority | Notes |
|---------|-----------|----------|-------|
| Vim-style keybindings (J/K navigation) | Sumatra | 🟢 NICE | Not done |
| Customizable keyboard shortcuts | PDF-XChange | 🟢 NICE | Not done |
| Arrow key / scroll wheel page turn | All | 🔴 CORE | Already done |
| `Ctrl+F` full-text search | All | 🔴 CORE | Already done |
| `Ctrl++/-` zoom | All | 🔴 CORE | Already done |
| Space bar for next page | Sumatra, Foxit | 🟡 HIGH | Already done |
| `Ctrl+Z/Y` Undo/Redo | BookSage | 🔴 CORE | Already done |

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
