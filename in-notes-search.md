# In-Notes Search (Ctrl+F) Implementation Plan

## Goal Description
Implement an in-notes search feature in the `NotesViewer` that mimics the functionality of a native browser `Ctrl+F`. It should highlight all matches within the currently viewed chapter (and ideally across the notes) and allow the user to jump between them using Next/Previous controls.

## Open Questions

> [!WARNING]
> Please review and answer these before we proceed.

1. **Search Scope:** Should the search only look within the *currently active chapter* (the one you are viewing), or should it search across *all chapters* and automatically switch to a chapter if a match is inside it? (Searching within the active chapter is much simpler and faster).
2. **Search Library vs. Native:** Native `window.find()` is built into the browser but doesn't give us "Match 2 of 15" counts or highlight all matches at once. To achieve a high-quality experience (like the PDF reader), we should use a library like `mark.js` which can highlight arbitrary text in the DOM. Is it okay to install `mark.js`?
3. **UI Placement:** Should we pop open a dedicated search bar (similar to the PDF reader's `SearchBar.tsx`) in the top-right of the `NotesViewer`, or should we just intercept `Ctrl+F` and use the exact same `SearchBar` component (with modified logic to handle Notes vs PDF)?

## Proposed Changes

### [NEW] `src/components/views/NotesSearchBar.tsx`
- Create a dedicated search bar for the Notes Viewer that listens for `Ctrl+F` (only when the Notes pane is focused).
- Provide an input field, Next/Prev buttons, and match counters (`X / Y`).

### [MODIFY] `src/components/views/NotesViewer.tsx`
- Integrate `NotesSearchBar`.
- Use `mark.js` (or native DOM traversal) to wrap matching text nodes in `<mark>` tags.
- Hook into the search bar's Next/Prev to scroll the `notes-scroll` container to the active `<mark>` element.

## Verification Plan

### Manual Verification
1. Open the Notes view and press `Ctrl+F`.
2. Type a word known to exist in the current chapter's notes.
3. Verify that all instances of the word are highlighted.
4. Use `Enter` and `Shift+Enter` (or the up/down arrows) to jump between matches, ensuring the view scrolls to the active match.
5. Close the search bar and verify that all highlights are removed.
