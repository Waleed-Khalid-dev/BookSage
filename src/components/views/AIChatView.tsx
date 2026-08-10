import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatStore, CopilotPersona } from '../../stores/chatStore';
import { useBookStore } from '../../stores/bookStore';
import { ModelSelector } from '../copilot/ModelSelector';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
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
  { id: 'scholar',  icon: '🎓', label: 'Scholar',          desc: 'Deep academic analysis' },
  { id: 'teacher',  icon: '👨‍🏫', label: 'Teacher',         desc: 'Simple explanations' },
  { id: 'coach',    icon: '🔥', label: 'Coach',            desc: 'Action-oriented' },
  { id: 'devil',    icon: '🤔', label: 'Devil\'s Advocate', desc: 'Challenges assumptions' },
];

export function AIChatView() {
  const {
    sessions, activeSessionId, isLoading,
    activeSession, createSession, setActiveSession, deleteSession,
    sendMessage, loadSessions, persona, setPersona,
  } = useChatStore();
  const { bookId, currentBookTitle, apiKey, aiModel, setAiModel, chapters } = useBookStore();

  const [input, setInput] = useState('');
  const [model, setModel] = useState(aiModel);
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'claude' | 'ollama'>('gemini');
  const [copied, setCopied] = useState<string | null>(null);
  const [contextMode, setContextMode] = useState<'book' | 'chapter'>('book');
  const { isSupported, isListening, transcript, toggleListening, resetTranscript } = useSpeechRecognition();

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInput((prev) => {
        const spacer = prev && !prev.endsWith(' ') ? ' ' : '';
        return prev + spacer + transcript;
      });
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // Load sessions when view opens
  useEffect(() => {
    if (bookId) loadSessions(bookId);
  }, [bookId, loadSessions]);

  const session = activeSession();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages.length, isLoading]);

  const buildContextText = () => {
    const doneChaps = chapters.filter(c => c.status === 'done');
    const chapterList = doneChaps.map(c => `Chapter ${c.num}: ${c.title} (pp. ${c.pp})`).join('\n');
    return `Book: "${currentBookTitle}"\n\nChapters:\n${chapterList}`;
  };

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || !apiKey || isLoading) return;

    let sess = session;
    if (!sess && bookId) {
      sess = createSession(bookId, model);
    }
    if (!sess) return;

    setInput('');
    await sendMessage(msg, buildContextText(), provider, apiKey, model);
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
    const lines = [
      `# BookSage Copilot — ${currentBookTitle}`,
      `**Date:** ${new Date().toLocaleDateString()}`,
      '',
      '---',
      '',
    ];
    for (const msg of session.messages) {
      lines.push(`**${msg.role === 'user' ? 'You' : 'BookSage'}:** ${msg.content}`, '');
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `BookSage-Chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const handleNewSession = () => {
    if (bookId) createSession(bookId, model);
  };

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
          </div>
          <div className="acv-header-actions">
            <div className="acv-context-toggle">
              <button
                className={contextMode === 'book' ? 'active' : ''}
                onClick={() => setContextMode('book')}
              >📚 Full Book</button>
              <button
                className={contextMode === 'chapter' ? 'active' : ''}
                onClick={() => setContextMode('chapter')}
              >📄 Chapter</button>
            </div>
            <button className="acv-export-btn" onClick={handleExport} title="Export chat to Markdown">⬇ Export</button>
          </div>
        </div>

        {/* Thread */}
        <div className="acv-thread">
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
                    disabled={!apiKey}
                  >
                    <span className="acv-preset-icon">{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            session.messages.map(msg => (
              <div key={msg.id} className={`acv-msg acv-msg--${msg.role}`}>
                <div className="acv-msg-avatar">
                  {msg.role === 'user' ? '👤' : '✦'}
                </div>
                <div className="acv-msg-body">
                  <div className="acv-msg-content">
                    {msg.role === 'assistant'
                      ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      : <p>{msg.content}</p>
                    }
                  </div>
                  {msg.role === 'assistant' && (
                    <>
                      <div className="acv-msg-actions">
                        <button onClick={() => handleCopy(msg.content, msg.id)}>
                          {copied === msg.id ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>
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
          {!apiKey && (
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
              disabled={!apiKey || isLoading}
            />
            <div className="acv-input-actions">
              {isSupported && (
                <button
                  className={`acv-mic-btn ${isListening ? 'listening' : ''}`}
                  onClick={toggleListening}
                  title={isListening ? "Stop listening" : "Voice input (Alt+M)"}
                >
                  🎤
                </button>
              )}
              <button
                className="acv-send"
                onClick={() => handleSend()}
                disabled={!input.trim() || !apiKey || isLoading}
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
