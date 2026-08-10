import React, { useEffect, useRef } from 'react';
import { useChatStore, QuickActionType } from '../../stores/chatStore';
import { useBookStore } from '../../stores/bookStore';
import './ContextMenu.css';

const TRANSLATE_LANGS = [
  'Spanish', 'French', 'Arabic', 'Urdu', 'German',
  'Chinese', 'Japanese', 'Portuguese', 'Italian', 'Russian',
];

interface ContextMenuProps {
  onSaveHighlight?: (text: string) => void;
}

export function ContextMenu({ onSaveHighlight }: ContextMenuProps) {
  const {
    showContextMenu, contextMenuPos, selection,
    closeContextMenu, setShowPopup, openSidebar,
    sendQuickAction, sendTranslate,
  } = useChatStore();
  const { apiKey, aiModel } = useBookStore();

  const ref = useRef<HTMLDivElement>(null);
  const [showTranslateSub, setShowTranslateSub] = React.useState(false);

  // Close on outside click or scroll
  useEffect(() => {
    if (!showContextMenu) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        closeContextMenu();
        setShowTranslateSub(false);
      }
    };
    const scrollHandler = () => { closeContextMenu(); setShowTranslateSub(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('scroll', scrollHandler, true);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('scroll', scrollHandler, true);
    };
  }, [showContextMenu, closeContextMenu]);

  useEffect(() => {
    if (!showContextMenu) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeContextMenu(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showContextMenu, closeContextMenu]);

  if (!showContextMenu) return null;

  // Smart positioning — flip if near right/bottom edges
  let { x, y } = contextMenuPos;
  if (ref.current) {
    const w = ref.current.offsetWidth || 220;
    const h = ref.current.offsetHeight || 360;
    if (x + w > window.innerWidth - 8) x = x - w;
    if (y + h > window.innerHeight - 8) y = y - h;
  }

  const hasText = !!(selection?.text?.trim());
  const hasKey  = !!apiKey;

  const doQuickAction = async (action: QuickActionType) => {
    if (!hasText || !hasKey) return;
    closeContextMenu();
    setShowPopup(true);      // open popup so user sees the response
    try {
      await sendQuickAction(action, selection!.text, 'gemini', apiKey, aiModel);
    } catch { /* popup shows error internally */ }
  };

  const doTranslate = async (lang: string) => {
    if (!hasText || !hasKey) return;
    closeContextMenu();
    setShowPopup(true);
    try {
      await sendTranslate(selection!.text, lang, 'gemini', apiKey, aiModel);
    } catch { /* ignore */ }
  };

  const doAddToSidebar = () => {
    closeContextMenu();
    openSidebar();
  };

  const doCopy = () => {
    if (hasText) navigator.clipboard.writeText(selection!.text);
    closeContextMenu();
  };

  const doSaveHighlight = () => {
    if (hasText && onSaveHighlight) onSaveHighlight(selection!.text);
    closeContextMenu();
  };

  return (
    <div
      ref={ref}
      className="ctx-root"
      style={{ left: x, top: y }}
      onContextMenu={e => e.preventDefault()}
    >
      {/* AI actions */}
      <button className="ctx-item ctx-item--ai" onClick={doAddToSidebar}>
        <span className="ctx-icon">💬</span> Add to Chat Context
      </button>
      <button className="ctx-item ctx-item--ai" onClick={() => { closeContextMenu(); setShowPopup(true); }}>
        <span className="ctx-icon">✦</span> Quick Ask
      </button>

      <div className="ctx-separator" />

      <button className="ctx-item" onClick={() => doQuickAction('summarize')} disabled={!hasText || !hasKey}>
        <span className="ctx-icon">📋</span> Summarize
      </button>
      <button className="ctx-item" onClick={() => doQuickAction('eli5')} disabled={!hasText || !hasKey}>
        <span className="ctx-icon">🧠</span> Simplify (ELI5)
      </button>
      <button className="ctx-item" onClick={() => doQuickAction('explain')} disabled={!hasText || !hasKey}>
        <span className="ctx-icon">💡</span> Explain
      </button>
      <button className="ctx-item" onClick={() => doQuickAction('shorten')} disabled={!hasText || !hasKey}>
        <span className="ctx-icon">✂️</span> Make Shorter
      </button>
      <button className="ctx-item" onClick={() => doQuickAction('lengthen')} disabled={!hasText || !hasKey}>
        <span className="ctx-icon">📝</span> Make Longer
      </button>
      <button className="ctx-item" onClick={() => doQuickAction('grammar')} disabled={!hasText || !hasKey}>
        <span className="ctx-icon">✅</span> Fix Grammar
      </button>

      {/* Translate submenu */}
      <div
        className="ctx-item ctx-item--sub"
        onMouseEnter={() => setShowTranslateSub(true)}
        onMouseLeave={() => setShowTranslateSub(false)}
      >
        <span className="ctx-icon">🌐</span> Translate to
        <span className="ctx-arrow">▶</span>
        {showTranslateSub && (
          <div className="ctx-submenu">
            {TRANSLATE_LANGS.map(lang => (
              <button key={lang} className="ctx-item" onClick={() => doTranslate(lang)}>
                {lang}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ctx-separator" />

      {onSaveHighlight && (
        <button className="ctx-item" onClick={doSaveHighlight} disabled={!hasText}>
          <span className="ctx-icon">🖊️</span> Save as Highlight
        </button>
      )}
      <button className="ctx-item" onClick={doCopy} disabled={!hasText}>
        <span className="ctx-icon">📋</span> Copy
      </button>

      {!hasKey && (
        <div className="ctx-no-key">⚠️ Add API key in Settings to use AI</div>
      )}
    </div>
  );
}
