# Copilot Sidebar Chapter Context Fix

## The Problem
Currently, the "Chapter" toggle inside the Copilot Sidebar is unclickable (disabled). This happens because the global `App.tsx` shell, which renders the sidebar, does not currently compute which chapter the user is reading. As a result, it fails to pass the `chapterId` and `chapterTitle` down to the `CopilotSidebar` component.

## Implementation Plan

### 1. Derive Active Chapter in `App.tsx`
- We will modify `src/App.tsx` to read `lastPage` and `chapters` from `useBookStore`.
- We will write a small helper function to determine which chapter the user is currently reading by checking if `lastPage` falls within a chapter's page range (`pp` property, e.g., "10-25").

### 2. Pass Chapter Props to `CopilotSidebar`
- Once the active chapter is identified, we will pass its ID and title down to the `<CopilotSidebar />` component in `App.tsx`.
- This will instantly re-enable the "Chapter" button in the sidebar.

### 3. Verification
- We will verify that scrolling through the book in `BookReader` dynamically updates the "Context" badge in the sidebar to reflect the correct chapter.
- We will ensure the "Chapter" toggle becomes clickable.

## Agent Assignments
- The primary implementation will be done using my coding capabilities.
- No other specialized agents are required for this minor state passing fix.

## Verification Checklist
- [ ] Determine current chapter based on `lastPage` in `App.tsx`.
- [ ] Pass `chapterId` and `chapterTitle` to `<CopilotSidebar />`.
- [ ] Ensure "Chapter" scope button becomes enabled.
