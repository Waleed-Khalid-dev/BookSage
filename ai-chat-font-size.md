# Plan: Font Size Controls in AI Full Chat View

## 🎯 Goal
Add font size increasing (`A+`) and decreasing (`A-`) controls in the header of the Full AI Chat view (`AIChatView.tsx`), exactly matching the behavior and styling in the Copilot Sidebar (`CopilotSidebar.tsx`), allowing dynamic scaling of chat message text across all themes.

---

## 🔍 Task Breakdown

### 1. State & Controls in `AIChatView.tsx`
- Add local state: `const [fontSize, setFontSize] = useState<number>(14);` (bounded between `11px` and `24px`).
- In `.acv-header-actions` (top-right of the main chat container), insert:
  ```tsx
  <button className="acv-font-btn" title="Decrease font size" onClick={() => setFontSize(f => Math.max(11, f - 1))}>A-</button>
  <button className="acv-font-btn" title="Increase font size" onClick={() => setFontSize(f => Math.min(24, f + 1))}>A+</button>
  ```
- Attach the dynamic style to the thread container:
  ```tsx
  <div className="acv-thread" style={{ fontSize: `${fontSize}px` }}>
  ```

### 2. Scalable CSS in `AIChatView.css`
- Update `.acv-msg-content` font size to `font-size: 1em;` so message text inherits and scales with `.acv-thread`.
- Update inline `.acv-msg-content code` to `font-size: 0.88em;` for proportional scaling.
- Add `.acv-font-btn` styling to match the header buttons (`acv-export-btn`, `acv-context-toggle`) with theme-adaptive colors, border, hover states, and padding.

---

## 🛡️ Non-Breaking Guarantee
- Does not modify any store schemas or database tables.
- Does not affect sidebar copilot, book reader, notes viewer, or pipeline views.
- Preserves all Markdown parsing (`ReactMarkdown`, `remarkGfm`), copy/pin actions, and follow-up pill functionality.

---

## 🧪 Verification Plan
1. **Build Verification**: Run `npm run build` (`tsc && vite build`) to ensure 0 TypeScript or bundling errors.
2. **Behavioral Test**:
   - Verify `A+` increases message font size step-by-step up to `24px`.
   - Verify `A-` decreases message font size step-by-step down to `11px`.
   - Verify headers, lists, code blocks, bold text, and user bubbles scale smoothly in Light, Dark, Sepia, Night, OLED, and Focus themes.
