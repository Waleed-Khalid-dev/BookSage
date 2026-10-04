# Implementation Plan: Inline Word Definition (Kindle X-Ray & Apple Dictionary Style)

> **Feature:** Inline Word Definition with Free Dictionary API + Book-Contextual AI  
> **Status:** Planning Mode  
> **Tracker Reference:** [copilot-features.md](file:///d:/%5BProject%5D/BookSage/copilot-features.md) lines 226–232

---

## 1. Executive Summary & Verification of Current State

### Is this feature already done?
**No, it is not yet implemented according to the spec in [copilot-features.md](file:///d:/%5BProject%5D/BookSage/copilot-features.md).**

- **What currently exists:**
  - `ContextMenu.tsx` contains a generic `📖 Define` menu item triggered via manual text selection + right-click.
  - Selecting `📖 Define` invokes the general `CopilotPopup` and queries the active LLM using the prompt `"Provide a concise dictionary definition for the following term, including its part of speech:"`.
- **What is missing (The Spec):**
  1. **`Ctrl+Click` gesture detection** on single words in both [BookReader.tsx](file:///d:/%5BProject%5D/BookSage/src/components/views/BookReader.tsx) (PDF canvas text layer) and [NotesViewer.tsx](file:///d:/%5BProject%5D/BookSage/src/components/views/NotesViewer.tsx) (Markdown content).
  2. **Free Dictionary API integration** (`https://api.dictionaryapi.dev/api/v2/entries/en/{word}`) for instant, 0-token base definition, pronunciation phonetics, audio, and part-of-speech.
  3. **Lightweight floating popover tooltip** (`WordDefinitionTooltip.tsx`) positioned right at the clicked word with arrow pointer, viewport clamping, and easy dismiss (`Esc` or click outside).
  4. **Dual-tab or progressive contextual AI expansion**: Displays instant dictionary definition first, with a streamlined AI snippet ("In this book: [contextual meaning]") using chapter context.
  5. **SQLite / Local caching** (`word_definitions` table) to enable instant offline recall without repeating network or AI calls.

---

## 2. Architecture & Design Specification

### A. Word Detection & Event Handling
- **Word Extraction on Click:**
  - In `BookReader` (PDF text layer) and `NotesViewer` (HTML/Markdown): listen to `click` with `e.ctrlKey` (or `e.metaKey` on Mac).
  - Use `document.caretRangeFromPoint(e.clientX, e.clientY)` (or standard `document.caretPositionFromPoint`) to expand selection to the full single word boundaries `\b[a-zA-Z0-9_\-']+\b`.
  - Sanitize word: strip leading/trailing punctuation and lowercase for lookup.
- **Anchor Positioning:**
  - Capture bounding rectangle of the target word using `range.getBoundingClientRect()`.
  - Position the tooltip directly above or below the word with smart flipping to avoid viewport edge overflows.

### B. Data Fetching Pipeline (Hybrid & Progressive)
1. **Cache Check:** Check local SQLite cache / in-memory map for `{ word, book_id, chapter_id }`.
2. **Dictionary Layer (Instant, 0-Token):**
   - Fetch from Free Dictionary API: `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`.
   - Extracts:
     - Word & Phonetic spelling (e.g. `/ˌkɒn.tɛkst/`)
     - Audio pronunciation URL (if available)
     - Part of Speech pills (`noun`, `verb`, `adjective`)
     - Primary definitions with example sentences
3. **AI Contextual Layer (Streaming / Progressive):**
   - If AI key is configured and active book/chapter context exists:
     - Quick prompt: `"In 1-2 concise sentences, explain how the word or concept '${word}' is used or intended within the context of ${bookTitle}, Chapter ${chapterNum}."`
     - Displays under a styled badge: `📖 In This Book`

### C. UI Component: `WordDefinitionTooltip.tsx`
- **Design Tokens:** Follow Obsidian/BookSage dark mode tokens (`--bs-bg`, `--bs-surface`, `--bs-accent: #009688`, `--bs-border`).
- **Layout:**
  - **Header:** Clean word title, phonetic text, optional speaker icon for audio pronunciation, and close button `×`.
  - **Body 1 (Dictionary):** Part-of-speech tag (`noun`, `verb`), numbered definitions, italicized examples.
  - **Body 2 (Book Context):** Subtle divider with `BookSage Context` badge explaining nuance in the current chapter.
  - **Actions:** Quick button `💬 Ask Copilot` to seamlessly pass the term to the Copilot Sidebar for deep exploration.
- **Dismiss Behavior:** Closes on `Esc`, window scroll, or clicking anywhere outside the tooltip.

### D. User Discovery & Minimalist Mac-Grade Polish
1. **Context Menu Shortcut Badge (#1):** In `ContextMenu.tsx`, next to `📖 Define`, display an elegant subtle keyboard badge `<kbd className="ctx-kbd">Ctrl+Click</kbd>`.
2. **Mac-Grade Definition Cursor on Ctrl (#2):** When holding `Ctrl` over readable text in BookReader or NotesViewer, smoothly apply a crisp macOS-style definition cursor (sleek book/magnifier vector pointer) so users instantly and intuitively feel the interaction capability without visual clutter.
3. **Settings Shortcuts Documentation (#3):** Add `Ctrl + Click Word: Instant Dictionary & Book Context` under the Shortcuts tab in `SettingsDialog.tsx`.

### E. SQLite Persistence (`dbService.ts`)
- Table: `word_definitions`
  - `word TEXT PRIMARY KEY`
  - `phonetic TEXT`
  - `meanings_json TEXT`
  - `audio_url TEXT`
  - `ai_context_json TEXT` -- cached per book/chapter
  - `updated_at INTEGER`

---

## 3. Implementation Phase Breakdown

### Phase 1: Data Service & Dictionary Integration
- Create `src/services/dictionaryService.ts`:
  - `fetchWordDefinition(word: string)`
  - Integrates with Free Dictionary API with timeout & fallback.
  - Adds SQLite table `word_definitions` and caching methods in [dbService.ts](file:///d:/%5BProject%5D/BookSage/src/services/dbService.ts).

### Phase 2: Word Definition Tooltip Component
- Create `src/components/shared/WordDefinitionTooltip.tsx` and `WordDefinitionTooltip.css`.
- Add audio pronunciation playback button using HTMLAudioElement.
- Implement viewport clamping and smooth fade/scale entrance animation.

### Phase 3: Ctrl+Click Word Detection & Integration
- **[BookReader.tsx](file:///d:/%5BProject%5D/BookSage/src/components/views/BookReader.tsx):**
  - Add `Ctrl+Click` listener on the reader container.
  - Resolve clicked word range on PDF text layer spans.
- **[NotesViewer.tsx](file:///d:/%5BProject%5D/BookSage/src/components/views/NotesViewer.tsx):**
  - Add `Ctrl+Click` listener on the notes markdown container.
  - Resolve clicked word range on rendered markdown text nodes.

### Phase 4: AI Contextual Explanation Bridge
- Add `get_word_book_context` command in `python/ai_chat.py` & `main.py` (or lightweight prompt via `chatStore.ts`).
- Wire progressive loading inside `WordDefinitionTooltip`: dictionary displays immediately while AI context loads seamlessly.

### Phase 5: Verification & Testing
- Test Ctrl+Click on PDF pages across Single, Spread, and Continuous reading modes.
- Test Ctrl+Click inside NotesViewer across headings, paragraphs, and list items.
- Verify audio pronunciation playback, offline cached dictionary lookups, and clean `tsc && vite build`.
- Update [copilot-features.md](file:///d:/%5BProject%5D/BookSage/copilot-features.md) checking off the `Inline Word Definition` items.

---

## 4. Verification Checklist
- [ ] `Ctrl+Click` on any word in BookReader opens the definition tooltip.
- [ ] `Ctrl+Click` on any word in NotesViewer opens the definition tooltip.
- [ ] Free Dictionary API delivers instant phonetics and definitions.
- [ ] AI contextual explanation renders book-specific nuance.
- [ ] Audio pronunciation plays on speaker icon click.
- [ ] Repeat word lookups load instantly from SQLite cache.
- [ ] Tooltip closes cleanly on click-outside, scroll, or `Esc`.
- [ ] `tsc && vite build` completes with 0 errors.
