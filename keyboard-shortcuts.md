# Keyboard Shortcuts Implementation Plan

## 🛑 Open Questions for User (Socratic Gate)
> [!IMPORTANT]
> Please confirm the following before we proceed with implementation:
> 1. **Default Hotkeys:** Should I use standard/intuitive defaults like `H` for Highlight, `U` for Underline, `S` for Strikethrough, `Space` for TTS Play/Pause, `E` for Eraser, and `Ctrl+Z/Y` for Undo/Redo? Or do you have specific preferences for these defaults?
> 2. **Settings Location:** Should we add a brand-new **"Shortcuts"** tab inside the existing `SettingsDialog` to manage these?

---

## Proposed Changes

### 1. State Management (Shortcut Store)
#### [NEW] `src/stores/shortcutStore.ts`
- Create a new Zustand store with `persist` middleware to remember user customizations.
- Define a `ShortcutConfig` type (keys, modifiers).
- Define default bindings for: Highlight, Underline, Strikethrough, Freehand Draw, Eraser, Undo, Redo, TTS Play/Pause.
- Provide actions to `updateShortcut(action, keys)` and `resetToDefaults()`.

### 2. Event Handling Logic
#### [NEW] `src/hooks/useShortcuts.ts`
- Create a global React hook that listens to `window.addEventListener('keydown')`.
- It will check the `shortcutStore` against the pressed keys.
- **Safety check:** It will ignore keypresses if the user is currently typing in an `<input>` or `<textarea>` (like the search bar or chat).

### 3. Settings UI
#### [MODIFY] `src/components/shared/SettingsDialog.tsx`
- Add a new "Shortcuts" tab.
- Display a list of all customizable actions.
- Show the current hotkey for each action.
- When clicked, enter a "listening" state to capture the user's new key combination (e.g., `Ctrl+Shift+H`).
- Add a "Reset to Defaults" button.

### 4. Wiring it up
#### [MODIFY] `src/components/views/BookReaderFull.tsx` (and related components)
- Replace any hardcoded `keydown` event listeners with the new centralized `useShortcuts` hook or dispatch actions based on the global listener.
- Ensure the Undo/Redo, Draw, Erase, and Highlight features trigger correctly when their respective shortcut is pressed.

---

## Verification Plan

### Manual Verification
1. Open the Settings dialog and verify the "Shortcuts" tab appears.
2. Change the 'Highlight' shortcut from `H` to `Ctrl+Shift+H`.
3. Select text in the PDF and press `Ctrl+Shift+H` — verify it highlights.
4. Press `Space` — verify TTS starts/pauses.
5. Click the "Reset to Defaults" button and verify `H` is restored as the highlight shortcut.
6. Click into the search bar and type `h` — verify it types the letter "h" in the search box rather than triggering a highlight.
