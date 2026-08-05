# TTS Word Highlighting - Implementation Plan

## Context
**Goal**: Highlight the currently spoken word during Text-to-Speech (TTS) playback in the BookSage reader.
**Priority**: HIGH
**Source Feature**: Readwise Audio

## Socratic Gate & Open Questions
Before writing the code, we need to clarify a few edge cases regarding the implementation:
1. **Edge TTS vs Native TTS**: Currently, Edge TTS is the default premium voice, but it only returns a pre-rendered MP3 file without word boundary timestamps. Native `SpeechSynthesisUtterance` provides an `onboundary` event with `charIndex`. Do we want to fallback to Native TTS when highlighting is enabled, or should we implement an AI-based audio-to-text alignment for Edge TTS (which is much more complex)?
2. **Text Selection Mapping**: The current TTS reads `window.getSelection()?.toString()`. Because PDF.js renders text into absolute-positioned spans, mapping a string `charIndex` back to a specific DOM node in the `.textLayer` is non-trivial. Should we use an overlay approach (rendering a floating subtitle box) or attempt to inject `<mark>` tags dynamically into the PDF.js text layer?
3. **Continuous Scrolling**: If the user scrolls away while TTS is playing, should the screen automatically auto-scroll to keep the highlighted word in view?

## Proposed Task Breakdown

### Phase 1: Native Speech Boundary Tracking
- Modify `startNativeSpeech` in `AudioToolbar.tsx` to listen to the `onboundary` event.
- Store the current `charIndex` and `charLength` in a new Zustand store or React state.

### Phase 2: Selection DOM Mapping
- Create a utility in `useTextSelection.ts` or a new hook to map a string `charIndex` to the DOM `Range` of the original text selection.
- Create a temporary `HighlightLayer` component that overlays a transparent yellow box over the active word using `getBoundingClientRect()` from the mapped `Range`.

### Phase 3: Edge TTS Word Timings (Optional/Alternative)
- If we must support Edge TTS with highlighting, investigate using the `edge-tts` python library's `--vtt` subtitle output to send word boundary timestamps back via the Tauri IPC response.
- Sync the audio playback time with the VTT timestamps to trigger the highlighting.

### Phase 4: UI Refinement
- Ensure the word highlight smoothly transitions between words.
- Implement auto-scroll to keep the spoken word in the viewport.
- Provide a settings toggle to turn off "Word Highlighting" if the user finds it distracting.

## Verification Checklist
- [ ] Native TTS accurately fires boundary events.
- [ ] Word highlight box overlays the exact word on the PDF canvas.
- [ ] Highlighting works across line breaks and page breaks.
- [ ] Edge TTS gracefully degrades (no highlighting) OR supports VTT syncing.
