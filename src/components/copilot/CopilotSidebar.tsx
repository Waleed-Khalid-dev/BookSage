import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { useChatStore, CopilotPersona, ContextMode } from '../../stores/chatStore';
import { useBookStore } from '../../stores/bookStore';
import { useUiStore } from '../../stores/uiStore';
import { ModelSelector } from './ModelSelector';
import { useApiKeys } from '../../stores/apiKeysStore';
import './CopilotSidebar.css';

const PRESET_PROMPTS = [
  { icon: '📖', label: 'What is this chapter about?', text: 'Give me a comprehensive overview of what this chapter is about.' },
  { icon: '🎯', label: 'Core lesson?', text: 'What is the single most important lesson or insight from this chapter?' },
  { icon: '🧪', label: '3 real-world examples', text: 'Give me 3 concrete, real-world examples that illustrate the key concepts in this chapter.' },
  { icon: '❓', label: 'Questions to ask myself', text: 'What are the most important questions I should ask myself after reading this chapter?' },
  { icon: '🔗', label: 'Connect to previous', text: 'How does this chapter connect to or build upon the previous chapters in this book?' },
];

const PERSONAS: { id: CopilotPersona; icon: string; label: string; description: string }[] = [
  { id: 'scholar',  icon: '🎓', label: 'Scholar', description: 'Gives you deep, academic, and detailed answers.' },
  { id: 'teacher',  icon: '👨‍🏫', label: 'Teacher', description: 'Breaks down complex concepts so they are easy to understand.' },
  { id: 'coach',    icon: '🔥', label: 'Coach', description: 'Gives you highly actionable, motivating advice on how to apply the book\'s concepts to your life.' },
  { id: 'devil',    icon: '🤔', label: 'Devil\'s Advocate', description: 'Challenges the author\'s ideas, points out flaws, and encourages critical thinking instead of blindly agreeing with the text.' },
];

interface CopilotSidebarProps {
  bookId: string | null;
  bookTitle: string;
  chapterTitle?: string;
  chapterId?: string;
  chapterPath?: string;
  allJsonPaths?: string[];
  totalChapters?: number;
}

const formatTime = (ts?: number) => {
  if (!ts) return '';
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export function CopilotSidebar({
  bookId, bookTitle, chapterTitle, chapterId, chapterPath, allJsonPaths, totalChapters
}: CopilotSidebarProps) {
  const {
    isSidebarOpen, toggleSidebar,
    sessions, activeSessionId, isLoading,
    sendMessage, loadSessions, persona, setPersona,
    pinInsight, regenerateLastMessage,
    activeSession, createSession, setActiveSession, deleteSession
  } = useChatStore();
  const { aiModel, setAiModel } = useBookStore();
  const { copilotSidebarWidth, setCopilotSidebarWidth } = useUiStore();
  const { getKey } = useApiKeys();

  const [input, setInput] = useState('');
  const [model, setModel] = useState(aiModel);
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'claude' | 'ollama' | 'groq' | 'deepseek'>('gemini');
  const [copied, setCopied] = useState<string | null>(null);
  const [showPersona, setShowPersona] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  
  // Track local context mode
  const session = activeSession();
  const [contextMode, setContextMode] = useState<ContextMode>(session?.contextMode ?? 'chapter');

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Resizing logic
  const isResizing = useRef(false);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isResizing.current) return;
      // Sidebar is on the right, so width is (window.innerWidth - e.clientX)
      const newWidth = Math.max(260, Math.min(600, window.innerWidth - e.clientX));
      setCopilotSidebarWidth(newWidth);
    };

    const handlePointerUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [setCopilotSidebarWidth]);

  const startResizing = (e: React.PointerEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  // Handle Add to Chat Context
  useEffect(() => {
    const handleAppend = (e: CustomEvent) => {
      setInput((prev) => {
        const spacer = prev && !prev.endsWith('\n\n') && prev.length > 0 ? '\n\n' : '';
        return prev + spacer + e.detail;
      });
      // Small delay to let the sidebar render if it was just opened
      setTimeout(() => textareaRef.current?.focus(), 100);
    };
    window.addEventListener('append-chat-input', handleAppend as EventListener);
    return () => window.removeEventListener('append-chat-input', handleAppend as EventListener);
  }, []);

  // Load sessions when bookId changes
  useEffect(() => {
    if (bookId) loadSessions(bookId);
  }, [bookId, loadSessions]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages.length, isLoading]);

  // Sync context mode from session
  useEffect(() => {
    if (session) {
      setContextMode(session.contextMode);
    }
  }, [session?.id, session?.contextMode]);

  const handleScopeChange = (mode: 'book' | 'chapter') => {
    setContextMode(mode);
    if (session) {
      // Create a shallow copy and update context mode in the store
      const updated = { ...session, contextMode: mode, updatedAt: Date.now() };
      useChatStore.setState(state => ({
        sessions: state.sessions.map(s => s.id === session.id ? updated : s)
      }));
    }
  };

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    const apiKey = getKey(provider);
    if (!msg || !apiKey || isLoading) {
      if (!apiKey) alert(`Please configure your ${provider} API key in Settings.`);
      return;
    }

    let sess = activeSession();
    if (!sess && bookId) {
      sess = createSession(bookId, model);
    }
    if (!sess) return;
    
    await sendMessage(msg, {
      mode: sess.contextMode,
      chapterPath,
      allJsonPaths,
      totalChapters
    }, provider, apiKey, model);
    setInput('');
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
    
    await regenerateLastMessage({
      mode: sess.contextMode,
      chapterPath,
      allJsonPaths,
      totalChapters
    }, provider, apiKey, model);
  };

  const handleModelChange = (modelId: string, prov: any) => {
    setModel(modelId);
    setProvider(prov);
    setAiModel(modelId);
  };

  const handleExport = async () => {
    if (!session) return;
    const lines: string[] = [
      `# BookSage Copilot — ${bookTitle}`,
      chapterTitle ? `**Chapter:** ${chapterTitle}` : '',
      `**Date:** ${new Date().toLocaleDateString()}`,
      `**Model:** ${model}`,
      '',
      '---',
      '',
    ];
    for (const msg of session.messages) {
      lines.push(`**${msg.role === 'user' ? 'You' : 'Copilot'}:** ${msg.content}`, '');
    }
    const content = lines.join('\n');
    const safeTitle = session.title ? session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'chat';
    
    try {
      const filePath = await save({
        defaultPath: `BookSage-${safeTitle}.md`,
        filters: [{ name: 'Markdown', extensions: ['md'] }]
      });
      if (filePath) {
        await writeTextFile(filePath, content);
      }
    } catch (e) {
      console.error('Failed to export using Tauri', e);
      // Fallback for browser testing
      const blob = new Blob([content], { type: 'text/markdown' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `BookSage-${safeTitle}.md`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  };

  const handleNewSession = () => {
    if (bookId) {
      createSession(bookId, model);
      setShowSessions(false);
    }
  };

  const handleCopyMsg = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const handlePinMsg = async (content: string) => {
    if (chapterId) await pinInsight(chapterId, content);
  };

  const handleFollowUp = (q: string) => {
    setInput(q);
    textareaRef.current?.focus();
  };

  if (!isSidebarOpen) {
    return (
      <button className="csb-toggle-btn" onClick={toggleSidebar} title="Open Copilot (✦)">
        ✦
      </button>
    );
  }

  return (
    <>
      <div 
        className="csb-root"
        style={{ width: `${copilotSidebarWidth}px` }}
      >
        <div className="csb-resizer" onPointerDown={startResizing}></div>
        <div className="csb-header">
        <span className="csb-title">✦ Copilot</span>
        <div className="csb-header-actions">
          {/* Font controls */}
          <button className="csb-icon-btn" title="Decrease font size" onClick={() => setFontSize(f => Math.max(10, f - 1))}>A-</button>
          <button className="csb-icon-btn" title="Increase font size" onClick={() => setFontSize(f => Math.min(24, f + 1))}>A+</button>
          
          {/* Persona picker */}
          <div className="csb-persona-wrap">
            <button
              className="csb-icon-btn"
              title="Switch persona"
              onClick={() => setShowPersona(v => !v)}
            >
              {PERSONAS.find(p => p.id === persona)?.icon ?? '🎓'}
            </button>
            {showPersona && (
              <div className="csb-persona-menu">
                {PERSONAS.map(p => (
                  <button
                    key={p.id}
                    className={`csb-persona-opt ${persona === p.id ? 'csb-persona-opt--active' : ''}`}
                    onClick={() => { setPersona(p.id); setShowPersona(false); }}
                    title={p.description}
                  >
                    {p.icon} {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sessions list */}
          <div className="csb-sessions-wrap">
            <button className="csb-icon-btn" title="Chat history" onClick={() => setShowSessions(v => !v)}>
              🗂
            </button>
            {showSessions && (
              <div className="csb-sessions-menu">
                <button className="csb-sessions-new" onClick={handleNewSession}>+ New Chat</button>
                {sessions.map(s => (
                  <div
                    key={s.id}
                    className={`csb-session-row ${s.id === activeSessionId ? 'csb-session-row--active' : ''}`}
                  >
                    <button
                      className="csb-session-title"
                      onClick={() => { setActiveSession(s.id); setShowSessions(false); }}
                    >
                      {s.title.length > 28 ? s.title.slice(0, 28) + '…' : s.title}
                    </button>
                    <button
                      className="csb-session-del"
                      onClick={() => deleteSession(s.id)}
                      title="Delete"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="csb-icon-btn" title="Export chat" onClick={handleExport}>⬇️</button>
          <button className="csb-icon-btn csb-close" title="Close sidebar" onClick={toggleSidebar}>✕</button>
        </div>
      </div>

      {/* ── Context badge ── */}
      <div className="csb-context-badge" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div>
          <span className="csb-book-name">📚 {bookTitle}</span>
          {chapterTitle && <span className="csb-chapter-name">› {chapterTitle}</span>}
        </div>
        
        {/* Context Scope Picker */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            onClick={() => handleScopeChange('book')}
            style={{
              flex: 1, padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer',
              background: contextMode === 'book' ? 'var(--bs-accent)' : 'var(--bs-surface-hover)',
              color: contextMode === 'book' ? 'white' : 'var(--bs-text)',
              border: 'none', transition: 'all 0.2s'
            }}
          >
            📚 Entire Book
          </button>
          <button
            onClick={() => handleScopeChange('chapter')}
            disabled={!chapterId}
            title={!chapterId ? "No chapter available" : "Focus on this chapter"}
            style={{
              flex: 1, padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', cursor: chapterId ? 'pointer' : 'not-allowed',
              background: contextMode === 'chapter' ? 'var(--bs-accent)' : 'var(--bs-surface-hover)',
              color: contextMode === 'chapter' ? 'white' : 'var(--bs-text)',
              border: 'none', transition: 'all 0.2s', opacity: chapterId ? 1 : 0.5
            }}
          >
            📄 Chapter
          </button>
        </div>
      </div>

      {/* ── Preset prompts ── */}
      <div className="csb-presets">
        {PRESET_PROMPTS.map(p => (
          <button key={p.text} className="csb-preset" onClick={() => handleSend(p.text)} title={p.text}>
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      {/* ── Chat thread ── */}
      <div className="csb-thread" style={{ fontSize: `${fontSize}px` }}>
        {!session || session.messages.length === 0 ? (
          <div className="csb-empty">
            <span className="csb-empty-icon">✦</span>
            <p>Ask anything about <strong>{bookTitle}</strong></p>
            <p className="csb-empty-sub">Use the presets above or type your own question.</p>
          </div>
        ) : (
          session.messages.map((msg, index) => (
            <div key={msg.id} className={`csb-msg csb-msg--${msg.role}`}>
              <div className="csb-msg-content">
                {msg.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                ) : (
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.content}</p>
                )}
              </div>
              <div className="csb-msg-meta">
                {msg.ts && <span className="csb-msg-time">{formatTime(msg.ts)}</span>}
                {msg.role === 'assistant' && (
                  <div className="csb-msg-actions">
                    <button onClick={() => handleCopyMsg(msg.content, msg.id)}>
                      {copied === msg.id ? '✓ Copied' : '📋 Copy'}
                    </button>
                    {chapterId && (
                      <button onClick={() => handlePinMsg(msg.content)}>📌 Pin</button>
                    )}
                  </div>
                )}
              </div>
              {msg.role === 'assistant' && (
                <>
                  {/* Regenerate Button if it's the last message */}
                  {index === (session?.messages.length ?? 0) - 1 && (
                    <div style={{ marginTop: '4px' }}>
                      <button className="csb-follow-up-pill" onClick={handleRegenerate} style={{ background: 'var(--bs-surface-hover)' }}>
                        🔄 Regenerate
                      </button>
                    </div>
                  )}
                  {msg.followUps && msg.followUps.length > 0 && (
                    <div className="csb-follow-ups">
                      {msg.followUps.map((q, i) => (
                        <button key={i} className="csb-follow-up-pill" onClick={() => handleFollowUp(q)}>
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="csb-msg csb-msg--assistant csb-msg--loading">
            <div className="csb-typing-dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      <div className="csb-input-area">
        {!getKey(provider) && (
          <div className="csb-no-key">⚠️ Add an API key in Settings to chat</div>
        )}
        <div className="csb-input-row">
          <textarea
            ref={textareaRef}
            className="csb-input"
            placeholder="Ask about this book…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={!getKey(provider) || isLoading}
          />
          <div className="csb-input-actions">
            <button
              className="csb-send"
              onClick={() => handleSend()}
              disabled={!input.trim() || !getKey(provider) || isLoading}
              title="Send (Enter)"
            >→</button>
          </div>
        </div>
        <div className="csb-input-footer">
          <ModelSelector value={model} onChange={handleModelChange} compact activeProviders={new Set([provider])} />
          <button className="csb-clear" onClick={handleNewSession} title="New chat">💬 New</button>
        </div>
      </div>
    </div>
    </>
  );
}
