# Phase 4.5 Reader Polish

## Overview
Implement the complete "Phase 4.5" features as defined in the roadmap, covering CORE, HIGH, and NICE priorities. This ensures the BookSage reader is fully featured with advanced navigation, persistent annotations, diverse reading modes, and reading statistics.

## Project Type
WEB (React / Tauri Desktop App)

## Success Criteria
- **CORE:** TOC sidebar, multi-color persistent highlights, `Ctrl+F` search, progress bar, remember last page, split view.
- **HIGH:** Sepia/Night modes, Thumbnail strip, Focus mode, Bookmarks, Underline/Strikethrough, Sticky notes, Annotation sidebar, Reading stats, TTS stub.
- **NICE:** OLED mode, custom bg colors, minimap, reading streaks, Vim keybindings, custom shortcuts, drawing annotations.
- Database successfully migrated to support all persistence needs (last page, reading time, highlights, bookmarks, etc.).

## Tech Stack
- React / TypeScript
- pdfjs-dist
- SQLite (Tauri SQL plugin)
- Zustand

## File Structure
- `src/components/reader/` (UI, Sidebar, Toolbars)
- `src/components/views/` (Reader layout)
- `src/lib/db/` (Migrations & CRUD)
- `src/store/` (State)

## Task Breakdown

### 1. Database Migrations (Foundation)
- **Agent:** `database-architect`
- **Skills:** `sqlite`
- **INPUT:** `RoadMap.md` schema requirements.
- **OUTPUT:** Migrations for `books` (last_page, reading_time, pages_read), new `highlights` table, new `bookmarks` table.
- **VERIFY:** Tauri app runs SQL without errors.

### 2. Core Reading & Navigation
- **Agent:** `frontend-specialist`
- **Skills:** `react`, `pdfjs-dist`
- **INPUT:** `extract_toc()`, `books.last_page`.
- **OUTPUT:** TOC Sidebar, Thumbnail strip, Remember last page logic, Progress bar, Split view toggle, Vim keybindings toggle.

### 3. Display Modes & UI Polish
- **Agent:** `frontend-specialist`
- **Skills:** `react`, `css`
- **INPUT:** Toolbar UI.
- **OUTPUT:** Sepia mode, Invert/Night mode, OLED mode, Custom bg picker, Distraction-free Focus mode.

### 4. Annotations & Highlights
- **Agent:** `frontend-specialist`
- **Skills:** `react`, `canvas`
- **INPUT:** `pdfjs-dist` text layer.
- **OUTPUT:** Multi-color highlights, Underline/Strikethrough, Sticky notes, Freehand drawing canvas, Annotation sidebar (list of all notes), Export to Markdown function.

### 5. Search Features
- **Agent:** `frontend-specialist`
- **Skills:** `react`, `pdfjs-dist`
- **INPUT:** Search bar UI.
- **OUTPUT:** `Ctrl+F` document search with highlights, Search within annotations sidebar.

### 6. Stats & Extras (TTS, AI Stubs)
- **Agent:** `frontend-specialist`
- **INPUT:** Zustand store, SQLite.
- **OUTPUT:** Reading time estimate, Total pages read, Reading streaks, TTS toggle/speed controls, Copilot feature stubs (Translate, Story recap, Define word).

## ✅ PHASE X Verification
- [ ] Lint & Type Check
- [ ] Database Schema Verification
- [ ] Test Navigation, Persistence, and Rendering Modes
