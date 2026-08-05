# Advanced Markup (Underline, Strikethrough, Freehand)

## Goal
Enhance the PDF Reader annotation capabilities by introducing Underline, Strikethrough, and Freehand Drawing tools, integrating them seamlessly with the existing SQLite persistence layer and the UI.

---

## Phase 0: Socratic Gate (Open Questions)
*Before we begin execution, please clarify:*
1. **Freehand Drawing Storage:** A freehand drawing consists of coordinate paths rather than text rectangles. Should we create a new dedicated `drawings` table in the SQLite database, or do you want to keep everything unified by adding `type` and `path_data` columns to the existing `highlights` table? (I recommend a new `drawings` table to keep the schemas clean).
2. **Drawing Tool UI:** Should the "Pen/Drawing" toggle be located in the main top header of the reader (next to the Spread/Continuous buttons), or should it be a floating action button on the side of the canvas?
3. **Drawing Colors:** Do you want a color picker for the freehand pen, or just stick to a default red/black ink for now?

---

## Phase 1: Task Breakdown

### 1. Database Schema Migrations
- **`src/services/dbService.ts`**
  - Add migration to alter the `highlights` table: `ALTER TABLE highlights ADD COLUMN type TEXT DEFAULT 'highlight'`.
  - Create a new `drawings` table: `id`, `book_id`, `page_num`, `path_data` (JSON array of points), `color`, `stroke_width`.
  - Implement `upsertDrawing` and `getDrawingsForBook`.

### 2. Text Markup (Underline & Strikethrough)
- **`src/components/reader/HighlightToolbar.tsx`**
  - Add "Underline" and "Strikethrough" buttons to the popup toolbar.
  - When saved, pass the `type` explicitly.
- **`src/components/reader/PDFCanvas.tsx` (or Highlight renderer)**
  - Update the rendering loop:
    - If `type === 'highlight'`, render the standard semi-transparent rectangle.
    - If `type === 'underline'`, render a 2px solid border/line at the bottom of the bounding box.
    - If `type === 'strikethrough'`, render a 2px solid line through the vertical center of the bounding box.

### 3. Freehand Drawing Mode
- **`src/stores/bookStore.ts`**
  - Add `isDrawingMode: boolean` to the global state to disable text selection and panning when the pen is active.
- **`src/components/reader/DrawingLayer.tsx`**
  - Create a new component that overlays a transparent HTML5 `<canvas>` over the PDF page.
  - Implement pointer events (`onPointerDown`, `onPointerMove`, `onPointerUp`) to capture strokes.
  - On mouse up, serialize the path and save it to the database via `upsertDrawing`.
- **`src/components/views/BookReader.tsx`**
  - Add the Pen toggle button to the UI.
  - Ensure the `.pdf-scroll-container` CSS disables `touch-action` and text selection when `isDrawingMode` is true.

---

## Phase 2: Agent Assignments
- **`database-architect`**: Update `dbService.ts` and handle migrations gracefully without dropping existing highlights.
- **`frontend-specialist`**: Build the `DrawingLayer.tsx` and integrate the new markup types into the `HighlightToolbar`.

---

## Phase 3: Verification Checklist
- [ ] Database migration successfully adds `type` to existing highlights.
- [ ] Text selection toolbar includes Underline and Strikethrough options.
- [ ] Underlines and Strikethroughs render correctly over the text.
- [ ] Clicking the Pen tool enables freehand drawing and prevents page panning.
- [ ] Drawn paths are saved to the database and reload successfully when returning to the page.
