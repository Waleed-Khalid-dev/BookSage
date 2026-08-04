# Two-Page Spread Layout Plan

## Goal
Implement a side-by-side "book" layout mode (Two-Page Spread) for the PDF reader. This fulfills a high-priority Phase 4.5 CORE requirement to provide a more traditional reading experience.

---

## Phase 0: Socratic Gate (Open Questions)
*Before we begin execution, please clarify:*
1. **Cover Page Handling:** Traditional readers show Page 1 (the cover) alone on the right side, and then Pages 2-3 side-by-side. Should we enforce this logic (even = left, odd = right)?
2. **Navigation Step:** When the user hits the "Next Page" arrow in Spread mode, should we advance by **2 pages** at a time?
3. **Scaling:** In spread mode, two pages need to fit side-by-side on the screen. Do you want the app to automatically zoom out to fit both pages within the viewport horizontally, or maintain the current zoom level and require horizontal scrolling?

---

## Phase 1: Task Breakdown

### 1. Update State & Controls
- **`src/components/views/BookReader.tsx`**
  - Update `viewMode` state to accept `'single' | 'continuous' | 'spread'`.
  - Pass the updated view mode to the `PageControls` component.
  - Implement a conditional render block for `viewMode === 'spread'`.
- **`src/components/reader/PageControls.tsx`**
  - Add a third toggle button for "Spread View" (using an icon like `BookOpen` from `lucide-react`).

### 2. Spread Layout Component
- **`src/components/reader/SpreadReader.tsx` (NEW)**
  - Create a new component that accepts `pdfState` and `selection` callbacks.
  - **Logic:** Calculate the active left and right pages based on `pdfState.currentPage`. 
    - If `currentPage === 1`, render just Page 1 centered.
    - If `currentPage > 1`, determine the left even page (`Math.floor(currentPage / 2) * 2`) and the right odd page (`leftPage + 1`).
  - Render two `<PDFCanvas />` components side-by-side using Flexbox.

### 3. Navigation Hook Adjustments
- **`src/hooks/usePDF.ts`** (or handled in the Reader component)
  - Ensure that keyboard arrows and page navigation buttons advance by `2` when in spread mode, so the user doesn't end up with an odd page on the left side, breaking the standard book flow.

---

## Phase 2: Agent Assignments
- **`frontend-specialist`**: Execute the React component creation and state wiring.
- **`ui-ux-specialist`**: Ensure the flexbox layout strictly bounds the two canvases so they don't break the reader viewport, and ensure smooth scaling.

---

## Phase 3: Verification Checklist
- [ ] View mode toggle successfully switches between Single, Continuous, and Spread.
- [ ] Page 1 renders by itself (centered).
- [ ] Navigating forward from Page 1 jumps to Pages 2 & 3 side-by-side.
- [ ] Text selection, highlighting, and zooming continue to work flawlessly on *both* canvases in spread mode.
