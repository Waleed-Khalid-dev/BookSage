# Annotation Search and Export

## Overview
This plan implements two highly requested premium features: **Global Annotation Search** and **Markdown Export**. These features enhance the BookSage knowledge management experience by allowing users to effortlessly find their thoughts across their entire library and export them for external use (e.g., in Obsidian or Notion).

## Project Type
**WEB** (React/Tauri desktop application)

## Success Criteria
1. **Search**: User can press a shortcut (e.g., `Cmd+K`) or click a button to open a global search modal. It searches both highlighted text and custom notes across all books, and clicking a result navigates to that exact page (and book).
2. **Export**: User can export the current book's annotations (grouped by page/chapter). The export includes the book metadata, text highlights, custom notes, and a placeholder reference for pages with drawings.
3. **Export Formats**: User can both "Copy to Clipboard" and "Save as .md file" directly to their filesystem.

## File Structure

```text
src/
├── components/
│   ├── shared/
│   │   └── GlobalSearchModal.tsx        [NEW] - The Cmd+K search modal
│   └── reader/
│       └── AnnotationSidebar.tsx        [MODIFY] - Add Export/Search buttons
├── services/
│   └── exportService.ts                 [NEW] - Logic for generating MD and saving files
├── stores/
│   └── searchStore.ts                   [NEW] - Zustand store for global search state
```

## Task Breakdown

### Task 1: Create the Export Service (`exportService.ts`)
*   **Agent**: `frontend-specialist`
*   **Skills**: `clean-code`, `api-patterns`
*   **INPUT**: `bookId`
*   **PROCESS**: 
    1. Query the database for the Book details, all its `HighlightRecords`, and `DrawingRecords`.
    2. Sort annotations by `page_num` and `created_at`.
    3. Generate a Markdown string with the Book Title as the H1 header.
    4. Group annotations under `## Page X` headers.
    5. Format text highlights as blockquotes (`> text`), append custom notes below them, and add italicized references for drawings (e.g., `*[Drawing on Page X]*`).
    6. Implement two functions: `copyToClipboard(markdown)` and `saveToFile(markdown, suggestedFilename)`.
*   **OUTPUT**: Fully functional `exportService.ts`.
*   **VERIFY**: Manually call the service and check if a valid Markdown string is generated containing all data types.

### Task 2: Update Annotation Sidebar with Export UI
*   **Agent**: `frontend-specialist`
*   **Skills**: `frontend-design`
*   **INPUT**: `AnnotationSidebar.tsx`, `exportService.ts`
*   **PROCESS**:
    1. Add an "Export" icon button in the header of the `AnnotationSidebar`.
    2. Clicking it opens a small dropdown/popover with two options: "Copy to Clipboard" and "Download .md".
    3. Wire these options to the `exportService`.
*   **OUTPUT**: Export UI integrated into the reader.
*   **VERIFY**: Click both options and verify clipboard content and the Tauri file save dialog behavior.

### Task 3: Build the Global Search Store & Service
*   **Agent**: `frontend-specialist`
*   **Skills**: `clean-code`
*   **INPUT**: `dbService.ts`
*   **PROCESS**:
    1. Add a query to `dbService.ts`: `searchAnnotations(query: string)` that performs a `LIKE %query%` SQL search on `HighlightRecord.text` and `HighlightRecord.note`, joining with the `books` table to get the book title.
    2. Create `searchStore.ts` to manage the visibility state of the global search modal (`isSearchModalOpen`).
*   **OUTPUT**: Database queries and state management for search.
*   **VERIFY**: Verify SQL query returns expected results when matching text or notes.

### Task 4: Build Global Search Modal UI (`GlobalSearchModal.tsx`)
*   **Agent**: `frontend-specialist`
*   **Skills**: `frontend-design`
*   **INPUT**: `searchStore.ts`, `dbService.ts`
*   **PROCESS**:
    1. Create a Cmd+K style modal that floats over the entire app (can be placed in `App.tsx` or `BookReader.tsx`).
    2. Include a debounced text input.
    3. Display results grouped by Book Title, showing a snippet of the matching text/note and the page number.
    4. On click, navigate to the specific book and page. (If currently in the same book, just jump page; if different, route to `/reader/:bookId` with a page parameter).
    5. Add a "Search" button to the `AnnotationSidebar` to manually trigger this modal.
*   **OUTPUT**: Functional, beautiful search modal.
*   **VERIFY**: Press `Cmd+K`, search for a known note, click it, and verify the reader jumps to the correct page.

## ✅ PHASE X: VERIFICATION CHECKLIST
- [ ] Lint: `npm run lint` passes
- [ ] Build: `npm run build` succeeds without TS errors
- [ ] Export: Downloaded Markdown file is formatted correctly.
- [ ] Search: Results display instantly and navigation works across different books.
