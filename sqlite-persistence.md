# Phase 3.5: SQLite Persistence Layer

## Goal
Transition from transient in-memory / localStorage storage to a robust, local-first SQLite database for persisting books, chapters, and extraction progress. This enables long-term sessions, app restarts, and lays the foundation for the Phase 7 Library View.

## User Review Required
> [!IMPORTANT]
> - Do we want to allow users to specify where the `BookSage_Projects` folder lives, or just default to `AppData/Roaming/BookSage/` (or `Documents/BookSage_Projects/` which is currently used by Python)? The plan assumes `Documents/BookSage_Projects/`.
> - Do you approve adding `@tauri-apps/plugin-sql` which will require a Rust compilation step on the next run?

## Open Questions
> [!WARNING]
> - The Python sidecar currently outputs files to a temp-like or `Documents` structure. Do we need to update Python to return the exact path it saved to, or does the frontend construct the path? (Currently `res.metadata.chapters[i].file` has it, so frontend knows).

## Proposed Changes

### Configuration
#### [MODIFY] src-tauri/Cargo.toml
- Add `tauri-plugin-sql = { version = "2.0.0-rc", features = ["sqlite"] }` (or appropriate v2 version).

#### [MODIFY] src-tauri/src/main.rs
- Register the sql plugin: `tauri_plugin_sql::Builder::default().build()`

#### [MODIFY] src-tauri/tauri.conf.json
- Add plugin configurations for SQL.

### Database Layer
#### [NEW] src/services/dbService.ts
- Create TS wrappers using `@tauri-apps/plugin-sql`.
- Initialize database schema on startup (`books` and `chapters` tables).
- Add CRUD methods: `upsertBook`, `upsertChapter`, `getChaptersForBook`.

### State Management
#### [MODIFY] src/stores/bookStore.ts
- Hook state changes into `dbService.ts`.
- When a book is split, insert it and its chapters into SQLite.
- Update chapter statuses (`process`, `done`, `error`) in SQLite during extraction.
- Create an initialization flow to reload the active book's chapters from SQLite on startup.

### File Management
#### [MODIFY] python/chapter_splitter.py & main.py (Optional)
- Ensure the extraction output is stored in a permanent, predictable directory like `Documents/BookSage_Projects/{book_uuid}/chapters/`. (We might need to pass `book_id` to Python from the frontend).

## Verification Plan

### Automated Tests
- Run `npm run dev` to ensure Rust side compiles with the new SQL plugin.

### Manual Verification
1. Import a new PDF. Wait for splitting.
2. Check SQLite DB (using a tool like DB Browser or adding console logs) to ensure `books` and `chapters` rows are created.
3. Start extracting one chapter.
4. **Kill the app** and restart.
5. Verify that the chapter list repopulates with the correct `done`, `error`, or `none` statuses without needing to re-split the book.
