# Implementation Plan: Draggable Book Cover Popup & Downward Slide Panel

**Feature Slug:** `draggable-book-cover`  
**Status:** Planned (Aligned via `/grill-me`)  
**Scope:** Visual & Interaction Enhancement for Reader View (`BookReader.tsx`)  
**Created:** 2026-10-04  

---

## 🎯 Architectural Overview & Decisions (From Socratic Interview)

| Decision | Selected Choice | Rationale |
|---|---|---|
| **Trigger Mechanism** | Auto-appear for 4-5s on book/chapter open + top-edge hover/tab summon | Completely unobtrusive while reading; naturally presents context on entry without blocking text |
| **Expanded Panel Layout** | Top-anchored dropdown sheet (~45% width, ~380-420px height) | Mimics a physical top drawer / retractable blind sliding smoothly downward into view |
| **Drag Persistence** | Persist horizontal offset (`localStorage`) across session | Respects user layout preference (e.g. left margin vs right margin) |
| **Backdrop & Styling** | Subtle backdrop blur with soft dim overlay | Makes book artwork and metadata pop sharply without fully occluding reading position |

---

## 🏗️ Components to Build / Modify

### 1. `src/components/reader/BookCoverDrawer.tsx` (New Component)
Dedicated component handling both the compact floating bar and the downward sliding showcase panel.

- **Props:**
  - `bookTitle`: string
  - `bookAuthor`: string
  - `coverUrl`: string | null
  - `currentChapter`: string | null
  - `progressPercent`: number
  - `isOpen`: boolean
  - `onClose`: () => void

- **Internal State & Hooks:**
  - `isCompactVisible`: boolean (controls top retractable popup)
  - `isExpanded`: boolean (controls downward sliding showcase drawer)
  - `horizontalX`: number (persisted in `localStorage.getItem('booksage-cover-drawer-x')`)
  - `isDragging`: boolean
  - Auto-hide timer hook (`4500ms` timeout reset on mouse enter or drag)

---

## 📋 Task Breakdown

### Phase 1: Core Drawer Component (`BookCoverDrawer.tsx`)
- [ ] Build the **Compact Floating Popup**:
  - Thumbnail cover art, Title, Author
  - Center drag handle (`═` icon with `cursor-grab` / `cursor-grabbing`)
  - Close button (`✕`)
  - Pointer/mouse drag handlers for smooth X-axis translation with bounds clamping
  - Auto-hide timer (4.5s) with pause on mouse hover / drag
  - Entrance and exit animations (slide down on enter, slide up into top bar to hide)
- [ ] Build the **Expanded Downward Sliding Showcase**:
  - Downward slide transition (`translate-y-0` from `-translate-y-full`)
  - High-res cover image display with subtle drop-shadow and rounded corners
  - Title, author, reading progress badge
  - Close button & outside click detection
  - Subtle blurred backdrop overlay (`backdrop-blur-sm bg-black/20 dark:bg-black/40`)

### Phase 2: Reader Integration (`BookReader.tsx`)
- [ ] Mount `BookCoverDrawer` in `BookReader.tsx` directly under the header bar.
- [ ] Pass current book metadata (`book.title`, `book.author`, `book.coverUrl`, chapter name, progress).
- [ ] Provide subtle top-edge hover detection zone or tiny reveal pill when retracted so user can bring it back anytime.

### Phase 3: Theme & Polish
- [ ] Support all active themes (Dark, Light, Warm/Sepia) with matching background colors, border styles, and text contrast.
- [ ] Ensure drag handlers do not conflict with text selection in the reader canvas or top toolbar buttons.
- [ ] Verify zero layout shifts or scroll jumping during transitions.

---

## 🧪 Verification Plan
1. **Initial Mount:** Open any book → popup smoothly appears below top bar, shows book cover & info, auto-hides after ~4.5s.
2. **Dragging:** Drag handle left and right → smooth repositioning, stays within window bounds, position persists on reload.
3. **Downward Slide:** Click book thumbnail → top drawer slides downward into view with high-res cover; auto-hide is disabled while open.
4. **Dismissal:** Click outside or press close → drawer slides back upward into ceiling; reader canvas remains undisturbed.
5. **Theme Switching:** Verify contrast in Light, Dark, and Warm themes.
