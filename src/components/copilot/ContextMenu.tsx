import React, { useEffect, useRef } from 'react';
import { useChatStore, QuickActionType } from '../../stores/chatStore';
import { useBookStore } from '../../stores/bookStore';
import { useApiKeys } from '../../stores/apiKeysStore';
import { getProviderForModel } from './ModelSelector';
import './ContextMenu.css';

const TRANSLATE_LANGS = [
  'Spanish', 'French', 'Arabic', 'Urdu', 'German',
  'Chinese', 'Japanese', 'Portuguese', 'Italian', 'Russian',
];

/**
 * Props for the AI Copilot Context Menu.
 */
interface ContextMenuProps {
  /** Callback fired when the user selects 'Save Highlight' */
  onSaveHighlight?: (text: string) => void;
}

/**
 * Renders a custom right-click context menu containing native copy/highlight actions
 * alongside AI Copilot tools (Summarize, Translate, etc.) nested in submenus.
 */
export function ContextMenu({ onSaveHighlight }: ContextMenuProps) {
  const {
    showContextMenu, contextMenuPos, selection,
    closeContextMenu, setShowPopup, openSidebar,
    setPendingQuickAction,
  } = useChatStore();
  const { aiModel } = useBookStore();
  const { hasKey, getKey } = useApiKeys();

  const ref = useRef<HTMLDivElement>(null);
  const [showTranslateSub, setShowTranslateSub] = React.useState(false);
  const [showRewriteSub, setShowRewriteSub] = React.useState(false);
  const [showStudySub, setShowStudySub] = React.useState(false);

  // Close on outside click or scroll
  useEffect(() => {
    if (!showContextMenu) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        closeContextMenu();
        setShowTranslateSub(false);
        setShowRewriteSub(false);
        setShowStudySub(false);
      }
    };
    const scrollHandler = () => {
      closeContextMenu();
      setShowTranslateSub(false);
      setShowRewriteSub(false);
      setShowStudySub(false);
    };
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
  const wordCount = hasText ? selection!.text.trim().split(/\s+/).length : 0;
  const provider = getProviderForModel(aiModel);
  const isKeyReady  = hasKey(provider);

  const doQuickAction = async (action: QuickActionType) => {
    if (!hasText || !isKeyReady) return;
    const key = getKey(provider);
    if (!key) return;
    
    closeContextMenu();
    setPendingQuickAction({ type: 'action', action });
    setShowPopup(true);      // open popup so user sees the response
  };

  const doTranslate = async (lang: string) => {
    if (!hasText || !isKeyReady) return;
    const key = getKey(provider);
    if (!key) return;
    
    closeContextMenu();
    setPendingQuickAction({ type: 'translate', lang });
    setShowPopup(true);
  };

  const doAddToSidebar = () => {
    if (selection && selection.text) {
      const ctx = `> ${selection.text.trim()}\n\n`;
      window.dispatchEvent(new CustomEvent('append-chat-input', { detail: ctx }));
    }
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
      onMouseDown={e => e.preventDefault()}
    >
      {/* AI actions */}
      <button className="ctx-item ctx-item--ai" onClick={doAddToSidebar}>
        <span className="ctx-icon">💬</span> Add to Chat Context
      </button>
      <button className="ctx-item ctx-item--ai" onClick={() => { closeContextMenu(); setShowPopup(true); }}>
        <span className="ctx-icon">✦</span> Quick Ask
      </button>

      <div className="ctx-separator" />

      {/* 1. Quick Lookups (1-3 words) */}
      {wordCount > 0 && wordCount <= 3 && (
        <>
          <button className="ctx-item" onClick={() => doQuickAction('define')} disabled={!isKeyReady}>
            <span className="ctx-icon">📖</span> Define
          </button>
          <button className="ctx-item" onClick={() => doQuickAction('encyclopedia')} disabled={!isKeyReady}>
            <span className="ctx-icon">🏛️</span> Encyclopedia Lookup
          </button>
          <div className="ctx-separator" />
        </>
      )}

      {/* 2. Standard Summarization & Explanation */}
      {wordCount > 3 && (
        <>
          <button className="ctx-item" onClick={() => doQuickAction('summarize')} disabled={!isKeyReady}>
            <span className="ctx-icon">📋</span> Summarize
          </button>
          <button className="ctx-item" onClick={() => doQuickAction('eli5')} disabled={!isKeyReady}>
            <span className="ctx-icon">🧠</span> Simplify (ELI5)
          </button>
        </>
      )}
      <button className="ctx-item" onClick={() => doQuickAction('explain')} disabled={!hasText || !isKeyReady}>
        <span className="ctx-icon">💡</span> Explain
      </button>
      <button className="ctx-item" onClick={() => doQuickAction('grammar')} disabled={!hasText || !isKeyReady}>
        <span className="ctx-icon">✅</span> Fix Grammar
      </button>

      <div className="ctx-separator" />

      {/* 3. Rewrite Submenu */}
      <div 
        className={`ctx-item ctx-item--parent ${showRewriteSub ? 'active' : ''} ${(!hasText || !isKeyReady) ? 'disabled' : ''}`}
        style={{ position: 'relative' }}
        onMouseEnter={() => setShowRewriteSub(true)}
        onMouseLeave={() => setShowRewriteSub(false)}
      >
        <span className="ctx-icon">✍️</span> Rewrite
        <span className="ctx-arrow">▶</span>
        {showRewriteSub && (
          <div className="ctx-submenu">
            <button className="ctx-item" onClick={() => doQuickAction('professional')}>Professional</button>
            <button className="ctx-item" onClick={() => doQuickAction('casual')}>Friendly / Casual</button>
            <button className="ctx-item" onClick={() => doQuickAction('academic')}>Academic</button>
            <button className="ctx-item" onClick={() => doQuickAction('concise')}>Make Concise</button>
            <div className="ctx-separator" />
            <button className="ctx-item" onClick={() => doQuickAction('shorten')}>Make Shorter</button>
            <button className="ctx-item" onClick={() => doQuickAction('lengthen')}>Make Longer</button>
          </div>
        )}
      </div>

      {/* 4. Study Tools Submenu */}
      {wordCount > 3 && (
        <div 
          className={`ctx-item ctx-item--parent ${showStudySub ? 'active' : ''} ${(!hasText || !isKeyReady) ? 'disabled' : ''}`}
          style={{ position: 'relative' }}
          onMouseEnter={() => setShowStudySub(true)}
          onMouseLeave={() => setShowStudySub(false)}
        >
          <span className="ctx-icon">🎓</span> Study Tools
          <span className="ctx-arrow">▶</span>
          {showStudySub && (
            <div className="ctx-submenu">
              <button className="ctx-item" onClick={() => doQuickAction('takeaways')}>Key Takeaways</button>
              <button className="ctx-item" onClick={() => doQuickAction('flashcard')}>Generate Flashcard</button>
            </div>
          )}
        </div>
      )}

      {/* Translate submenu */}
      <div 
        className={`ctx-item ctx-item--parent ${showTranslateSub ? 'active' : ''} ${(!hasText || !isKeyReady) ? 'disabled' : ''}`}
        style={{ position: 'relative' }}
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
