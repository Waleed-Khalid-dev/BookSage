# 📚 Phase 5 — Notes Viewer Feature Tracker

> **Approach:** Option B — JSON-Driven Structured Layout  
> **Status:** ✅ Implementation Complete  
> **Built:** 2026-08-07

---

## ✅ Completed

### 🗄️ Database (SQLite Migrations)
- [x] `chapters.user_notes TEXT` — freeform personal notes per chapter
- [x] `chapters.studied INTEGER DEFAULT 0` — boolean: user marked chapter as studied
- [x] `chapters.steps_progress TEXT` — JSON array of booleans for implementation steps
- [x] `getChapterUserData()` — reads all three fields for a chapter
- [x] `saveChapterUserData()` — partial update: notes, studied, or steps individually
- [x] `getStudiedCountForBook()` — returns studied/total count for the progress bar

### 🏗️ Architecture
- [x] `NotesViewer.tsx` — full 3-panel layout (sidebar + content)
- [x] `NotesViewer.css` — all scoped styles (~500 lines)
- [x] Integrated with `bookStore` (chapters, bookId, currentBookTitle)
- [x] Integrated with `uiStore` (setActiveView for nav CTAs)

---

## 🔴 CORE Features

### Chapter Navigation Sidebar
- [x] Left panel (~260px, collapsible) listing all `done` chapters
- [x] Each entry: status dot, title, difficulty badge (from JSON)
- [x] Heatmap tints (easy=green, medium=amber, hard=red tint)
- [x] Active chapter highlighted with teal left border
- [x] "X / Y chapters studied" progress bar in sidebar header
- [x] Sidebar collapses with slide animation
- [x] Keyboard nav: `Alt+←` / `Alt+→` to cycle chapters

### JSON Field Rendering (all 8 AI schema fields)
- [x] `core_lesson` — hero callout block (💡, 4px teal border, large bold text)
- [x] `summary` — collapsible card, Brief/Full toggle
- [x] `teachings` — accordion (one-at-a-time expand, chevron, counter badge)
- [x] `implementation_steps` — numbered checklist with checkboxes + progress bar
- [x] `supporting_quotes` — styled blockquotes with `"` icon, teal border
- [x] `difficulty_to_implement` — colored badge (🟢/🟡/🔴) in header & sidebar
- [x] `obsidian_tags` — clickable pill buttons (click to filter)
- [x] `chapter_title` + `chapter_number` — prominent chapter header

### Font Controls
- [x] Font size slider (13px–22px) in toolbar
- [x] Line spacing slider (1.4–2.2) in toolbar

### Graceful States
- [x] Skeleton pulse loader while JSON is being read
- [x] "Not yet extracted" empty state → CTA to Pipeline view
- [x] "No book loaded" state → CTA to Library view
- [x] Error state if JSON is malformed or file missing

---

## 🟡 HIGH Features

### User Personal Notes ("My Reflections")
- [x] Freeform textarea, auto-switches to read (rendered Markdown) on blur
- [x] Edit on click, saves on blur via `saveChapterUserData`
- [x] Stored in `chapters.user_notes` SQLite column
- [x] Rendered with `react-markdown` + `remark-gfm`

### "Mark as Studied" Progress Tracking
- [x] Button in chapter content header (teal outline → filled on studied)
- [x] Toggles `chapters.studied` in SQLite
- [x] Sidebar progress bar updates immediately

### Copy-to-Clipboard Micro-Actions
- [x] Copy icon appears on hover for: core lesson, each teaching, each step, each quote
- [x] "Copied! ✓" toast (auto-dismisses after 1.8s)

### Tag Filter
- [x] Clicking any obsidian_tag pill sets `tagFilter` (UI only — sidebar visual)
- [x] Active tag shown as pill in sidebar header with ✕ to clear

### Copilot Stub (Bridge to Phase 6)
- [x] Text selection → "✦ Copilot" pill appears above selection
- [x] Click shows toast: "AI Copilot coming in Phase 6"

---

## 🟢 NICE Features

### "Key Insights" View Mode
- [x] Toggle in toolbar
- [x] Shows `core_lesson` from ALL chapters in one scrollable list
- [x] Click any insight → jumps to that chapter in normal view

### Flashcard Mode
- [x] Toggle in toolbar
- [x] Shows one `teaching` at a time as a flip card
- [x] Click / Space to flip between technique ↔ explanation
- [x] `←` / `→` keyboard nav + Prev/Flip/Next buttons

### Difficulty Heatmap in Nav
- [x] Chapter nav entries tinted by difficulty (green/amber/red)
- [x] Badge shown under chapter title

### Summary Length Toggle
- [x] "Brief / Full" toggle on summary card

---

## ⏳ Deferred to Later Phases

- [ ] In-Notes Search (`Ctrl+F`) — Phase 5b
- [x] Split View: Reader + Notes side-by-side — Phase 5b
- [x] Obsidian Export per Chapter — Phase 5b (requires Python backend command)
- [ ] TTS on Notes — Phase 5b (reuse SpeechSynthesis from BookReader)

---

> Last updated: 2026-08-07
