# Reader Toolbar Wrap Fix

## Context
The user observed in Split View that the Notes Viewer's toolbar correctly wraps icons and elements to the next line when the panel width shrinks (`flex-wrap: wrap`), whereas the Book Reader's toolbar (which contains layout options, drawing tools, search, reading stats, audio controls, and display settings) overflows and cuts off items because it lacks responsive wrapping.

## Why this happens
- The `NotesViewer` toolbar is explicitly built with `.notes-toolbar` which has `flex-wrap: wrap;`.
- The `BookReader` header and its inner `.view-toggles` container use a hardcoded inline style `display: 'flex'` without any `flex-wrap` rules.

## Proposed Changes
We need to update `src/components/views/BookReader.tsx` to make the header fully responsive.

### `src/components/views/BookReader.tsx`
#### [MODIFY] BookReader.tsx
1. Add `flexWrap: 'wrap'` to the main `view-header` flex container.
2. Add `flexWrap: 'wrap'` to the `.view-toggles` child container.
3. Ensure the book title (`<h2>`) does not push other elements off-screen by adding `flexShrink: 0`, a maximum width, and text-overflow ellipsis logic (`whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'`).

## Verification Plan
1. Enter Split View mode (`Ctrl + \`).
2. Drag the divider to make the Book Reader pane extremely narrow.
3. Verify that the Reader toolbar controls wrap elegantly to a second (or third) row without horizontal clipping or pushing the UI out of bounds.
