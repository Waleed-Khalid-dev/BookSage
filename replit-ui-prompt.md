# BookSage Studio — New Panels Prompt for Replit

## Context for Replit

You are extending a React + TypeScript desktop app called **BookSage Studio**, built with Tauri. The existing design system uses CSS variables defined in `_group.css`:

**Existing Color Tokens (dark theme):**
- `--bs-bg: #1a1a1a` — root background
- `--bs-panel: #242424` — sidebars, toolbars
- `--bs-surface: #2e2e2e` — cards, inputs
- `--bs-surface-hover: #3a3a3a`
- `--bs-border: #333333`
- `--bs-border-strong: #444444`
- `--bs-text: #d4d4d4`
- `--bs-text-muted: #8a8a8a`
- `--bs-text-bright: #ffffff`
- `--bs-accent: #009688` — teal, primary CTA
- `--bs-done: #4caf50`
- `--bs-process: #ff9800`
- `--bs-error: #f44336`

**New tokens you MUST add for v3:**
- `--bs-heading: #e05252` — H1/H2 headings in reading views (matches Obsidian's red heading style)
- `--bs-code-bg: #2a1a1a` — inline code background
- `--bs-code-text: #e05252` — inline code text
- `--bs-callout-border: #4a7a9b` — callout block left border
- `--bs-nav-icon: #8a8a8a` — sidebar nav icon inactive
- `--bs-nav-active: #009688` — sidebar nav icon active
- `--bs-copilot-bg: #1e2a2a` — copilot popup background (slightly teal-tinted dark)
- `--bs-copilot-border: #2a4a46` — copilot popup border

**Fonts:** Inter (regular text), JetBrains Mono (code, logs, numbers)

The overall visual style is: **dark, minimal, data-dense**. Think VS Code meets Obsidian. No gradients. No shadows except for floating panels (use `box-shadow: 0 8px 32px rgba(0,0,0,0.6)`). Every interactive element has a subtle hover state (`--bs-surface-hover`).

The existing screens (already built):
1. `MainWindow.tsx` — the pipeline view (chapter list, center preview, export right panel)
2. `SettingsDialog.tsx` — settings modal with tabs

---

## Screens to Design

### Screen 1: Icon Navigation Sidebar

This is a thin vertical strip on the far left of the app window, always visible. It sits between the window edge and all view content.

**Specs:**
- Width: exactly 48px
- Background: `--bs-bg` (not `--bs-panel`)
- Top section: 5 navigation icons stacked vertically, each in a 48x48 square
- Bottom section: Settings gear icon pinned to bottom
- Icons use Lucide React: `Home` (Library), `BookOpen` (Book Reader), `FileText` (Notes Viewer), `Cpu` (Pipeline/Process), `MessageSquare` (AI Chat), `Settings` (bottom)
- **Active state:** icon area gets a left border `3px solid var(--bs-accent)` and icon color switches from `--bs-nav-icon` to `--bs-nav-active`
- **Hover state:** `background-color: var(--bs-surface)` on the 48x48 square
- **Tooltips:** each icon shows a tooltip on the right side on hover: "Library", "Book Reader", "Notes", "Process", "AI Chat"
- A thin 1px vertical separator on the right side of the sidebar using `--bs-border`

---

### Screen 2: Library / Home View

This is the first screen users see. It shows all books that have been imported and processed.

**Layout:** Full content area (minus the icon sidebar). No secondary sidebars.

**Top bar (48px tall):**
- Left: "My Library" as a section title (font-size 18px, `--bs-text-bright`, font-weight 600)
- Right: A search input (placeholder: "Search books...") styled like the settings inputs — `--bs-surface` background, `--bs-border-strong` border, 280px wide, rounded — and an "Import Book" button using `--bs-accent` as background with a `Plus` icon

**Book Grid:**
- CSS grid, `repeat(auto-fill, minmax(200px, 1fr))`, gap 24px, padding 24px
- Each book card (200px wide, ~280px tall):
  - Top 60% of card: a generated cover area — solid dark rectangle (`--bs-surface`) with the book title overlaid in large bold text (`--bs-heading` color, font-size 14px), and a small `BookOpen` icon top-right in teal
  - Bottom 40%: white-text area in `--bs-panel` with:
    - Book title (1 line, ellipsis overflow, `--bs-text-bright`, font-size 12px, font-weight 600)
    - Chapter count: "48 chapters" (`--bs-text-muted`, font-size 11px)
    - Progress bar: thin 4px bar, `--bs-surface` track, `--bs-accent` fill, with "15 / 48" label right-aligned in JetBrains Mono, font-size 10px
    - Two icon buttons at bottom: `BookOpen` ("Read") and `FileText` ("Notes") — small, ghost style, only visible on card hover
  - Card hover: `background-color: --bs-surface-hover`, lift effect with `box-shadow: 0 4px 16px rgba(0,0,0,0.4)`
  - Border: `1px solid var(--bs-border)`, border-radius 8px

**Empty state (no books):** Centered in the grid area — a large `BookOpen` icon (64px, `--bs-text-muted`) above "No books yet", subtitle "Import a PDF to get started", and a large "Import Your First Book" button.

---

### Screen 3: Book Reader View

A full-featured PDF reading experience with page navigation and Copilot-ready text selection.

**Layout:** Three zones — left chapter list (240px), center reading area (flexible), right info panel (280px, collapsible)

**Left panel — Chapter List:**
- Header: "Chapters (48)" with a collapse icon
- Each chapter row: chapter number badge (teal, 22px circle), chapter title (truncated), page range right-aligned in `--bs-text-muted`
- Active chapter highlighted with `--bs-surface` background and left border `2px solid var(--bs-accent)`

**Center — PDF Page Canvas:**
- Background: `#111111` (darker than `--bs-bg`) to make the white page pop
- The PDF page renders as a white/cream canvas rectangle, centered with auto margins, max-width 720px
- Above the page: a subtle top toolbar (40px, `--bs-panel` bg) with:
  - Left-arrow button, page input (`[3] / 48`), right-arrow button (all compact, same style as existing toolbar buttons)
  - Zoom: `[−] 100% [+]`
  - Right side: "Word Mode" toggle button and "Copilot" toggle button
- The page has a realistic shadow: `box-shadow: 0 4px 24px rgba(0,0,0,0.5)`
- When text is selected on the page, a small floating pill appears just above the selection: teal background, `--bs-text-bright` text, reading "✦ Copilot" with a chevron-right icon

**Right panel — Reading Info:**
- Collapsible; when open shows 280px panel with `--bs-panel` background
- Sections:
  - "Current Chapter" card: chapter title, page range, status badge
  - "AI Notes Preview": shows the `core_lesson` field from the processed JSON for this chapter (or "Not yet processed" if pending)
  - "Reading Progress" donut chart (same style as existing DonutChart component): chapters read / total
  - "Quick Copilot" button: opens copilot sidebar

---

### Screen 4: Notes Viewer

An Obsidian-style rendered Markdown viewer for AI-generated chapter notes.

**Layout:** Left chapter list (240px, same as Book Reader) + center content area

**Left panel — identical to Book Reader chapter list** but with status badges (done/processing/error) same as pipeline view

**Center — Markdown Rendering Area:**
- Background: `--bs-bg`
- Content max-width: 720px, centered, padding 48px horizontal, 32px vertical
- This is the critical visual area. Apply these Obsidian-matching styles:

**Typography rules:**
- H1: `font-size: 28px; font-weight: 700; color: var(--bs-heading); /* #e05252 red */`
- H2: `font-size: 20px; font-weight: 600; color: var(--bs-heading); border-bottom: 1px solid var(--bs-border); padding-bottom: 8px;`
- H3: `font-size: 16px; font-weight: 600; color: var(--bs-text-bright);`
- Body text: `font-size: 15px; line-height: 1.8; color: var(--bs-text);`
- Strong: `color: var(--bs-text-bright); font-weight: 600;`
- Inline code: `background: var(--bs-code-bg); color: var(--bs-code-text); padding: 1px 6px; border-radius: 4px; font-family: JetBrains Mono; font-size: 13px;`
- Code blocks: `background: #111111; border: 1px solid var(--bs-border-strong); border-radius: 6px; padding: 16px; font-family: JetBrains Mono;`
- Block quotes: `border-left: 3px solid var(--bs-accent); padding-left: 16px; color: var(--bs-text-muted); font-style: italic;`
- Lists: standard spacing, bullet color `var(--bs-accent)`
- Links: `color: var(--bs-accent); text-decoration: none;` hover underline

**Obsidian Callout Blocks** — render any `> [!tip]`, `> [!note]`, `> [!warning]`, `> [!important]` as styled cards:
- Container: `border-radius: 6px; border-left: 4px solid [callout-color]; background: color-mix(in srgb, [callout-color] 8%, transparent); padding: 12px 16px;`
- `[!tip]`: border/icon color `#009688` (teal), icon `Lightbulb`
- `[!note]`: border/icon color `#4a7a9b` (blue), icon `Info`
- `[!warning]`: border/icon color `#ff9800` (orange), icon `AlertTriangle`
- `[!important]`: border/icon color `#e05252` (red), icon `AlertCircle`
- Title row: callout type label in bold + icon, then body text below

**Top bar of Notes area:** Three tabs — `📖 Book Reader` | `📝 Notes` | `📄 Raw Markdown` — styled same as existing center panel tabs. Active tab has `--bs-accent` bottom border.

**Text selection → show "✦ Copilot" pill** (identical to Book Reader behavior)

---

### Screen 5: AI Chat View (Full Screen)

A dedicated full-screen chat interface with the AI, with the book loaded as context.

**Layout:** Two columns — left context panel (300px) + right chat area

**Left — Context Panel:**
- Header: "Chat Context" label
- "Active Book" card: book title, chapter count badge
- "Context Mode" radio group:
  - `● Full Book Summary` (all chapter summaries injected)
  - `○ Current Chapter` (only active chapter)
  - `○ Selected Chapters` (checkboxes for multi-chapter)
- "System Prompt" editable textarea (small, 80px tall) — shows the current persona/instruction for this session
- "Clear Chat" danger button at bottom

**Right — Chat Area:**
- Background: `--bs-bg`
- Messages list (scrollable, grows upward):
  - **User messages:** right-aligned, `--bs-accent` background, white text, `border-radius: 12px 12px 2px 12px`, max-width 70%
  - **AI messages:** left-aligned, `--bs-surface` background, `--bs-text` color, `border-radius: 12px 12px 12px 2px`, max-width 85%, supports inline Markdown rendering (bold, code, lists)
  - Each AI message has a small model name + icon in `--bs-text-muted` above it
  - Loading state: three animated dots in `--bs-process` color
- **Input area** (fixed bottom, `--bs-panel` background, 80px tall, border-top `--bs-border`):
  - Full-width textarea (auto-grows, max 4 lines): `--bs-surface` background, no border radius mismatch, `placeholder: "Ask anything about this book..."`
  - Row below textarea: `ModelSelector` dropdown on the left + send button (`--bs-accent`, `ArrowUp` icon) on the right
  - Send on Enter (Shift+Enter for newline)

---

### Screen 6: Copilot Floating Popup

This is a floating panel that appears when the user selects text in Book Reader or Notes Viewer and clicks the "✦ Copilot" pill or uses the right-click context menu.

**Behavior:** Appears anchored 16px above the bounding rect of the text selection. If there's insufficient space above, it flips below. Dismisses on Escape or click-outside.

**Dimensions:** 420px wide, auto height (min 180px)

**Visual design:**
- Background: `var(--bs-copilot-bg)` (`#1e2a2a`)
- Border: `1px solid var(--bs-copilot-border)` (`#2a4a46`)
- Border-radius: 10px
- Box-shadow: `0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,150,136,0.1)`
- A 3px teal drag handle bar centered at the top (just a visual affordance, not actually draggable in mockup)

**Header row (32px tall):**
- Left: `✦ Copilot` label with `Sparkles` icon (12px, teal), font-size 12px, `--bs-text-bright`, font-weight 600
- Right: `×` close button

**Selected text preview (optional, shows first 80 chars):**
- 10px font, `--bs-text-muted`, italic, inside a `--bs-surface` pill, margin 0 12px, border-radius 6px, padding 6px 10px

**Quick Actions row (horizontal scroll if needed):**
- Small pill buttons in a flex row: "Summarize", "Simplify", "Explain", "Shorter", "Longer"
- Style: `background: --bs-surface; border: 1px solid --bs-border-strong; border-radius: 20px; padding: 4px 12px; font-size: 11px; color: --bs-text-bright;`
- On hover: `background: --bs-accent; color: white; border-color: --bs-accent`
- When a quick action is clicked, the response appears directly in the popup body below

**Input area:**
- `background: var(--bs-surface); border-radius: 6px; border: 1px solid var(--bs-border-strong);`
- Placeholder: "Ask a question..."
- Right: Send button (`--bs-accent`, 28px square, `ArrowUp` icon)

**Model selector (compact, below input):**
- Left: colored dot (green/grey) + model name (e.g. "gemini-2.0-flash") + chevron-down — clicking opens a dropdown list
- Dropdown matches your screenshot exactly:
  - `gemini-2.0-flash   ●` (green dot, connected)
  - `gemini-1.5-pro     ●` (green)
  - separator line
  - `gpt-4o             ○  Needs API key` (grey text, dim)
  - `claude-sonnet-4    ○  Needs API key`
  - separator line
  - `Ollama (local)     ●` (if detected)

**Response area (appears after sending):**
- Renders inside the popup, below input
- Markdown-formatted, same Obsidian typography rules as Notes Viewer
- Scrollable up to 240px max height before overflow-y scroll kicks in

---

### Screen 7: Right-Click Context Menu with Copilot

The app overrides the native right-click menu with a custom component whenever the user right-clicks on selected text.

**Design:**
- Background: `--bs-surface`
- Border: `1px solid var(--bs-border-strong)`
- Border-radius: 8px
- Box-shadow: `0 8px 24px rgba(0,0,0,0.6)`
- Width: 220px min
- Font-size: 13px

**Menu items:**
```
Add selection to chat context
Quick Ask
─────────────────────────
Summarize                    →  (runs inline, opens popup)
Simplify                     →
Explain like I am 5          →
Make shorter                 →
Make longer                  →
Fix grammar and spelling     →
Translate to...              →  (sub-menu: 中文, Spanish, French, Arabic)
─────────────────────────
Copy
Copy as Markdown
```

**Copilot section header** ("Copilot" label with `Sparkles` icon and `--bs-accent` color, before the actions) — matches your screenshot exactly where "Copilot" appears as a highlighted sub-menu label.

**Item hover state:** `background: --bs-accent; color: white; border-radius: 4px;` (matches Obsidian's hover style seen in screenshot)

Items with submenus show a `chevron-right` icon on the right.

---

## Component Hierarchy Summary

```
App.tsx
├── IconSidebar.tsx (always visible, 48px)
├── LibraryView.tsx (VIEW 1)
├── BookReader.tsx (VIEW 2)
│   ├── ChapterList.tsx (left, 240px)
│   ├── PDFCanvas.tsx (center)
│   ├── PageControls.tsx (top bar)
│   └── ReadingInfoPanel.tsx (right, 280px, collapsible)
├── NotesViewer.tsx (VIEW 3)
│   ├── ChapterList.tsx (left, 240px, shared)
│   └── MarkdownRenderer.tsx (center, Obsidian CSS)
├── PipelineView.tsx (VIEW 4, existing MainWindow)
├── AIChatView.tsx (VIEW 5)
│   ├── ContextPanel.tsx (left, 300px)
│   └── ChatArea.tsx (right)
├── SettingsDialog.tsx (modal overlay)
├── CopilotPopup.tsx (floating layer, z-index 9999)
└── ContextMenu.tsx (floating layer, z-index 9998)
```

---

## Implementation Notes for Replit

1. Use **TypeScript** for all components. No `any` types.
2. All colors via CSS variables — no hardcoded hex values in JSX styles.
3. Use **Lucide React** for all icons (already installed).
4. The `CopilotPopup` must be rendered in a React Portal to escape any overflow-hidden parent.
5. The context menu must handle keyboard navigation (ArrowUp/ArrowDown, Enter, Escape).
6. The `ModelSelector` dropdown uses a `useState` for open/close, positioned absolutely relative to its trigger button.
7. `MarkdownRenderer` uses `react-markdown` with `remark-gfm` and custom `components` prop to override `h1`, `h2`, `h3`, `code`, `blockquote`, and a custom `div` handler for callout detection.
8. The icon sidebar tooltip uses CSS-only positioning: `position: absolute; left: 52px;` relative to the icon's parent.
9. Keep all mockup data hardcoded for now — this is a design prototype, not a wired implementation.
10. Export every component as a named export, not default.
