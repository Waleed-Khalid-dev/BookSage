import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { useChatStore, CopilotPersona, ContextMode } from '../../stores/chatStore';
import { useBookStore } from '../../stores/bookStore';
import { useApiKeys } from '../../stores/apiKeysStore';
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
    sendMessage, loadSessions, persona, setPersona, regenerateLastMessage
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
  const [fontSize, setFontSize] = useState<number>(14);
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

  // Sync context mode from session
  useEffect(() => {
    if (session) {
      setContextMode(session.contextMode || 'book');
    }
  }, [session?.id, session?.contextMode]);

  const handleScopeChange = (mode: 'book' | 'chapter') => {
    setContextMode(mode);
    if (session) {
      const updated = { ...session, contextMode: mode, updatedAt: Date.now() };
      useChatStore.setState(state => ({
        sessions: state.sessions.map(s => s.id === session.id ? updated : s)
      }));
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages.length, isLoading]);



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
    await sendMessage(msg, {
      mode: contextMode,
      chapterPath: activeChapter?.path,
      allJsonPaths: chapters.map(c => c.json_path).filter(Boolean) as string[],
      totalChapters: chapters.length
    }, provider, apiKey, model);
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
      mode: contextMode,
      chapterPath: activeChapter?.path,
      allJsonPaths: chapters.map(c => c.json_path).filter(Boolean) as string[],
      totalChapters: chapters.length
    }, provider, apiKey, model);
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
      '',
      '---',
      '',
    ];
    for (const msg of session.messages) {
      lines.push(`**${msg.role === 'user' ? 'You' : 'BookSage'}:** ${msg.content}`, '');
    }
    
    try {
      const filePath = await save({
        filters: [{ name: 'Markdown', extensions: ['md'] }],
        defaultPath: `BookSage-Chat-${Date.now()}.md`
      });
      
      if (filePath) {
        await writeTextFile(filePath, lines.join('\n'));
        alert('Chat exported successfully!');
      }
    } catch (e: any) {
      alert(`Export failed: ${e.message || String(e)}`);
    }
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
            {contextMode === 'chapter' && activeChapter && (
              <span className="acv-chapter-badge" title={activeChapter.title}>› {activeChapter.title}</span>
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
                onClick={() => handleScopeChange('book')}
              >📚 Full Book</button>
              <button
                className={contextMode === 'chapter' ? 'active' : ''}
                onClick={() => handleScopeChange('chapter')}
                disabled={!activeChapter}
                title={activeChapter ? `Current reading chapter: ${activeChapter.title}` : 'No active chapter'}
              >📄 Chapter</button>
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
