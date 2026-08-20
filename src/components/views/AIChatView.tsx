import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { useChatStore, CopilotPersona, ContextMode } from '../../stores/chatStore';
import { useBookStore, Chapter } from '../../stores/bookStore';
import { useUiStore } from '../../stores/uiStore';
import { useApiKeys } from '../../stores/apiKeysStore';
import { ModelSelector } from '../copilot/ModelSelector';
import { CitationChip, extractCitations } from '../shared/CitationChip';
import './AIChatView.css';

const PRESET_PROMPTS = [
  { icon: '📖', label: 'Book overview',           text: 'Give me a comprehensive overview of this entire book — key themes, central argument, and takeaways.' },
  { icon: '🎯', label: 'Core lessons',            text: 'What are the 5 most important lessons or insights from this book?' },
  { icon: '⚡', label: 'Actionable steps',        text: 'What are the concrete, actionable steps I should take after reading this book?' },
  { icon: '❓', label: 'Deep questions',          text: 'What are the most thought-provoking questions this book raises that I should reflect on?' },
  { icon: '🔗', label: 'Real-world examples',     text: 'Give me 3 real-world examples or case studies that illustrate the main concepts.' },
  { icon: '⚔️', label: 'Counter-arguments',      text: 'What are the strongest counter-arguments or criticisms of the ideas presented in this book?' },
  { icon: '🧪', label: 'Implementation plan',     text: 'Help me create a concrete 30-day implementation plan based on the book\'s main lessons.' },
  { icon: '📝', label: 'Study quiz',              text: 'Generate 10 multiple-choice quiz questions to test my understanding of this book.' },
];

const PERSONAS: { id: CopilotPersona; icon: string; label: string; desc: string }[] = [
  { 
    id: 'scholar',  
    icon: '🎓', 
    label: 'Scholar',          
    desc: 'Deep academic analysis — Gives you deep, academic, and detailed answers.' 
  },
  { 
    id: 'teacher',  
    icon: '👨‍🏫', 
    label: 'Teacher',         
    desc: 'Simple explanations — Breaks down complex concepts so they are easy to understand.' 
  },
  { 
    id: 'coach',    
    icon: '🔥', 
    label: 'Coach',            
    desc: 'Action-oriented — Gives you highly actionable, motivating advice on how to apply the book\'s concepts to your life.' 
  },
  { 
    id: 'devil',    
    icon: '🤔', 
    label: 'Devil\'s Advocate', 
    desc: 'Challenges assumptions — Challenges the author\'s ideas, points out flaws, and encourages critical thinking instead of blindly agreeing with the text.' 
  },
];

const formatTime = (ts?: number) => {
  if (!ts) return '';
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export function AIChatView() {
  const {
    sessions, activeSessionId, isLoading,
    activeSession, createSession, setActiveSession, deleteSession,
    sendMessage, loadSessions, persona, setPersona, regenerateLastMessage,
    setSessionCustomScope
  } = useChatStore();
  const { bookId, currentBookTitle, aiModel, setAiModel, chapters, lastPage } = useBookStore();
  const { getKey } = useApiKeys();

  // Determine current active chapter based on lastPage in reader
  const activeChapter = [...chapters].reverse().find(c => {
    if (!c.pp) return false;
    const [start, end] = c.pp.split('-').map(Number);
    return lastPage >= start && lastPage <= end;
  }) || chapters[0];

  const [input, setInput] = useState('');
  const [model, setModel] = useState(aiModel);
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'claude' | 'ollama' | 'groq' | 'deepseek'>('gemini');
  const [copied, setCopied] = useState<string | null>(null);
  const [contextMode, setContextMode] = useState<ContextMode>('book');
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [includeRawText, setIncludeRawText] = useState<boolean>(false);
  const [showCustomPicker, setShowCustomPicker] = useState<boolean>(false);
  const [chapterSearch, setChapterSearch] = useState<string>('');
  const [fontSize, setFontSize] = useState<number>(14);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowCustomPicker(false);
      }
    };
    if (showCustomPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomPicker]);

  // Load sessions when view opens
  useEffect(() => {
    if (bookId) loadSessions(bookId);
  }, [bookId, loadSessions]);

  const session = activeSession();

  // Sync context mode and custom chapters from session
  useEffect(() => {
    if (session) {
      setContextMode(session.contextMode || 'book');
      setSelectedChapterIds(session.customChapterIds || []);
      setIncludeRawText(session.includeRawText ?? false);
    }
  }, [session?.id, session?.contextMode, session?.customChapterIds, session?.includeRawText]);

  const handleScopeChange = (mode: ContextMode) => {
    setContextMode(mode);
    if (session) {
      const updated = { ...session, contextMode: mode, updatedAt: Date.now() };
      useChatStore.setState(state => ({
        sessions: state.sessions.map(s => s.id === session.id ? updated : s)
      }));
    }
  };

  const getChapKey = (c: Chapter) => c.id || String(c.num);

  const handleToggleChapter = (chapId: string) => {
    const nextIds = selectedChapterIds.includes(chapId)
      ? selectedChapterIds.filter(id => id !== chapId)
      : [...selectedChapterIds, chapId];
    setSelectedChapterIds(nextIds);
    if (session) {
      setSessionCustomScope(session.id, nextIds, includeRawText);
    }
  };

  const handleSelectAllChapters = () => {
    const allIds = chapters.map(getChapKey);
    setSelectedChapterIds(allIds);
    if (session) {
      setSessionCustomScope(session.id, allIds, includeRawText);
    }
  };

  const handleClearAllChapters = () => {
    setSelectedChapterIds([]);
    if (session) {
      setSessionCustomScope(session.id, [], includeRawText);
    }
  };

  const handleToggleIncludeRawText = (val: boolean) => {
    setIncludeRawText(val);
    if (session) {
      setSessionCustomScope(session.id, selectedChapterIds, val);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages.length, isLoading]);

  const getContextPayload = () => {
    const isCustom = contextMode === 'custom';
    const activeCustomChapters = isCustom
      ? chapters.filter(c => selectedChapterIds.includes(getChapKey(c)))
      : [];

    return {
      mode: contextMode,
      chapterPath: contextMode === 'chapter' ? activeChapter?.path : undefined,
      allJsonPaths: isCustom
        ? (activeCustomChapters.map(c => c.json_path).filter(Boolean) as string[])
        : (chapters.map(c => c.json_path).filter(Boolean) as string[]),
      rawTextPaths: isCustom && includeRawText
        ? (activeCustomChapters.map(c => c.path).filter(Boolean) as string[])
        : undefined,
      includeRawText: isCustom ? includeRawText : false,
      totalChapters: isCustom ? activeCustomChapters.length : chapters.length,
    };
  };

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    const apiKey = getKey(provider);
    if (!msg || !apiKey || isLoading) {
      if (!apiKey) alert(`Please configure your ${provider} API key in Settings.`);
      return;
    }

    let sess = session;
    if (!sess && bookId) {
      sess = createSession(bookId, model);
    }
    if (!sess) return;

    setInput('');
    await sendMessage(msg, getContextPayload(), provider, apiKey, model);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRegenerate = async () => {
    const apiKey = getKey(provider);
    if (!apiKey) return;
    
    let sess = activeSession();
    if (!sess) return;
    
    await regenerateLastMessage(getContextPayload(), provider, apiKey, model);
  };

  const handleModelChange = (modelId: string, prov: any) => {
    setModel(modelId);
    setProvider(prov);
    setAiModel(modelId);
  };

  const handleExport = async () => {
    if (!session) return;
    const lines = [
      `# BookSage Copilot — ${currentBookTitle}`,
      `**Date:** ${new Date().toLocaleDateString()}`,
      `**Context:** ${contextMode === 'custom' ? `Custom Selection (${selectedChapterIds.length} chapters)` : contextMode === 'chapter' ? `Chapter: ${activeChapter?.title}` : 'Full Book'}`,
      `**Model:** ${session.modelName}`,
      '',
      '---',
      '',
      ...session.messages.map(m =>
        `### ${m.role === 'user' ? '👤 User' : '✦ Copilot'}\n\n${m.content}\n`
      ),
    ];
    const content = lines.join('\n');
    try {
      const path = await save({
        defaultPath: `${currentBookTitle || 'Chat'}-Copilot.md`,
        filters: [{ name: 'Markdown', extensions: ['md'] }],
      });
      if (path) {
        await writeTextFile(path, content);
      }
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const handleNewSession = () => {
    if (!bookId) return;
    createSession(bookId, model);
  };

  const filteredChapters = chapters.filter(c => {
    if (!chapterSearch.trim()) return true;
    const q = chapterSearch.toLowerCase();
    return c.title.toLowerCase().includes(q) || String(c.num).includes(q);
  });

  return (
    <div className="acv-root">
      {/* ── Left: Session history ── */}
      <aside className="acv-sidebar">
        <div className="acv-sidebar-header">
          <span className="acv-sidebar-title">Chat History</span>
          <button className="acv-new-btn" onClick={handleNewSession} title="New chat">+ New</button>
        </div>

        <div className="acv-session-list">
          {sessions.length === 0 && (
            <div className="acv-session-empty">No sessions yet</div>
          )}
          {sessions.map(s => (
            <div
              key={s.id}
              className={`acv-session-item ${s.id === activeSessionId ? 'acv-session-item--active' : ''}`}
            >
              <button className="acv-session-title" onClick={() => setActiveSession(s.id)}>
                <span className="acv-session-icon">💬</span>
                <span>{s.title.length > 22 ? s.title.slice(0, 22) + '…' : s.title}</span>
              </button>
              <button className="acv-session-del" onClick={() => deleteSession(s.id)} title="Delete">✕</button>
            </div>
          ))}
        </div>

        {/* Persona selector */}
        <div className="acv-persona-section">
          <div className="acv-persona-label">AI Persona</div>
          <div className="acv-persona-grid">
            {PERSONAS.map(p => (
              <button
                key={p.id}
                className={`acv-persona-btn ${persona === p.id ? 'acv-persona-btn--active' : ''}`}
                onClick={() => setPersona(p.id)}
                title={p.desc}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Center: Chat ── */}
      <main className="acv-main">
        {/* Top bar */}
        <div className="acv-main-header">
          <div className="acv-book-badge">
            <span className="acv-book-icon">📚</span>
            <span className="acv-book-name">{currentBookTitle || 'No book loaded'}</span>
            {contextMode === 'chapter' && activeChapter && (
              <span className="acv-chapter-badge" title={activeChapter.title}>› {activeChapter.title}</span>
            )}
            {contextMode === 'custom' && (
              <span className="acv-chapter-badge" title={`${selectedChapterIds.length} chapters selected`}>
                › Custom ({selectedChapterIds.length} {selectedChapterIds.length === 1 ? 'chapter' : 'chapters'})
              </span>
            )}
          </div>
          <div className="acv-header-actions">
            {/* Font controls */}
            <div className="acv-font-controls">
              <button className="acv-font-btn" title="Decrease font size" onClick={() => setFontSize(f => Math.max(11, f - 1))}>A-</button>
              <button className="acv-font-btn" title="Increase font size" onClick={() => setFontSize(f => Math.min(24, f + 1))}>A+</button>
            </div>

            <div className="acv-context-toggle">
              <button
                className={contextMode === 'book' ? 'active' : ''}
                onClick={() => {
                  handleScopeChange('book');
                  setShowCustomPicker(false);
                }}
              >📚 Full Book</button>
              <button
                className={contextMode === 'chapter' ? 'active' : ''}
                onClick={() => {
                  handleScopeChange('chapter');
                  setShowCustomPicker(false);
                }}
                disabled={!activeChapter}
                title={activeChapter ? `Current reading chapter: ${activeChapter.title}` : 'No active chapter'}
              >📄 Chapter</button>

              <div className="acv-custom-toggle-wrap" ref={popoverRef}>
                <button
                  className={`acv-custom-toggle-btn ${contextMode === 'custom' ? 'active' : ''}`}
                  onClick={() => {
                    handleScopeChange('custom');
                    setShowCustomPicker(prev => !prev);
                  }}
                  title="Select specific chapters for AI context"
                >
                  📑 Custom {selectedChapterIds.length > 0 ? `(${selectedChapterIds.length})` : ''} ▾
                </button>

                {showCustomPicker && (
                  <div className="acv-custom-popover">
                    <div className="acv-popover-header">
                      <div className="acv-popover-title-row">
                        <span className="acv-popover-title">Select Custom Chapters</span>
                        <span className="acv-popover-count">{selectedChapterIds.length} of {chapters.length}</span>
                      </div>
                      <div className="acv-popover-actions-row">
                        <button className="acv-popover-link-btn" onClick={handleSelectAllChapters}>Select All</button>
                        <span className="acv-popover-sep">·</span>
                        <button className="acv-popover-link-btn" onClick={handleClearAllChapters}>Clear All</button>
                      </div>
                    </div>

                    <div className="acv-popover-search">
                      <input
                        type="text"
                        placeholder="Search chapters..."
                        value={chapterSearch}
                        onChange={e => setChapterSearch(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <div className="acv-popover-list">
                      {filteredChapters.length === 0 ? (
                        <div className="acv-popover-empty">No matching chapters</div>
                      ) : (
                        filteredChapters.map(chap => {
                          const chapKey = getChapKey(chap);
                          const isChecked = selectedChapterIds.includes(chapKey);
                          const isExtracted = chap.status === 'done' && Boolean(chap.json_path);
                          return (
                            <label key={chapKey} className={`acv-popover-item ${isChecked ? 'selected' : ''}`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleChapter(chapKey)}
                              />
                              <div className="acv-popover-item-info">
                                <div className="acv-popover-item-title">
                                  <span className="acv-chap-num">Ch {chap.num}:</span> {chap.title}
                                </div>
                                <div className="acv-popover-item-sub">
                                  {chap.pp && <span>pp. {chap.pp}</span>}
                                  <span className={`acv-chap-status ${isExtracted ? 'done' : 'raw'}`}>
                                    {isExtracted ? '✅ Summary & Lessons' : '📄 Raw text'}
                                  </span>
                                </div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>

                    <div className="acv-popover-footer">
                      <label className="acv-raw-text-toggle" title="Also inject full word-for-word chapter text">
                        <input
                          type="checkbox"
                          checked={includeRawText}
                          onChange={e => handleToggleIncludeRawText(e.target.checked)}
                        />
                        <span>Include Full Raw Text (.txt)</span>
                      </label>

                      {includeRawText && selectedChapterIds.length >= 3 && (
                        <div className="acv-context-warning">
                          ⚠️ <strong>Context Warning:</strong> Including full raw text for {selectedChapterIds.length} chapters may exceed model context window or slow down response.
                        </div>
                      )}

                      <button
                        className="acv-popover-done-btn"
                        onClick={() => setShowCustomPicker(false)}
                      >
                        Apply Context ({selectedChapterIds.length} Selected)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button className="acv-export-btn" onClick={handleExport} title="Export chat to Markdown">⬇ Export</button>
          </div>
        </div>

        {/* Thread */}
        <div className="acv-thread" style={{ fontSize: `${fontSize}px` }}>
          {!session || session.messages.length === 0 ? (
            <div className="acv-welcome">
              <div className="acv-welcome-icon">✦</div>
              <h2 className="acv-welcome-title">BookSage Copilot</h2>
              <p className="acv-welcome-sub">
                Your AI reading companion for <strong>{currentBookTitle || 'your book'}</strong>
              </p>

              <div className="acv-presets-grid">
                {PRESET_PROMPTS.map(p => (
                  <button
                    key={p.text}
                    className="acv-preset-card"
                    onClick={() => handleSend(p.text)}
                    disabled={!getKey(provider)}
                  >
                    <span className="acv-preset-icon">{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            session.messages.map((msg, index) => (
              <div key={msg.id} className={`acv-msg acv-msg--${msg.role}`}>
                <div className="acv-msg-avatar">
                  {msg.role === 'user' ? '👤' : '✦'}
                </div>
                <div className="acv-msg-body">
                  <div className="acv-msg-content">
                    {msg.role === 'assistant'
                      ? (
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ href, children, ...props }) => {
                              if (href?.startsWith('cite:')) {
                                const chNum = parseInt(href.replace('cite:', ''), 10);
                                return <CitationChip chapterNum={chNum} label={String(children)} />;
                              }
                              return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      )
                      : <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.content}</p>
                    }
                  </div>
                  <div className="acv-msg-meta">
                    {msg.ts && <span className="acv-msg-time">{formatTime(msg.ts)}</span>}
                    {msg.role === 'assistant' && (
                      <div className="acv-msg-actions">
                        {extractCitations(msg.content).map(chNum => (
                          <button 
                            key={chNum}
                            className="bs-jump-source-btn"
                            onClick={() => {
                              const chap = chapters.find(c => c.num === chNum);
                              if (chap?.pp) {
                                const p = parseInt(chap.pp.split('-')[0].trim(), 10);
                                if (!isNaN(p)) {
                                  useBookStore.getState().setLastPage(p);
                                  window.dispatchEvent(new CustomEvent('booksage-jump-page', { detail: { pageNum: p } }));
                                }
                              }
                              useUiStore.getState().setActiveView('reader');
                            }}
                            title={`Jump directly to Chapter ${chNum} in Reader`}
                          >
                            📖 Ch. {chNum}
                          </button>
                        ))}
                        <button onClick={() => handleCopy(msg.content, msg.id)}>
                          {copied === msg.id ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>
                    )}
                  </div>
                  {msg.role === 'assistant' && (
                    <>
                      {/* Regenerate Button if it's the last message */}
                      {index === (session?.messages.length ?? 0) - 1 && (
                        <div style={{ marginTop: '8px' }}>
                          <button className="acv-follow-pill" onClick={handleRegenerate}>
                            🔄 Regenerate
                          </button>
                        </div>
                      )}
                      {msg.followUps && msg.followUps.length > 0 && (
                        <div className="acv-follow-ups">
                          {msg.followUps.map((q, i) => (
                            <button key={i} className="acv-follow-pill" onClick={() => { setInput(q); textareaRef.current?.focus(); }}>
                              {q}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="acv-msg acv-msg--assistant">
              <div className="acv-msg-avatar">✦</div>
              <div className="acv-msg-body">
                <div className="acv-msg-content acv-msg-content--loading">
                  <div className="acv-dots"><span /><span /><span /></div>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="acv-input-area">
          {!getKey(provider) && (
            <div className="acv-no-key">⚠️ Please add an API key in Settings to use BookSage Copilot</div>
          )}
          <div className="acv-input-row">
            <textarea
              ref={textareaRef}
              className="acv-input"
              placeholder="Ask anything about your book…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              disabled={!getKey(provider) || isLoading}
            />
            <div className="acv-input-actions">
              <button
                className="acv-send"
                onClick={() => handleSend()}
                disabled={!input.trim() || !getKey(provider) || isLoading}
                title="Send (Enter)"
              >→</button>
            </div>
          </div>
          <div className="acv-input-footer">
            <ModelSelector value={model} onChange={handleModelChange} activeProviders={new Set([provider])} />
            <span className="acv-hint">Enter ↵ to send · Shift+Enter for newline</span>
          </div>
        </div>
      </main>
    </div>
  );
}
