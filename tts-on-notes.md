# TTS on Notes — Phase 5b

## 🎯 Goal
Integrate Text-to-Speech (TTS) capabilities into the `NotesViewer` by reusing the existing `AudioToolbar` logic from `BookReader`, ensuring it works seamlessly even when both views are open simultaneously in Split View.

## 🔴 User Review Required

> [!WARNING]
> **Architectural Conflict in Split View**
> Currently, `AudioToolbar` manages its own `<audio>` playback internally via a React `useRef`. If we simply copy-paste `<AudioToolbar />` into `NotesViewer`, Split View will mount **two** independent toolbars. Clicking "Play" on one and "Pause" on the other will break, causing "ghost" audio playing in the background that cannot be stopped.

To fix this, we must decouple the audio playback engine from the UI component.

## ❓ Open Questions

> [!IMPORTANT]
> 1. **Word Highlighting in Notes:** Do you want word-by-word visual highlighting in the Notes Viewer, or is simple audio playback sufficient? (Highlighting HTML is technically different and trickier than highlighting the PDF canvas).
> 2. **Global vs. Local Toolbar:** Should there be two separate Audio Toolbars (one above the Book, one above the Notes), or should we extract the Audio Toolbar into a single, global floating toolbar that reads whatever text is currently highlighted on the screen?

## 🛠️ Proposed Changes

### 1. Extract TTS Engine to Global Store
We will lift the audio playback logic out of `AudioToolbar.tsx` and into a global Zustand store (e.g., `ttsStore.ts` or add to `uiStore.ts`). 
- **State:** `isPlaying`, `isPaused`, `voiceURI`, `playbackRate`
- **Actions:** `play(text)`, `pause()`, `stop()`, `setVoice()`, `setRate()`
- This ensures only one Edge TTS `Audio` instance and one `SpeechSynthesis` instance exists globally.

### 2. Refactor `AudioToolbar.tsx`
#### [MODIFY] `src/components/reader/AudioToolbar.tsx`
- Refactor the component to become a "dumb" UI controller that reads state from the global TTS store and dispatches play/pause actions.
- Move the PDF-specific `.textLayer` highlighting logic into an `onWordBoundary` event listener so that it doesn't crash when running inside the `NotesViewer`.

### 3. Integrate into NotesViewer
#### [MODIFY] `src/components/views/NotesViewer.tsx`
- Import `<AudioToolbar />`.
- Add it to the top `.notes-tb-left` or `.notes-tb-right` header section.
- Since it uses `window.getSelection()`, users can highlight text in their generated notes, click Play, and hear it via Edge TTS or native offline TTS.

## ✅ Verification Plan

### Manual Verification
1. Open **Split View**.
2. Highlight text in the PDF and click Play on the BookReader toolbar.
3. Verify PDF word highlighting still works.
4. Highlight text in the NotesViewer and click Play on the NotesViewer toolbar.
5. Verify that clicking "Pause" on the BookReader toolbar correctly pauses the audio initiated from the NotesViewer toolbar (proving global state sync).
6. Test Edge TTS (online) and Native TTS (offline) fallbacks.
