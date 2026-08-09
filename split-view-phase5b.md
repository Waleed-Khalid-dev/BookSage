# Split View: Reader + Notes (Phase 5b)

## Overview
Phase 5b aims to introduce a **Split View** feature that allows users to view the Book Reader and the Notes Viewer side-by-side. This turns BookSage into a true study studio where users can read the original text and consult the AI-extracted JSON notes simultaneously.

## Project Type
WEB (React / Tauri)

## Success Criteria
- [ ] Users can toggle a split view while in the Reader.
- [ ] The BookReader and NotesViewer render side-by-side without horizontal scrolling issues.
- [ ] The split state is managed globally via Zustand (`uiStore`).
- [ ] Responsive behavior: components adjust gracefully to the constrained width.

## Socratic Gate (Open Questions for the User)
> [!NOTE]
> Please review and answer these questions before we proceed to implementation.

1. **Trigger Mechanism:** Where should the toggle button live? (e.g., inside the Reader's top/bottom toolbar, a global hotkey, or the main left IconSidebar?)
2. **Resizability:** Do you want a fixed 50/50 split initially, or should we include a draggable divider to let users adjust the width?
3. **Behavior on Close:** If a user navigates away to the 'Library' view and then back to the 'Reader', should it remember the split state, or should it always default to full-screen reader?

## Tech Stack
- React, Zustand (State Management)
- CSS Flexbox (for layout constraints)

## File Structure
- `src/stores/uiStore.ts` (State updates)
- `src/App.tsx` (Main layout rendering)
- `src/components/reader/PageControls.tsx` (Toggle button)
- `src/App.css` (Split layout CSS)

---

## Task Breakdown

### Task 1: Update Global State (`uiStore.ts`)
- **Agent:** `frontend-specialist`
- **Goal:** Add a boolean state to track if the notes split view is active.
- **INPUT:** `uiStore.ts`
- **OUTPUT:** Added `isNotesSplitOpen: boolean` and `toggleNotesSplit: () => void`.
- **VERIFY:** Store successfully updates when the action is called.

### Task 2: Implement Split Layout (`App.tsx` & `App.css`)
- **Agent:** `frontend-specialist`
- **Goal:** Modify the main router to render both views side-by-side when the split mode is active.
- **INPUT:** `App.tsx`, `App.css`
- **OUTPUT:** When `activeView === 'reader' && isNotesSplitOpen`, wrap `<BookReader />` and `<NotesViewer />` in a flex-row container (e.g., `<div className="split-view-container">...</div>`).
- **VERIFY:** Both components render simultaneously and share the screen width (50% each or using `flex: 1`).

### Task 3: Add UI Toggle Control (`PageControls.tsx` or similar)
- **Agent:** `frontend-specialist`
- **Goal:** Provide a button to open/close the split view.
- **INPUT:** `PageControls.tsx`
- **OUTPUT:** A new icon button (e.g., `Columns` icon) that calls `toggleNotesSplit()`.
- **VERIFY:** Clicking the button toggles the layout instantly without breaking the PDF render.

### Task 4: CSS Responsiveness Polish
- **Agent:** `frontend-specialist`
- **Goal:** Ensure both components adapt to 50vw width.
- **INPUT:** `NotesViewer.css`, `BookReader` layout CSS
- **OUTPUT:** Minor flex adjustments to ensure sidebars or page controls don't overflow when compressed.
- **VERIFY:** Resize the window and check for horizontal scrollbars.

---

## Phase X: Verification
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] No purple/violet hex codes used in any new UI toggles.
- [ ] Toggle button works and maintains the reading position.
- [ ] Notes Viewer sidebar still operates correctly in the constrained space.
