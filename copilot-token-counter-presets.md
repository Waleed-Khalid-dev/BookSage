# 📋 Implementation Plan: Visual Token Counter & Configurable Presets

> **Task Slug:** `copilot-token-counter-presets`  
> **Target Files:**
> - `src/components/copilot/CopilotSidebar.tsx` & `.css`
> - `src/components/shared/SettingsDialog.tsx` & `.css`
> - `src/stores/bookStore.ts` (or dedicated slice for presets persistence)
> - `copilot-features.md`
> **Status:** ✅ Completed & Verified  
> **Mode:** Edit Mode (Implemented)

---

## 🎯 User Decisions (from /grill-me)
1. **Token Counter Location:** Located in the Context Badge header bar as a clean pill (e.g. `~1,420 tokens in context`) that dynamically recalculates whenever switching scope between Chapter, Full Book, or Custom multi-chapter selections.
2. **Presets Configuration Location:** In `SettingsDialog.tsx` under the existing "AI Copilot" tab with an editable list of presets, including "Reset to Defaults".
3. **Customization Depth:** Full editing of emoji icon, short label, and prompt question, plus ability to add custom presets, remove/disable presets, and re-order.
4. **Token Estimation Engine:** Instant client-side estimation (~4 characters per token heuristic matching OpenAI/Anthropic tokenizers) for 0ms lag when navigating or toggling scopes.

---

## 🧱 Architectural Breakdown

### 1. Preset Prompts Data Model & Persistence
- Define `CopilotPreset` type:
  ```ts
  export interface CopilotPreset {
    id: string;
    icon: string;
    label: string;
    text: string;
    enabled: boolean;
  }
  ```
- Default Presets (6 items currently in `CopilotSidebar.tsx`):
  1. 📚 Story So Far
  2. 📖 What is this chapter about?
  3. 🎯 Core lesson?
  4. 🧪 3 real-world examples
  5. ❓ Questions to ask myself
  6. 🔗 Connect to previous
- Persist in `bookStore.ts` via Zustand `persist` (`copilotPresets: CopilotPreset[]`, `setCopilotPresets`, `resetCopilotPresets`).
- `CopilotSidebar.tsx` will read `copilotPresets.filter(p => p.enabled)` directly from the store instead of using a hardcoded array.

### 2. Configurable Presets UI (`SettingsDialog.tsx`)
- Inside the "AI Copilot" tab, add a new section: **"Copilot Sidebar Presets"**.
- Features:
  - List of active/inactive preset chips with editable inputs (Icon, Label, Prompt).
  - Enable/disable toggle checkbox for each preset.
  - Delete button for custom presets.
  - "＋ Add Custom Preset" button.
  - "↺ Reset to Defaults" button.
- Clean CSS styling aligned with the BookSage dark/teal design language (`SettingsDialog.css`).

### 3. Visual Token Counter in Sidebar (`CopilotSidebar.tsx`)
- Compute estimated context tokens based on:
  - If `mode === 'chapter'`: active chapter notes JSON/text + active chapter metadata.
  - If `mode === 'book'`: all extracted chapters summaries + metadata (~250-400 tokens per chapter summary).
  - If `mode === 'custom'`: selected chapters count * average tokens per chapter.
- Display a sleek badge in the Context Badge area:
  ```tsx
  <span className="csb-token-badge" title="Estimated prompt context payload sent to AI">
    ⚡ ~{estimatedTokens.toLocaleString()} tokens
  </span>
  ```
- Subtly color-coded:
  - Under 8,000 tokens: subtle accent/teal (`var(--bs-accent)`)
  - 8,000 - 32,000 tokens: neutral muted text
  - Over 32,000 tokens: warm amber/warning hint
- Instant reactivity: changes immediately when clicking `Entire Book`, `Chapter`, or changing custom chapter selections.

---

## 🧪 Verification Plan

1. **Compilation & Type Check:**
   - Run `cmd /c "cd /d d:\[Project]\BookSage && npm run build"` to verify TypeScript typing and bundle size.
2. **Visual Token Counter:**
   - Verify the token badge updates between Chapter scope and Entire Book scope.
   - Verify tooltip displays clear context explanation.
3. **Configurable Presets in Settings:**
   - Change a preset icon or prompt in `SettingsDialog`.
   - Verify the modified preset immediately shows and functions in `CopilotSidebar`.
   - Add a new custom preset and verify it triggers correctly in chat.
   - Test "Reset to Defaults" restores original 6 presets.
4. **Git Checkpoint:**
   - Commit and push to GitHub.
