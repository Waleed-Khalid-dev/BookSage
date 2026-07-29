---
type: reference
created: 2026-07-29
updated: 2026-07-29
---

# BookSage — Remaining Replit UI Prompt

## Context: What Has Already Been Built

The following screens are DONE. Do NOT re-generate these. Reference them only for consistency.

### ✅ DONE — AppShell.tsx
Full app shell with:
- Icon navigation sidebar (48px, VS Code-style): Library, Reader, Notes, Pipeline, Chat, Settings icons
- Active state: `border-left: 3px solid var(--bs-nav-active)`, icon color `--bs-nav-active`
- Library View: book grid with progress bars, author name, card hover effects. Uses `--bs-heading` (#e05252) for book title color
- Book Reader View: dark canvas (#111111), white paper article for book content, chapter list left panel, reading info right panel, "✦ Copilot" button in toolbar
- Notes Viewer: Obsidian-style article — H1 in `--bs-heading`, callout blocks with teal/orange borders, inline code with `--bs-code-bg`/`--bs-code-text`, tag pills
- AI Chat View: context left panel (book info, context mode radio, system prompt textarea) + chat right panel (messages + input)

### ✅ DONE — CopilotPopup.tsx
Floating popup (420px wide) with:
- Teal drag handle bar at top
- "✦ Copilot" header with Sparkles icon + close ×
- Selected text preview pill (italic, muted)
- Quick action pills (Summarize/Simplify/Explain/Shorter/Longer) — active pill uses `--bs-accent` bg
- AI response area (max 200px scrollable)
- "Ask a question..." input + Send button
- Model selector at bottom: green dot + model name + chevron, opens dropdown with models + "Needs API key" for unconfigured ones

### ✅ DONE — ContextMenu.tsx
Right-click context menu (220px wide) with:
- "Add selection to chat context" + "Quick Ask" at top
- Separator
- Copilot section header (Sparkles icon + "Copilot" label in `--bs-accent`)
- Actions: Summarize, Simplify, Explain like I am 5, Make shorter, Make longer, Fix grammar and spelling — each with ChevronRight
- "Translate to..." with hover-reveal sub-menu (中文, Spanish, French, Arabic)
- Separator → Copy + Copy as Markdown

---

## Screens to Generate Next (paste this prompt into Replit)

You are extending **BookSage Studio**, a React + TypeScript desktop app. Below is the design system. Generate ONLY the two missing screens. Do NOT re-generate anything already built.

---

### Design System (add these new tokens to `_group.css` if not already present)

```css
/* Already exists — keep as-is */
--bs-bg: #1a1a1a;
--bs-panel: #242424;
--bs-surface: #2e2e2e;
--bs-surface-hover: #3a3a3a;
--bs-border: #333333;
--bs-border-strong: #444444;
--bs-text: #d4d4d4;
--bs-text-muted: #8a8a8a;
--bs-text-bright: #ffffff;
--bs-accent: #009688;
--bs-accent-hover: #00796b;
--bs-done: #4caf50;
--bs-process: #ff9800;
--bs-error: #f44336;
--bs-log-bg: #111111;

/* v3 additions — add these */
--bs-heading: #e05252;
--bs-code-bg: #2a1a1a;
--bs-code-text: #e05252;
--bs-callout-border: #4a7a9b;
--bs-nav-icon: #8a8a8a;
--bs-nav-active: #009688;
--bs-copilot-bg: #1e2a2a;
--bs-copilot-border: #2a4a46;
```

Fonts: `Inter` for all text, `JetBrains Mono` for code and numbers (both via Google Fonts, already imported).

---

### Screen A: Enhanced Library View (`LibraryView.tsx`)

This replaces the basic library shown in `AppShell.tsx`. It is a richer, more detailed home screen.

**Overall layout:** Full content area. No left sidebar.

**Top header bar (56px tall, `--bs-panel` bg, border-bottom `--bs-border`):**
- Left: "📚 My Library" (BookOpen icon, 16px + text "My Library", font-size 16px, font-weight 700, `--bs-text-bright`)
- Center: search input — 360px wide, `--bs-surface` bg, `--bs-border-strong` border, 8px border-radius, magnifier icon left-padded, placeholder "Search books by title or author...", font-size 13px
- Right: two buttons side by side:
  - "Sort by ▾" ghost button (`--bs-surface` bg, `--bs-border-strong` border, ChevronDown icon)
  - "Import Book" filled button (`--bs-accent` bg, white text, Plus icon, 8px border-radius)

**Stats bar (32px, just below header, `--bs-bg` bg):** Three inline stats separated by `|` in `--bs-text-muted`:
- "6 Books" · "174 Chapters total" · "87 Chapters processed"

**Book Grid (padding: 24px, gap: 20px, `repeat(auto-fill, minmax(220px, 1fr))`):**

Each book card (220px wide, fully rounded-lg, `--bs-border` border, overflow-hidden):

Top section (book cover, 160px tall, `--bs-surface` bg):
- Large book title text centered vertically (font-size 15px, font-weight 700, `--bs-heading` color, padding 16px)
- Author name below title (font-size 11px, `--bs-text-muted`)
- Top-right corner: a small status badge — "✓ Done" in green, "Processing" in orange, "Partial" in teal, or "New" in muted — 10px pill style

Bottom section (`--bs-panel` bg, padding 12px):
- Book title truncated (1 line, font-size 12px, font-weight 600, `--bs-text-bright`)
- Two-column row: "48 chapters" (left, `--bs-text-muted`, 11px) + "87%" right-aligned (teal, JetBrains Mono, 11px)
- Progress bar: 4px tall, `--bs-surface` track, `--bs-accent` fill
- Action buttons row (only visible on card hover, flex row): 
  - "📖 Read" (BookOpen icon, ghost small button)
  - "📝 Notes" (FileText icon, ghost small button)
  - "⟳ Reprocess" (RefreshCw icon, ghost small button, `--bs-error` color)

**Sample book data to display:**
1. "48 Laws of Power" — Robert Greene — 15/48 chapters — Partial
2. "Thinking, Fast and Slow" — Daniel Kahneman — 48/48 — Done
3. "Atomic Habits" — James Clear — 8/52 — Partial
4. "The Art of War" — Sun Tzu — 13/13 — Done
5. "Deep Work" — Cal Newport — 0/42 — New
6. "Sapiens" — Yuval Harari — 3/20 — Partial

**Empty state (only shown when 0 books):** Centered — large BookOpen icon (64px, `--bs-text-muted`), "No books yet", subtitle "Import a PDF to get started", large "Import Your First Book" button.

**Card hover:** `background-color: --bs-surface-hover` on cover area, lift shadow `0 4px 16px rgba(0,0,0,0.4)`, action buttons fade in.

---

### Screen B: Enhanced Book Reader (`BookReaderFull.tsx`)

A fully detailed PDF reading experience. This is a standalone component showing one complete reading session.

**Overall layout:** Three panels — Left (240px) + Center (flexible) + Right (280px, collapsible)

**Left panel — Chapter List (`--bs-panel` bg, right-border `--bs-border`):**
- Header: "Chapters (48)" bold, 12px, `--bs-text-bright` + a `Filter` icon right-aligned
- Each chapter row (42px tall, border-bottom `--bs-border`):
  - Chapter number badge: 22px circle, `--bs-surface` bg, `--bs-text-muted` text
  - Chapter title, truncated, 12px
  - Right: page range "pp.27–38" in `--bs-text-muted`, 10px
  - Status indicator: tiny colored dot (green=done, orange=processing, grey=pending, red=error)
- Active chapter (chapter 3): `--bs-surface` bg, `border-left: 2px solid var(--bs-accent)`, chapter number badge in `--bs-accent` color
- Small "Jump to page" input at bottom of chapter list (optional, compact)

**Center — Reading Area (`#111111` background):**
Top reading toolbar (44px, `--bs-panel` bg, border-bottom `--bs-border`):
  - Page navigation: `←` arrow | page input `[ 3 ]` styled like a small input (`--bs-surface` bg, 48px wide, center-aligned) | `/ 48` text | `→` arrow
  - Separator
  - Zoom: `−` button | `100%` label | `+` button
  - Right side: "Word Mode" toggle button (inactive: `--bs-surface` bg) + "✦ Copilot" toggle button (`--bs-accent` bg, white text, Sparkles icon)

PDF page content (centered in the dark canvas, max-width 680px):
  - The "paper" is a cream/white rectangle (`background: #f3efe5`) with generous padding (48px) and a realistic page shadow: `box-shadow: 0 4px 32px rgba(0,0,0,0.6)`
  - Book content inside: serif-like styling for the "book" text feel
    - H1: "Conceal Your Intentions" — font-size 28px, font-weight 800, color #252525
    - Subhead italic: "Keep people off-balance and in the dark by never revealing the purpose behind your actions." — italic, color #555
    - Body paragraphs: font-size 15px, line-height 1.9, color #333, font-family serif (Georgia or similar)
    - The word "off-balance" is highlighted in a soft teal semi-transparent highlight: `background: rgba(0,150,136,0.25)` — this shows the word-highlight feature
  - The "✦ Copilot" floating pill appears above the highlighted text: teal background (#009688), white text "✦ Copilot", 6px border-radius, font-size 11px, small shadow

**Right panel — Reading Info (`--bs-panel` bg, 280px, left-border `--bs-border`):**
All content inside has 16px padding.

Section: "Current Chapter" label (10px, uppercase, `--bs-text-muted`, tracking-wider)
- Card (`--bs-surface` bg, border `--bs-border-strong`, border-radius 8px, padding 12px):
  - "Law 3: Conceal Your Intentions" — 13px, font-weight 600, `--bs-text-bright`
  - "Pages 27–38" — 11px, `--bs-text-muted`
  - Status row: green dot + "AI Notes Ready" — 11px, `--bs-done`

Section: "AI Core Lesson" label
- Card (`--bs-surface` bg, border-left `3px solid var(--bs-accent)`, border-radius 0 6px 6px 0, padding 10px 12px):
  - Italic text: "Keep people off-balance. Strategic ambiguity preserves room to move while others commit prematurely." — 12px, `--bs-text`, line-height 1.6

Section: "Reading Progress"
- Donut-style display: large number "15" in `--bs-accent` (font-size 28px, JetBrains Mono) + small text "/ 48 chapters" to the right
- Thin progress bar below: same style as library cards

Section: "Quick Actions" (three small buttons in a column):
- "📝 View Notes" — navigates to Notes view
- "🤖 Open AI Chat" — opens chat with this chapter as context
- "⬇ Export Chapter" — ghost button, `--bs-error` text for danger action

---

### Technical Requirements for Both Screens
1. TypeScript — no `any` types
2. All colors via CSS variables — no hardcoded hex in JSX styles (exception: the book paper cream `#f3efe5` and body text `#252525` in the PDF page are intentional "book" colors, not app colors)
3. Use Lucide React for all icons: `BookOpen`, `FileText`, `Filter`, `Plus`, `Search`, `ChevronDown`, `RefreshCw`, `Sparkles`, `Send`, `ArrowLeft`, `ArrowRight`, `ZoomIn`, `ZoomOut`
4. Export as named exports: `export function LibraryView()` and `export function BookReaderFull()`
5. All mockup data hardcoded — no props needed
6. Add `booksage-mono` className (JetBrains Mono) to numeric values (progress %, chapter numbers, page numbers)
