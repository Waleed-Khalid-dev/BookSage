import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatStore, CopilotPersona } from '../../stores/chatStore';
import { useBookStore } from '../../stores/bookStore';
import { ModelSelector } from './ModelSelector';
import './CopilotSidebar.css';

const PRESET_PROMPTS = [
  { icon: '📖', label: 'What is this chapter about?', text: 'Give me a comprehensive overview of what this chapter is about.' },
  { icon: '🎯', label: 'Core lesson?', text: 'What is the single most important lesson or insight from this chapter?' },
  { icon: '🧪', label: '3 real-world examples', text: 'Give me 3 concrete, real-world examples that illustrate the key concepts in this chapter.' },
  { icon: '❓', label: 'Questions to ask myself', text: 'What are the most important questions I should ask myself after reading this chapter?' },
  { icon: '🔗', label: 'Connect to previous', text: 'How does this chapter connect to or build upon the previous chapters in this book?' },
];

const PERSONAS: { id: CopilotPersona; icon: string; label: string }[] = [
  { id: 'scholar',  icon: '🎓', label: 'Scholar' },
  { id: 'teacher',  icon: '👨‍🏫', label: 'Teacher' },
  { id: 'coach',    icon: '🔥', label: 'Coach' },
  { id: 'devil',    icon: '🤔', label: 'Devil\'s Advocate' },
];

interface CopilotSidebarProps {
  bookId: string | null;
  bookTitle: string;
  chapterTitle?: string;
  chapterId?: string;
  contextText?: string;     // pre-built context string for current chapter/book
}

export function CopilotSidebar({
  bookId, bookTitle, chapterTitle, chapterId, contextText = '',
}: CopilotSidebarProps) {
  const {
    isSidebarOpen, toggleSidebar,
    sessions, activeSessionId, isLoading,
    activeSession, createSession, setActiveSession, deleteSession,
    sendMessage, loadSessions, persona, setPersona,
    pinInsight,
  } = useChatStore();
  const { apiKey, aiModel, setAiModel } = useBookStore();

  const [input, setInput] = useState('');
  const [model, setModel] = useState(aiModel);
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'claude' | 'ollama'>('gemini');
  const [copied, setCopied] = useState<string | null>(null);
  const [showPersona, setShowPersona] = useState(false);
  const [showSessions, setShowSessions] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load sessions when bookId changes
  useEffect(() => {
    if (bookId) loadSessions(bookId);
  }, [bookId, loadSessions]);

  // Auto-scroll to bottom on new messages
  const session = activeSession();
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages.length, isLoading]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || !apiKey || isLoading) return;

    let sess = activeSession();
    if (!sess && bookId) {
      sess = createSession(bookId, model);
    }
    if (!sess) return;

    setInput('');
    await sendMessage(msg, contextText, provider, apiKey, model);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleModelChange = (modelId: string, prov: any) => {
    setModel(modelId);
    setProvider(prov);
    setAiModel(modelId);
  };

  const handleExport = () => {
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
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `BookSage-Chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
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
    <div className="csb-root">
      {/* ── Header ── */}
      <div className="csb-header">
        <span className="csb-title">✦ Copilot</span>
        <div className="csb-header-actions">
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
      <div className="csb-context-badge">
        <span className="csb-book-name">📚 {bookTitle}</span>
        {chapterTitle && <span className="csb-chapter-name">› {chapterTitle}</span>}
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
      <div className="csb-thread">
        {!session || session.messages.length === 0 ? (
          <div className="csb-empty">
            <span className="csb-empty-icon">✦</span>
            <p>Ask anything about <strong>{bookTitle}</strong></p>
            <p className="csb-empty-sub">Use the presets above or type your own question.</p>
          </div>
        ) : (
          session.messages.map((msg) => (
            <div key={msg.id} className={`csb-msg csb-msg--${msg.role}`}>
              <div className="csb-msg-content">
                {msg.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
              {msg.role === 'assistant' && (
                <>
                  <div className="csb-msg-actions">
                    <button onClick={() => handleCopyMsg(msg.content, msg.id)}>
                      {copied === msg.id ? '✓ Copied' : '📋 Copy'}
                    </button>
                    {chapterId && (
                      <button onClick={() => handlePinMsg(msg.content)}>📌 Pin</button>
                    )}
                  </div>
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
        {!apiKey && (
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
            disabled={!apiKey || isLoading}
          />
          <button
            className="csb-send"
            onClick={() => handleSend()}
            disabled={!input.trim() || !apiKey || isLoading}
            title="Send (Enter)"
          >→</button>
        </div>
        <div className="csb-input-footer">
          <ModelSelector value={model} onChange={handleModelChange} compact activeProviders={new Set([provider])} />
          <button className="csb-clear" onClick={handleNewSession} title="New chat">💬 New</button>
        </div>
      </div>
    </div>
  );
}
