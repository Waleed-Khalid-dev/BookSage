import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ShortcutAction = 
  | 'highlight' 
  | 'underline' 
  | 'strikethrough' 
  | 'tts-play-pause' 
  | 'undo' 
  | 'redo' 
  | 'eraser' 
  | 'freehand'
  | 'toggle-split-view';

export interface Shortcut {
  key: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

export const defaultShortcuts: Record<ShortcutAction, Shortcut> = {
  highlight: { key: 'h', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false },
  underline: { key: 'u', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false },
  strikethrough: { key: 's', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false },
  'tts-play-pause': { key: ' ', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false },
  undo: { key: 'z', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false },
  redo: { key: 'y', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false }, // Ctrl+Y as default
  eraser: { key: 'e', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false },
  freehand: { key: 'd', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false },
  'toggle-split-view': { key: '\\', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false },
};

export const actionLabels: Record<ShortcutAction, string> = {
  highlight: 'Highlight',
  underline: 'Underline',
  strikethrough: 'Strikethrough',
  'tts-play-pause': 'Play/Pause TTS',
  undo: 'Undo Drawing/Highlight',
  redo: 'Redo Drawing/Highlight',
  eraser: 'Toggle Eraser',
  freehand: 'Toggle Freehand Draw',
  'toggle-split-view': 'Toggle Split View',
};

interface ShortcutState {
  shortcuts: Record<ShortcutAction, Shortcut>;
  updateShortcut: (action: ShortcutAction, shortcut: Shortcut) => void;
  resetToDefaults: () => void;
}

export const useShortcutStore = create<ShortcutState>()(
  persist(
    (set) => ({
      shortcuts: { ...defaultShortcuts },
      
      updateShortcut: (action, shortcut) => set((state) => ({
        shortcuts: {
          ...state.shortcuts,
          [action]: shortcut
        }
      })),
      
      resetToDefaults: () => set({ shortcuts: { ...defaultShortcuts } })
    }),
    {
      name: 'booksage-shortcuts-storage',
    }
  )
);
