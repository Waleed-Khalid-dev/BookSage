import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatStore, QuickActionType } from '../../stores/chatStore';
import { useBookStore } from '../../stores/bookStore';
import { ModelSelector } from './ModelSelector';
import './CopilotPopup.css';

const TRANSLATE_LANGS = [
  'Spanish', 'French', 'Arabic', 'Urdu', 'German',
  'Chinese', 'Japanese', 'Portuguese', 'Italian', 'Russian',
];

interface CopilotPopupProps {
  /** Called when user clicks "Save as Highlight" from inside the popup */
  onSaveHighlight?: (text: string) => void;
  /** ID of the current chapter (for pin insight) */
  chapterId?: string;
}

export function CopilotPopup({ onSaveHighlight, chapterId }: CopilotPopupProps) {
  const {
    showPopup, selection, setShowPopup, setSelection,
    sendQuickAction, sendTranslate, pinInsight,
  } = useChatStore();
  const { apiKey, aiModel, setAiModel } = useBookStore();

  // Local model state (synced from bookStore)
  const [model, setModel] = useState(aiModel);
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'claude' | 'ollama'>('gemini');

  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);

  // Drag state
  const popupRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Position popup above selection when it appears
  useEffect(() => {
    if (!showPopup || !selection) return;
    const rect = selection.rect;
    const w = 400;
    const h = 300;
    let x = rect.left + rect.width / 2 - w / 2;
    let y = rect.top - h - 12;

    // Viewport clamping
    x = Math.max(8, Math.min(x, window.innerWidth - w - 8));
    y = y < 8 ? rect.bottom + 8 : y;

    setPos({ x, y });
    setQuestion('');
    setResponse('');
    setError('');
  }, [showPopup, selection]);

  // Close on Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Drag handlers
  const onDragStart = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    dragOffset.current = {
      x: e.clientX - (pos?.x ?? 0),
      y: e.clientY - (pos?.y ?? 0),
    };
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !popupRef.current) return;
      const pw = popupRef.current.offsetWidth;
      const ph = popupRef.current.offsetHeight;
      setPos({
        x: Math.max(0, Math.min(ev.clientX - dragOffset.current.x, window.innerWidth - pw)),
        y: Math.max(0, Math.min(ev.clientY - dragOffset.current.y, window.innerHeight - ph)),
      });
    };
    const onUp = () => { dragging.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [pos]);

  const close = () => { setShowPopup(false); setSelection(null); setShowTranslateMenu(false); };

  const handleSend = async (promptText?: string) => {
    const text = promptText ?? question;
    if (!text.trim() || !apiKey) return;
    setIsLoading(true);
    setError('');
    setResponse('');
    try {
      const contextPrefix = selection?.text
        ? `The user is asking about this text: "${selection.text}"\n\n`
        : '';
      const result = await sendQuickAction('explain' as QuickActionType, contextPrefix + text, provider, apiKey, model);
      setResponse(result);
    } catch (e: any) {
      setError(e.message ?? 'AI request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: QuickActionType) => {
    if (!selection?.text || !apiKey) return;
    setIsLoading(true);
    setError('');
    setResponse('');
    try {
      const result = await sendQuickAction(action, selection.text, provider, apiKey, model);
      setResponse(result);
    } catch (e: any) {
      setError(e.message ?? 'AI request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async (lang: string) => {
    if (!selection?.text || !apiKey) return;
    setShowTranslateMenu(false);
    setIsLoading(true);
    setError('');
    setResponse('');
    try {
      const result = await sendTranslate(selection.text, lang, provider, apiKey, model);
      setResponse(result);
    } catch (e: any) {
      setError(e.message ?? 'Translation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handlePin = async () => {
    if (chapterId && response) await pinInsight(chapterId, response);
  };

  const handleModelChange = (modelId: string, prov: any) => {
    setModel(modelId);
    setProvider(prov);
    setAiModel(modelId);
  };

  if (!showPopup || !pos) return null;

  const hasSelection = !!selection?.text;

  return (
    <div
      ref={popupRef}
      className="cpp-root"
      style={{ left: pos.x, top: pos.y }}
    >
      {/* ── Header ── */}
      <div className="cpp-header" onMouseDown={onDragStart}>
        <span className="cpp-drag-icon">⠿</span>
        <span className="cpp-title">✦ BookSage Copilot</span>
        <button className="cpp-close" onClick={close} title="Close">✕</button>
      </div>

      {/* ── Selected text context ── */}
      {hasSelection && (
        <div className="cpp-context">
          <span className="cpp-context-label">Context</span>
          <span className="cpp-context-text">"{selection!.text.slice(0, 120)}{selection!.text.length > 120 ? '…' : ''}"</span>
        </div>
      )}

      {/* ── Quick action buttons ── */}
      {hasSelection && !isLoading && !response && (
        <div className="cpp-quick-actions">
          <button onClick={() => handleQuickAction('summarize')}>📋 Summarize</button>
          <button onClick={() => handleQuickAction('eli5')}>🧠 ELI5</button>
          <button onClick={() => handleQuickAction('explain')}>💡 Explain</button>
          <button onClick={() => handleQuickAction('shorten')}>✂️ Shorter</button>
          <div className="cpp-translate-wrap">
            <button onClick={() => setShowTranslateMenu(v => !v)}>🌐 Translate ▾</button>
            {showTranslateMenu && (
              <div className="cpp-translate-menu">
                {TRANSLATE_LANGS.map(lang => (
                  <button key={lang} onClick={() => handleTranslate(lang)}>{lang}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Input ── */}
      <div className="cpp-input-row">
        <textarea
          className="cpp-input"
          placeholder={hasSelection ? 'Ask about this text…' : 'Ask BookSage Copilot…'}
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          rows={2}
        />
        <button
          className="cpp-send"
          onClick={() => handleSend()}
          disabled={isLoading || !question.trim()}
          title="Send (Enter)"
        >→</button>
      </div>

      <div className="cpp-model-row">
        <ModelSelector value={model} onChange={handleModelChange} compact activeProviders={new Set([provider])} />
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="cpp-loading">
          <span />
          <span />
          <span />
        </div>
      )}

      {/* ── Error ── */}
      {error && <div className="cpp-error">{error}</div>}

      {/* ── Response ── */}
      {response && !isLoading && (
        <div className="cpp-response">
          <div className="cpp-response-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{response}</ReactMarkdown>
          </div>
          <div className="cpp-response-actions">
            <button onClick={handleCopy} title="Copy response">
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
            {chapterId && (
              <button onClick={handlePin} title="Pin to chapter insights">📌 Pin</button>
            )}
            {onSaveHighlight && hasSelection && (
              <button onClick={() => onSaveHighlight?.(selection!.text)} title="Save as highlight">
                🖊️ Highlight
              </button>
            )}
            <button onClick={() => handleSend(question || (hasSelection ? `Explain: ${selection!.text}` : ''))} title="Regenerate">
              ⟳ Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
