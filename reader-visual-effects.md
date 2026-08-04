# Reader Visual Effects & UI Polish

## Goal
Implement UI enhancements for the BookReader:
1. The ability to hide/collapse the left sidebar to maximize reading space.
2. Visual depth/spine effects in Spread mode to mimic a physical book.
3. Smooth page-flip animations when navigating pages.

---

## Phase 0: Socratic Gate (Open Questions)
*Before we begin execution, please clarify:*
1. **Sidebar Toggle Position:** Where should the button to hide/show the sidebar live? 
   - *Option A:* In the top header next to the Display Settings.
   - *Option B:* A small floating tab/chevron on the left edge of the screen that appears when the sidebar is hidden.
   - *Option C:* A keyboard shortcut only (e.g., `Ctrl+B`).
2. **Animation Style:** A true 3D "curling" page flip (like a physical page turning over your finger) is extremely difficult to perform performantly with PDF text layers. 
   - *Alternative:* Would a smooth CSS sliding/fade transition, or a simple 3D "door hinge" flip effect for the whole spread be acceptable?
3. **Book Spine Style:** I will add a realistic shadow/gradient crease in the middle of the Two-Page Spread to simulate the book's binding. Do you want this effect to adapt to the current theme (e.g., darker crease in Dark mode, lighter in Light mode)?

---

## Phase 1: Task Breakdown

### 1. Collapsible Sidebar
- **`src/stores/bookStore.ts` or `BookReader.tsx`**
  - Add a boolean state `isSidebarOpen` (default `true`).
- **`src/components/views/BookReader.tsx`**
  - Conditionally render or apply CSS `display: none` (or `width: 0`) to the `<SidebarTabs />` container.
  - Add a UI toggle button based on your preference (Option A/B/C above).
  - Add a smooth width transition so the sidebar slides in/out instead of snapping.

### 2. Book Spine / Depth Effect
- **`src/components/reader/SpreadReader.tsx`**
  - Replace the simple `gap` with a central divider element.
  - Apply CSS `box-shadow` and `linear-gradient` to the inner edges of the left and right page containers to create a realistic binding crease.
  - Add subtle outer drop shadows to the pages so they look elevated from the background.

### 3. Page Flip Animation
- **`src/components/views/BookReader.tsx`**
  - Introduce a CSS animation class that triggers whenever `currentPage` changes.
  - Use a subtle `transform: translateX()` and `opacity` fade, or a `rotateY` 3D hinge effect to make page transitions feel deliberate and smooth instead of instant cuts.

---

## Phase 2: Agent Assignments
- **`ui-ux-specialist`**: Execute the CSS spine gradients, drop shadows, and page transition animations to ensure a premium feel.
- **`frontend-specialist`**: Implement the React state for the sidebar toggle and wire up the animation triggers.

---

## Phase 3: Verification Checklist
- [ ] Sidebar can be completely hidden, expanding the PDF view to fill the space.
- [ ] Hiding/showing the sidebar animates smoothly.
- [ ] Spread view contains a realistic central crease and page shadows.
- [ ] Flipping pages triggers a smooth visual transition.
