# Obsidian Export per Chapter

## Overview
Implement the "Obsidian Export per Chapter" feature for the Notes Viewer (Phase 5b). This allows users to export the AI-extracted JSON notes for the currently active chapter into a beautifully formatted Markdown file, which they can then open in Obsidian or any other Markdown editor.

## Project Type
WEB (Tauri + React Desktop Application)

## Success Criteria
- Users can click an "Export to Obsidian" button while viewing a chapter in the Notes Viewer.
- A native folder selection dialog opens, allowing them to choose the destination folder.
- The Python backend's `export_chapters` command is invoked with the selected chapter and directory.
- A beautifully formatted `.md` file is generated in the chosen directory.
- A success/error toast notifies the user of the outcome.

## Tech Stack
- **Frontend:** React, Zustand (uiStore), Tauri `@tauri-apps/plugin-dialog`
- **Backend Bridge:** `pythonService.ts` (`invokePython`)
- **Backend:** Python `main.py` (`export_chapters` command, which already exists)

## File Structure
- `src/components/views/NotesViewer.tsx` (modified to include export button and logic)
- `src/components/views/NotesViewer.css` (modified to style the new button)

---

## Task Breakdown

### 1. Add Export Functionality to Notes Viewer
- **Agent:** `frontend-specialist`
- **Skills:** `react-patterns`, `tauri-api`
- **Priority:** P1
- **Dependencies:** None
- **INPUT:** Active chapter data in `NotesViewer.tsx`.
- **OUTPUT:**
  - Import `open` from `@tauri-apps/plugin-dialog`.
  - Create `handleExportToObsidian` function in `NotesViewer.tsx`.
  - The function prompts the user for a directory using `open({ directory: true, title: 'Select Export Folder' })`.
  - Upon selection, call `invokePython({ command: 'export_chapters', chapters: [{ path: activeChapter.path, title: activeChapter.title, num: activeChapter.chapter_number }], output_dir: selectedPath })`.
  - Add toast notifications (success/error).
  - Add an "Export" button to the `NotesViewer` header or toolbar area.
- **VERIFY:** Clicking the button opens the folder dialog; selecting a folder writes the `.md` file successfully.

---

## Phase X: Verification (MANDATORY)

- [ ] Lint: `npm run lint` && `npx tsc --noEmit`
- [ ] Build: `npm run build`
- [ ] Run & Test: `npm run dev`, open a book, extract notes, click Export, verify the `.md` file is correctly formatted in the chosen directory.

## Open Questions for User
1. **Button Placement:** Where would you prefer the "Export" button? Next to the Font Controls in the top right, or directly next to the "Mark as Studied" button in the chapter header?
2. **Iconography:** Should we use a generic "Download/Export" icon, or specifically an Obsidian-like icon if available?

