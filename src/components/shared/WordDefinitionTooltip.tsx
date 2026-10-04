// src/components/shared/WordDefinitionTooltip.tsx
import React, { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';
import { Volume2, Sparkles, X, MessageSquare, Copy, Check, GripVertical } from 'lucide-react';
import { lookupWordDefinition, WordDefinitionData, cleanWordToken } from '../../services/dictionaryService';
import { invokePython } from '../../services/pythonService';
import { useApiKeys } from '../../stores/apiKeysStore';
import { useBookStore } from '../../stores/bookStore';
import { useChatStore } from '../../stores/chatStore';
import { saveCachedWordDefinition } from '../../services/dbService';
import './WordDefinitionTooltip.css';

export interface WordDefinitionTarget {
  word: string;
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  bookTitle?: string;
  chapterNum?: number;
  chapterTitle?: string;
  chapterPath?: string;
  surroundingText?: string;
}

interface WordDefinitionTooltipProps {
  target: WordDefinitionTarget | null;
  onClose: () => void;
}

export const WordDefinitionTooltip: React.FC<WordDefinitionTooltipProps> = ({ target, onClose }) => {
  const [data, setData] = useState<WordDefinitionData | null>(null);
  const [loadingDict, setLoadingDict] = useState<boolean>(true);
  const [dictError, setDictError] = useState<string | null>(null);
  const [bookContext, setBookContext] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const [pos, setPos] = useState<{ top: number; left: number; placement: 'below' | 'above' }>({
    top: 0,
    left: 0,
    placement: 'below',
  });

  const { getKey } = useApiKeys();
  const selectedModel = useBookStore(s => s.aiModel) || 'gemini-3.6-flash';
  const provider = selectedModel.includes('gpt') ? 'openai' : selectedModel.includes('claude') ? 'claude' : 'gemini';
  const apiKey = getKey(provider);

  const cleanWord = target ? cleanWordToken(target.word) : '';

  // 1. Initial smart floating positioning relative to clicked word
  useLayoutEffect(() => {
    if (!target) return;
    const { top, left, width, height } = target.rect;
    const tooltipWidth = 350;
    const estimatedHeight = 280;
    const margin = 12;

    let computedLeft = left + width / 2 - tooltipWidth / 2;
    if (computedLeft < margin) computedLeft = margin;
    if (computedLeft + tooltipWidth > window.innerWidth - margin) {
      computedLeft = window.innerWidth - tooltipWidth - margin;
    }

    let placement: 'below' | 'above' = 'below';
    let computedTop = top + height + 10;

    if (computedTop + estimatedHeight > window.innerHeight - margin) {
      // Flip above word if overflows bottom
      computedTop = Math.max(margin, top - estimatedHeight - 10);
      placement = 'above';
    }

    setPos({ top: computedTop, left: computedLeft, placement });
  }, [target]);

  // 2. Dragging Logic (moves popup freely across the viewport)
  const onDragStart = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left mouse button only
    if ((e.target as HTMLElement).closest('button')) return; // Ignore button clicks

    dragging.current = true;
    dragOffset.current = {
      x: e.clientX - pos.left,
      y: e.clientY - pos.top,
    };

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const pw = containerRef.current.offsetWidth || 350;
      const ph = containerRef.current.offsetHeight || 280;
      setPos(prev => ({
        ...prev,
        left: Math.max(8, Math.min(ev.clientX - dragOffset.current.x, window.innerWidth - pw - 8)),
        top: Math.max(8, Math.min(ev.clientY - dragOffset.current.y, window.innerHeight - ph - 8)),
      }));
    };

    const onUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [pos.left, pos.top]);

  // 3. Fetch dictionary definition and AI context
  useEffect(() => {
    if (!target || !cleanWord) return;

    let isMounted = true;
    setLoadingDict(true);
    setDictError(null);
    setData(null);
    setBookContext(null);

    // Step A: Base Dictionary Lookup with local cache & robust AI fallback
    lookupWordDefinition(cleanWord, {
      bookTitle: target.bookTitle,
      chapterNum: target.chapterNum,
      chapterTitle: target.chapterTitle,
      chapterPath: target.chapterPath,
      surroundingText: target.surroundingText,
      provider,
      apiKey,
      modelName: selectedModel,
    })
      .then(res => {
        if (!isMounted) return;
        setLoadingDict(false);
        if (res) {
          setData(res);
          if (res.bookContext) {
            setBookContext(res.bookContext);
          }
        } else {
          setDictError('No dictionary definition found for this term.');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadingDict(false);
        setDictError('Unable to load dictionary definition.');
      });

    // Step B: AI Book Contextual Explanation (if not already returned by fallback)
    if (apiKey) {
      setLoadingAi(true);
      invokePython({
        command: 'word_book_context',
        word: cleanWord,
        book_title: target.bookTitle,
        chapter_num: target.chapterNum,
        chapter_title: target.chapterTitle,
        chapter_path: target.chapterPath,
        surrounding_text: target.surroundingText,
        provider,
        api_key: apiKey,
        model_name: selectedModel,
      })
        .then(res => {
          if (!isMounted) return;
          setLoadingAi(false);
          if (res.status === 'success' && res.explanation) {
            setBookContext(res.explanation);
            saveCachedWordDefinition({
              word: cleanWord,
              meanings_json: JSON.stringify(data?.meanings || []),
              phonetic: data?.phonetic,
              audio_url: data?.audioUrl,
              ai_context_json: res.explanation,
            }).catch(() => {});
          }
        })
        .catch(err => {
          if (!isMounted) return;
          setLoadingAi(false);
          console.warn('Word book context fetch failed:', err);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [cleanWord, target?.chapterNum]);

  // 4. Dismissal listeners (Escape & outside click when not dragging)
  useEffect(() => {
    if (!target) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (dragging.current) return;
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [target, onClose]);

  if (!target) return null;

  // Audio pronunciation player with Web Speech API fallback
  const handlePlayAudio = () => {
    if (data?.audioUrl) {
      setIsPlayingAudio(true);
      const audio = new Audio(data.audioUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        setIsPlayingAudio(false);
        speakFallback();
      };
      audio.play().catch(() => {
        setIsPlayingAudio(false);
        speakFallback();
      });
    } else {
      speakFallback();
    }
  };

  const speakFallback = () => {
    if ('speechSynthesis' in window && cleanWord) {
      setIsPlayingAudio(true);
      const utterance = new SpeechSynthesisUtterance(cleanWord);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Copy definition to clipboard
  const handleCopy = () => {
    const textParts = [`**${cleanWord}** ${data?.phonetic || ''}`];
    if (data?.meanings) {
      data.meanings.forEach(m => {
        textParts.push(`*(${m.partOfSpeech})*`);
        m.definitions.forEach((d, i) => {
          textParts.push(`${i + 1}. ${d.definition}`);
          if (d.example) textParts.push(`   "${d.example}"`);
        });
      });
    }
    if (bookContext) {
      textParts.push(`\n**In this book:**\n${bookContext}`);
    }
    navigator.clipboard.writeText(textParts.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Open in Copilot Sidebar for deep discussion
  const handleAskCopilot = () => {
    useChatStore.setState({ isSidebarOpen: true });
    window.dispatchEvent(
      new CustomEvent('append-chat-input', {
        detail: `What is the significance and thematic role of the term "${cleanWord}" in Chapter ${target.chapterNum ?? ''}: ${target.chapterTitle || target.bookTitle || ''}?`,
      })
    );
    onClose();
  };

  return (
    <div
      ref={containerRef}
      className={`bs-word-tooltip bs-word-tooltip--${pos.placement}`}
      style={{
        top: `${pos.top}px`,
        left: `${pos.left}px`,
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Tooltip Draggable Header */}
      <div
        className="wtt-header"
        onMouseDown={onDragStart}
        title="Click and drag to move"
      >
        <div className="wtt-term-row">
          <GripVertical size={13} className="wtt-drag-handle" />
          <span className="wtt-word">{cleanWord}</span>
          {data?.phonetic && <span className="wtt-phonetic">{data.phonetic}</span>}
          <button
            className={`wtt-audio-btn ${isPlayingAudio ? 'is-playing' : ''}`}
            onClick={handlePlayAudio}
            title="Listen to pronunciation"
            aria-label="Play pronunciation"
          >
            <Volume2 size={13} />
          </button>
        </div>
        <button className="wtt-close-btn" onClick={onClose} title="Close (Esc)">
          <X size={13} />
        </button>
      </div>

      {/* Tooltip Body */}
      <div className="wtt-body">
        {loadingDict && (
          <div className="wtt-loading-row">
            <span className="wtt-spinner" />
            <span>Looking up dictionary...</span>
          </div>
        )}

        {dictError && !data && (
          <div className="wtt-empty-text">
            <span>{dictError}</span>
          </div>
        )}

        {/* Dictionary Meanings */}
        {data && data.meanings && data.meanings.length > 0 && (
          <div className="wtt-meanings">
            {data.meanings.slice(0, 2).map((meaning, mIdx) => (
              <div key={mIdx} className="wtt-meaning-group">
                <span className="wtt-pos-pill">{meaning.partOfSpeech}</span>
                <ol className="wtt-definitions-list">
                  {meaning.definitions.slice(0, 2).map((def, dIdx) => (
                    <li key={dIdx} className="wtt-def-item">
                      <span className="wtt-def-text">{def.definition}</span>
                      {def.example && (
                        <span className="wtt-def-example">"{def.example}"</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}

        {/* AI Book-Contextual Nuance */}
        {(loadingAi || bookContext) && (
          <div className="wtt-book-context-card">
            <div className="wtt-context-header">
              <span className="wtt-context-badge">
                <Sparkles size={11} />
                <span>In This Book</span>
              </span>
              {target.chapterNum !== undefined && (
                <span className="wtt-context-chapter">Ch. {target.chapterNum}</span>
              )}
            </div>
            {loadingAi && !bookContext ? (
              <div className="wtt-loading-ai">
                <span className="wtt-pulse-dot" />
                <span>Extracting book context...</span>
              </div>
            ) : (
              <p className="wtt-context-text">{bookContext}</p>
            )}
          </div>
        )}
      </div>

      {/* Tooltip Actions Bar */}
      <div className="wtt-footer">
        <button className="wtt-action-btn" onClick={handleCopy} title="Copy definition">
          {copied ? <Check size={12} color="var(--bs-accent, #009688)" /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>

        <button
          className="wtt-action-btn wtt-action-btn--copilot"
          onClick={handleAskCopilot}
          title="Discuss in Copilot"
        >
          <MessageSquare size={12} />
          <span>Discuss in Copilot</span>
        </button>
      </div>
    </div>
  );
};
