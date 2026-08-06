import { useEffect } from 'react';
import { useShortcutStore, ShortcutAction } from '../stores/shortcutStore';

export function useShortcuts() {
  const shortcuts = useShortcutStore(state => state.shortcuts);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore keypresses inside input fields, textareas, and contenteditable elements
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      for (const [action, shortcut] of Object.entries(shortcuts)) {
        if (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          e.ctrlKey === shortcut.ctrlKey &&
          e.shiftKey === shortcut.shiftKey &&
          e.altKey === shortcut.altKey &&
          e.metaKey === shortcut.metaKey
        ) {
          const matchedAction = action as ShortcutAction;
          e.preventDefault();
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('shortcut-triggered', { detail: { action: matchedAction } }));
          return; // Trigger only one action
        }
      }
    };

    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
  }, [shortcuts]);
}
