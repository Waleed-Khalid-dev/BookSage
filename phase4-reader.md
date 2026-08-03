# Phase 4: Book Reader View

## Overview
Implement the integrated Book Reader view for BookSage Studio. This view will render PDF pages natively using `pdfjs-dist`, provide page navigation controls, implement a word highlighter for structured reading, and capture text selections for the AI Copilot.

## Project Type
**WEB** (React/Tauri desktop frontend)

## Success Criteria
- PDF document loads and renders clearly in `PDFCanvas.tsx`
- User can navigate pages (Next/Prev) and zoom using `PageControls.tsx`
- User can navigate word-by-word using `WordHighlighter.tsx`
- Selecting text captures the string and bounding rect via `useTextSelection.ts`

## Tech Stack
- React 18 + TypeScript
- `pdfjs-dist` (Mozilla PDF rendering engine)
- Zustand (existing `bookStore` for getting current `pdfPath`)

## File Structure
```
src/
├── components/
│   ├── reader/
│   │   ├── PDFCanvas.tsx       [NEW]
│   │   ├── PageControls.tsx    [NEW]
│   │   └── WordHighlighter.tsx [NEW]
│   └── views/
│       └── BookReader.tsx      [MODIFY]
├── hooks/
│   ├── usePDF.ts               [NEW]
│   └── useTextSelection.ts     [NEW]
```

## Task Breakdown

### Task 1: Setup PDF Engine & Hooks
- **Agent**: `@frontend-specialist`
- **Skills**: `react-patterns`, `pdfjs-dist`
- **INPUT**: Empty `usePDF.ts` and `useTextSelection.ts`. Need `pdfjs-dist` installed.
- **OUTPUT**: `npm i pdfjs-dist`, implemented `usePDF.ts` (loads document and renders to canvas), implemented `useTextSelection.ts` (listens to mouseup, gets `window.getSelection()` and `getBoundingClientRect()`).
- **VERIFY**: Hook compiles successfully; PDF loads in a basic test component without throwing errors.

### Task 2: Build Reader Components
- **Agent**: `@frontend-specialist`
- **Skills**: `frontend-architecture`, `frontend-design`
- **INPUT**: Hooks from Task 1, `_group.css` tokens.
- **OUTPUT**: `PDFCanvas.tsx` (renders canvas and text layer), `PageControls.tsx` (toolbar for nav/zoom), `WordHighlighter.tsx` (keyboard nav over text layer).
- **VERIFY**: Components render visually according to tokens; no TS errors.

### Task 3: Assemble BookReader View
- **Agent**: `@frontend-specialist`
- **Skills**: `frontend-architecture`
- **INPUT**: Components from Task 2, `src/components/views/BookReader.tsx`, `bookStore`.
- **OUTPUT**: Completed `BookReader.tsx` that reads `pdfPath` from `bookStore` and displays the reader. Shows placeholder if no book is loaded.
- **VERIFY**: Opening a book from the Library (or loading a path) displays the PDF pages correctly in the app.

## Phase X: Verification
- [ ] Run `npm run lint` and `npx tsc --noEmit`
- [ ] Build app `npm run build`
- [ ] Run dev server `npm run dev` and manually verify:
  - PDF loads and pages turn
  - Zoom functions correctly
  - Text is selectable
  - Word highlighter navigates words

## ✅ PHASE X COMPLETE
- Lint: ❌ Pending
- Security: ❌ Pending
- Build: ❌ Pending
- Date: [Pending]
