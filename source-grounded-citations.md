# Source-Grounded Answers with Page References — Technical Plan & Architecture Spec

> **Feature Goal:** Anchor AI chat answers to specific chapters and pages with interactive inline citation chips (`[Ch. 4: Title ↗]`) and cross-view source navigation across Copilot Sidebar, Full AI Chat, Book Reader, and Notes Viewer.

---

## 🎯 Finalized Architecture & Design Decisions

### 1. Citation Token Format (`ai_chat.py`)
- The Python backend's `chat_with_context` system prompt instructs the AI model to cite source chapters using standard markdown links:
  ```markdown
  [Ch. 4: Master the Art of Timing](cite:4)
  ```
- In multi-chapter and full-book context modes, each chapter's injected header will clearly specify:
  ```
  === Chapter 4: Master the Art of Timing (Pages 38-52) ===
  ```
  giving the LLM exact chapter numbers, titles, and page spans to cite.

### 2. Interactive Citation Chip Component (`react-markdown` Renderer)
- In both `CopilotSidebar.tsx` and `AIChatView.tsx`, custom `a` component overrides detect `href="cite:N"`:
  ```tsx
  a: ({ href, children }) => {
    if (href?.startsWith('cite:')) {
      const chNum = parseInt(href.replace('cite:', ''), 10);
      return <CitationChip chapterNum={chNum} label={String(children)} />;
    }
    return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
  }
  ```
- **Visual Appearance:**
  - Styled as a sleek interactive pill: `📑 Ch. 4: Master the Art of Timing ↗`
  - Subtle teal background tint, glowing hover border, and tooltip displaying `Chapter 4 • Pages 38–52 • Click to Jump`.
  - Supports all 6 themes (Light, Dark, Sepia, Night, OLED, Focus).

### 3. Context-Aware Cross-View Source Navigation (`bookStore.ts`)
- A centralized store action `jumpToChapter(chapterNumOrId: number | string, preferView?: 'reader' | 'notes')`:
  - Finds the matching chapter in `chapters`.
  - Extracts the start page from `chapter.pp` (e.g. `"38-52"` -> page 38).
  - Sets `lastPage` in `bookStore`.
  - **Context-Aware Routing:**
    - If user is in **Book Reader** (or Sidebar while reading) -> dispatches page change to PDF canvas.
    - If user is in **Notes Viewer** -> selects that chapter in Notes Viewer.
    - If user is in **Full AI Chat** -> switches `activeView` to `'reader'` and navigates to the start page.

### 4. Message Bubble "Jump to Source" Action Pill
- Below assistant responses that reference chapters, render `📖 Jump to Ch. N` (or a popover menu if multiple chapters are cited) in the message action row next to `📋 Copy`, `📌 Pin`, and `🔄 Regenerate`.

---

## 📋 Implementation Steps (Ready for `/create`)

1. **Step 1 — Python Backend System Prompt Update:**
   - Update `python/ai_chat.py` with citation guidelines and chapter headers format.
2. **Step 2 — Store Navigation Helper:**
   - Add `jumpToChapter` in `src/stores/bookStore.ts` to coordinate page jumping, `lastPage` updates, and active view switching.
3. **Step 3 — Interactive Citation Chip & Markdown Overrides:**
   - Create `CitationChip` component and hook `react-markdown` link overrides in `CopilotSidebar.tsx` and `AIChatView.tsx`.
4. **Step 4 — Action Footer "Jump to Source" Button:**
   - Add `📖 Jump to Ch. N` pill button in message action meta bars for assistant responses.
5. **Step 5 — CSS & Theme Polish:**
   - Add high-contrast styling for `.bs-citation-chip` across Light, Sepia, Dark, Night, OLED, and Focus modes.
6. **Step 6 — Verification:**
   - Run `npm run build` and test citation parsing and jumping.
