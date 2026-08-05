# Display Settings & PDF Themes Implementation Plan

## Goal
Implement two advanced display features from the feature research document:
1. **Invert PDF Colors (White-on-Black):** To provide a true dark mode reading experience for the PDF document itself.
2. **Custom Background Color Picker:** To allow users to define their own custom background color for the application.

## ❓ Socratic Gate (Open Questions for the User)
Before we write any code, we need to clarify two design decisions:

1. **Custom Background Scope:** When you say "Custom background color", do you want this color picker to change the background of the *entire application interface* (the margins around the PDF, the sidebars), or are you hoping to tint the *PDF pages* themselves? (Note: Most PDFs have opaque white backgrounds, so tinting the PDF itself requires a CSS mix-blend-mode trick).
2. **Invert Colors Behavior:** Should the "Invert PDF Colors" feature be a manual toggle switch that you can turn on/off independently? Or should it *automatically* turn on whenever you select the "Night" or "OLED" UI themes?

---

## Proposed Technical Implementation

### 1. Invert PDF Colors
*   **State Management (`bookStore.ts`):** 
    *   Add `invertPdfColors: boolean`.
    *   Add `setInvertPdfColors: (val: boolean) => void`.
*   **UI Controls (`DisplaySettings.tsx`):**
    *   Add a toggle switch (checkbox or styled toggle) below the theme list labeled "Invert PDF Colors".
*   **CSS / Rendering (`PDFCanvas.tsx` & `index.css`):**
    *   Bind a dynamic style to the `.pdf-canvas` element. If `invertPdfColors` is true, apply `filter: invert(1) hue-rotate(180deg)`. 
    *   *(The `hue-rotate(180deg)` ensures that images in the PDF don't look completely negative, restoring colors like blue and red while keeping white and black inverted).*

### 2. Custom Background Color Picker
*   **State Management (`bookStore.ts`):**
    *   Add `customBackgroundColor: string | null`.
    *   Add `setCustomBackgroundColor: (color: string | null) => void`.
*   **UI Controls (`DisplaySettings.tsx`):**
    *   Add an `<input type="color">` alongside a "Custom Background" label.
    *   Provide a "Reset" button to clear the custom color and fall back to the selected theme's default background.
*   **CSS / App Shell (`App.tsx` or `index.css`):**
    *   If `customBackgroundColor` is set, inject it as an inline style overriding the `--bs-bg` and/or `--bs-panel` CSS variables at the `.app-container` level.

## Verification Checklist
- [ ] Toggling "Invert PDF Colors" immediately flips the canvas from white to black (and vice versa) without breaking drawing or highlight coordinates.
- [ ] Highlights remain visible and correctly positioned when the PDF is inverted.
- [ ] Selecting a color from the Custom Background Picker immediately updates the app margins.
- [ ] Clearing the custom color reverts the app background to the currently active Theme's default.

