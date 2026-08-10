# BookSage Phase 6: AI Copilot Layer

## Overview
We are building the AI Copilot for BookSage, a self-contained reading studio. The copilot provides in-app AI features triggered via text selection and context menus. This phase will connect the frontend UI to the existing `ai_chat.py` backend.

## Project Type
WEB (React 18 / Tauri Desktop)

## Success Criteria
1. Selecting text shows a custom Context Menu on right-click.
2. Clicking quick actions opens the floating `CopilotPopup.tsx`.
3. Model selector correctly displays AI providers.
4. Pinned `CopilotSidebar.tsx` allows extended chat sessions.
5. All UI correctly wires to the `ai_chat.py` backend via Tauri IPC, injecting selected text as context.

## Tech Stack
- Frontend: React 18 + TypeScript + Zustand (`chatStore.ts`)
- Styling: Vanilla CSS variables (matches `_group.css` tokens)
- Backend Integration: Tauri IPC calling `pythonService.ts` -> `ai_chat.py`

## File Structure (To Add/Modify)
- `src/components/copilot/ContextMenu.tsx`
- `src/components/copilot/CopilotPopup.tsx`
- `src/components/copilot/ModelSelector.tsx`
- `src/components/copilot/CopilotSidebar.tsx`
- `src/components/copilot/QuickActions.tsx`
- `src/hooks/useTextSelection.ts`
- `src/stores/chatStore.ts`

## Task Breakdown

### Task 1: Global State & Hook for Text Selection
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-architecture`
- **Priority**: P1
- **Dependencies**: None
- **INPUT**: React environment
- **OUTPUT**: `useTextSelection.ts` and `chatStore.ts` initialized.
- **VERIFY**: Text selection on the PDF canvas updates `chatStore` with the selected string and bounding rectangle.

### Task 2: Custom Context Menu
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-architecture`, `frontend-design`
- **Priority**: P1
- **Dependencies**: Task 1
- **INPUT**: Selected text state
- **OUTPUT**: `ContextMenu.tsx` appearing on right-click instead of native OS menu.
- **VERIFY**: Right-clicking selected text opens the custom menu with options like "Summarize", "Simplify", etc.

### Task 3: Floating Copilot Popup & Model Selector
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **Priority**: P1
- **Dependencies**: Task 2
- **INPUT**: Context Menu actions
- **OUTPUT**: `CopilotPopup.tsx` and `ModelSelector.tsx`.
- **VERIFY**: Clicking a quick action from the Context Menu opens the popup anchored near the selection bounding box, displaying the model dropdown.

### Task 4: Extended Chat Sidebar
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **Priority**: P2
- **Dependencies**: None
- **INPUT**: Sidebar layout area
- **OUTPUT**: `CopilotSidebar.tsx`.
- **VERIFY**: User can pin the chat session to the right sidebar for persistent Q&A with the book.

### Task 5: Wiring to Python Backend (Tauri IPC)
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-architecture`
- **Priority**: P0
- **Dependencies**: Task 3, Task 4
- **INPUT**: Frontend chat UI events
- **OUTPUT**: IPC calls to `pythonService.ts` executing `ai_chat.py`.
- **VERIFY**: Prompting the AI in the popup or sidebar correctly returns a context-aware response from the active Python model.

## Phase X: Verification
- [x] Lint & Type Check: `npm run lint && npx tsc --noEmit`
- [x] UI/UX Audit: Check for correct colors (no purple/violet) and Obsidian-style visual grammar
- [x] Build Check: `npm run build`
- [x] Integration Test: Run app, select text, right-click, summarize text, receive AI response successfully.
