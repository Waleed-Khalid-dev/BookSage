# Margin Crop Control

## Overview
This plan implements "Smart Margin Cropping" for the PDF Reader. Font Size and Line Spacing controls are deferred to Phase 5/6 as they apply only to the upcoming Markdown Notes Viewer and AI Copilot, because reflowing PDF text would break the book's layout.

## Decision Record
- **Font Size & Line Spacing:** Deferred to Notes Viewer (Phase 5/6).
- **Margin Control:** Implemented as "Smart Margin Crop" (Option B). This uses a CSS `transform: scale()` on an inner wrapper while keeping the outer container clipped (`overflow: hidden`), effectively cropping the baked-in white borders of PDFs without breaking layout or virtualized scrolling math.

## Project Type
**WEB** (React/Tauri Frontend)

## Success Criteria
- Users can adjust a "Margin Crop" slider (0% to 25%).
- The PDF page and all overlays (highlights, drawings, text) scale uniformly.
- The outer container retains its original size to clip the edges and maintain virtualized list integrity.
- Settings are persisted via Zustand/SQLite.

## Task Breakdown

### Task 1: Add State to Store
- **Agent**: `frontend-specialist`
- **Description**: Add `pdfMarginCrop` property to persistent `bookStore`.
- **Status**: ✅ Done

### Task 2: Build UI Controls in DisplaySettings
- **Agent**: `frontend-specialist`
- **Description**: Add range slider for `pdfMarginCrop` in `DisplaySettings.tsx`.
- **Status**: ✅ Done

### Task 3: Apply Styles to PDF Canvas
- **Agent**: `frontend-specialist`
- **Description**: Wrap PDF components inside a `.pdf-crop-wrapper` and apply `transform: scale(1 + pdfMarginCrop/100)`. Update mouse coordinates in `handleContextMenu`.
- **Status**: ✅ Done

## ✅ Phase X: Verification
- [x] Lint: `npm run lint` passes
- [x] Build: `npm run build` succeeds
- [x] Persistence: Settings remember their state after app restart
