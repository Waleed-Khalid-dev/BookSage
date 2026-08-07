import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { invokePython } from '../../services/pythonService';
import { useBookStore } from '../../stores/bookStore';
import { useUiStore } from '../../stores/uiStore';
import {
  getChapterUserData, saveChapterUserData, getStudiedCountForBook
} from '../../services/dbService';
import { ChevronRight, ChevronDown, BookOpen, Lightbulb, Quote, ListChecks,
         GraduationCap, Tag, FileText, Copy, Maximize2, Zap } from 'lucide-react';
import './NotesViewer.css';

interface ChapterJson {
  chapter_title: string;
  chapter_number: number;
  summary: string;
  teachings: { technique: string; explanation: string }[];
  core_lesson: string;
  implementation_steps: string[];
  supporting_quotes: string[];
  obsidian_tags: string[];
  difficulty_to_implement: 'Easy' | 'Medium' | 'Hard';
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className="notes-toast">{message}</div>;
}

function CopyButton({ text, onToast }: { text: string; onToast: (msg: string) => void }) {
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => onToast('Copied! ✓'));
  };
  return (
    <button className="notes-copy-btn" onClick={handleCopy} title="Copy">
      <Copy size={14} />
    </button>
  );
}

function DiffBadge({ value, size = 'sm' }: { value: string; size?: 'sm' | 'md' }) {
  const cls = value?.toLowerCase() === 'easy' ? 'easy' : value?.toLowerCase() === 'hard' ? 'hard' : 'medium';
  const emoji = cls === 'easy' ? '🟢' : cls === 'hard' ? '🔴' : '🟡';
  const className = size === 'md' ? `notes-difficulty-badge ${cls}` : `notes-diff-badge ${cls}`;
  return <span className={className}>{emoji} {value}</span>;
}

function SkeletonLoader() {
  return (
    <div className="notes-skeleton" style={{ padding: '2rem' }}>
      {[80, 60, 100, 45, 90, 70].map((w, i) => (
        <div key={i} className="notes-skeleton-block" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

export function NotesViewer() {
  const { chapters, bookId, currentBookTitle } = useBookStore();
  const { setActiveView } = useUiStore();

  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [chapterJson, setChapterJson] = useState<ChapterJson | null>(null);
  const [loadingJson, setLoadingJson] = useState(false);
  const [jsonError, setJsonError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [fontSize, setFontSize] = useState(15);
  const [lineHeight, setLineHeight] = useState(1.75);
  const [summaryMode, setSummaryMode] = useState<'full' | 'brief'>('full');
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [teachingsOpen, setTeachingsOpen] = useState(true);
  const [openTeaching, setOpenTeaching] = useState<number | null>(null);
  const [stepsOpen, setStepsOpen] = useState(true);
  const [quotesOpen, setQuotesOpen] = useState(true);
  const [steps, setSteps] = useState<boolean[]>([]);
  const [userNotes, setUserNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [reflectionsOpen, setReflectionsOpen] = useState(true);
  const [studied, setStudied] = useState(false);
  const [studiedCount, setStudiedCount] = useState({ studied: 0, total: 0 });
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'normal' | 'insights' | 'flashcard'>('normal');
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [toast, setToast] = useState('');
  const [chapterDiffs, setChapterDiffs] = useState<Record<number, string>>({});
  const [chapterInsights, setChapterInsights] = useState<Record<number, string>>({});
  const [selectionPill, setSelectionPill] = useState<{ x: number; y: number } | null>(null);

  const notesRef = useRef(userNotes);
  notesRef.current = userNotes;

  const doneChapters = chapters.filter(c => c.status === 'done');
  const activeChapter = doneChapters[activeChapterIdx];

  // Load chapter JSON
  useEffect(() => {
    if (!activeChapter?.json_path) {
      setChapterJson(null);
      return;
    }
    setLoadingJson(true);
    setJsonError('');
    setChapterJson(null);

    invokePython({ command: 'read_file', path: activeChapter.json_path })
      .then(res => {
        if (res.status === 'error') throw new Error(res.message);
        const text = res.content;
        try {
          let parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length > 0) parsed = parsed[0];
          setChapterJson(parsed as ChapterJson);
          const stepsLen = parsed.implementation_steps?.length ?? 0;
          if (activeChapter.id) {
            getChapterUserData(activeChapter.id).then(ud => {
              setUserNotes(ud.user_notes);
              setStudied(ud.studied);
              const prog = ud.steps_progress?.length === stepsLen
                ? ud.steps_progress
                : Array(stepsLen).fill(false);
              setSteps(prog);
            });
          }
        } catch {
          setJsonError('Failed to parse chapter data.');
        }
        setLoadingJson(false);
      })
      .catch(() => {
        setJsonError('Could not read chapter file.');
        setLoadingJson(false);
      });

    setOpenTeaching(null);
    setFlashcardIdx(0);
    setFlashcardFlipped(false);
    setIsEditingNotes(false);
  }, [activeChapterIdx, activeChapter?.json_path]);

  // Refresh studied count
  const refreshStudied = useCallback(async () => {
    if (!bookId) return;
    const count = await getStudiedCountForBook(bookId);
    setStudiedCount(count);
  }, [bookId]);

  useEffect(() => { refreshStudied(); }, [refreshStudied, studied]);

  // Load difficulty + core_lesson from each chapter for sidebar heatmap & key insights
  useEffect(() => {
    doneChapters.forEach((ch, i) => {
      if (!ch.json_path || chapterDiffs[i] !== undefined) return;
      invokePython({ command: 'read_file', path: ch.json_path }).then(res => {
        if (res.status === 'error') throw new Error(res.message);
        const text = res.content;
        try {
          let p = JSON.parse(text);
          if (Array.isArray(p) && p.length > 0) p = p[0];
          setChapterDiffs(prev => ({ ...prev, [i]: p.difficulty_to_implement ?? '' }));
          setChapterInsights(prev => ({ ...prev, [i]: p.core_lesson ?? '' }));
        } catch { /* noop */ }
      }).catch(() => { /* noop */ });
    });
  }, [doneChapters.length]);

  // Save user notes on blur
  const handleNotesSave = useCallback(async () => {
    if (!activeChapter?.id) return;
    setIsEditingNotes(false);
    await saveChapterUserData(activeChapter.id, { user_notes: notesRef.current });
  }, [activeChapter?.id]);

  // Toggle step
  const toggleStep = async (idx: number) => {
    const newSteps = [...steps];
    newSteps[idx] = !newSteps[idx];
    setSteps(newSteps);
    if (activeChapter?.id) {
      await saveChapterUserData(activeChapter.id, { steps_progress: newSteps });
    }
  };

  // Toggle studied
  const toggleStudied = async () => {
    const next = !studied;
    setStudied(next);
    if (activeChapter?.id) {
      await saveChapterUserData(activeChapter.id, { studied: next });
    }
    refreshStudied();
  };

  const showToast = (msg: string) => setToast(msg);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.altKey && e.key === 'ArrowRight') {
        setActiveChapterIdx(i => Math.min(i + 1, doneChapters.length - 1));
      } else if (e.altKey && e.key === 'ArrowLeft') {
        setActiveChapterIdx(i => Math.max(i - 1, 0));
      }
      if (viewMode === 'flashcard') {
        if (e.key === 'ArrowRight') setFlashcardIdx(i => Math.min(i + 1, (chapterJson?.teachings.length ?? 1) - 1));
        if (e.key === 'ArrowLeft') setFlashcardIdx(i => Math.max(i - 1, 0));
        if (e.key === ' ') { e.preventDefault(); setFlashcardFlipped(f => !f); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doneChapters.length, viewMode, chapterJson?.teachings?.length]);

  // Text selection → Copilot stub pill
  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setSelectionPill(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionPill({ x: rect.left + rect.width / 2, y: rect.top });
    };
    document.addEventListener('mouseup', handler);
    return () => document.removeEventListener('mouseup', handler);
  }, []);

  // No book / no chapters states
  if (!bookId) {
    return (
      <div className="notes-viewer" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="notes-empty-state">
          <div className="notes-empty-icon">📚</div>
          <h3>No Book Loaded</h3>
          <p>Open a book from the Library to view its notes.</p>
          <button className="notes-btn active" onClick={() => setActiveView('library')}>Go to Library</button>
        </div>
      </div>
    );
  }

  if (doneChapters.length === 0) {
    return (
      <div className="notes-viewer" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="notes-empty-state">
          <div className="notes-empty-icon">🤖</div>
          <h3>No Extracted Notes Yet</h3>
          <p>Run the AI extraction pipeline to generate chapter notes.</p>
          <button className="notes-btn active" onClick={() => setActiveView('pipeline')}>Go to Pipeline</button>
        </div>
      </div>
    );
  }

  // Key Insights view
  const renderKeyInsights = () => (
    <div className="notes-key-insights-view">
      <h2>✨ Key Insights</h2>
      <p>The core lesson from every chapter — your entire book distilled.</p>
      {doneChapters.map((ch, i) => (
        <div key={i} className="notes-insight-row" onClick={() => { setActiveChapterIdx(i); setViewMode('normal'); }}>
          <div className="notes-insight-num">Ch. {ch.num}</div>
          <div className="notes-insight-text">{chapterInsights[i] ?? ch.title}</div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (!activeChapter) return null;
    if (loadingJson) return <SkeletonLoader />;
    if (jsonError) {
      return (
        <div className="notes-empty-state">
          <div className="notes-empty-icon">⚠️</div>
          <h3>Could Not Load Notes</h3>
          <p>{jsonError}</p>
        </div>
      );
    }
    if (!chapterJson) {
      return (
        <div className="notes-empty-state">
          <div className="notes-empty-icon">📄</div>
          <h3>No Data</h3>
          <p>This chapter has no extracted notes file.</p>
        </div>
      );
    }

    const j = chapterJson;
    const doneSteps = steps.filter(Boolean).length;

    if (viewMode === 'flashcard') {
      const teaching = j.teachings[flashcardIdx];
      return (
        <div className="notes-scroll" style={{ fontSize, lineHeight }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--bs-text-muted)', fontSize: 13 }}>
            Card {flashcardIdx + 1} / {j.teachings?.length ?? 0} — Space to flip, ← → to navigate
          </div>
          <div className="notes-section" style={{ maxWidth: 600, margin: '0 auto', cursor: 'pointer' }} onClick={() => setFlashcardFlipped(f => !f)}>
            <div className="notes-flashcard-front">{flashcardFlipped ? teaching?.explanation : teaching?.technique}</div>
            <div style={{ borderTop: '1px solid var(--bs-border)', padding: '0.75rem', textAlign: 'center', fontSize: 12, color: 'var(--bs-text-muted)' }}>
              {flashcardFlipped ? 'Explanation' : 'Technique — click to reveal'}
            </div>
          </div>
          <div className="notes-flashcard-nav">
            <button className="notes-btn" onClick={() => { setFlashcardIdx(i => Math.max(i-1,0)); setFlashcardFlipped(false); }}>← Prev</button>
            <button className="notes-btn" onClick={() => setFlashcardFlipped(f => !f)}>Flip</button>
            <button className="notes-btn" onClick={() => { setFlashcardIdx(i => Math.min(i+1, (j.teachings?.length ?? 1)-1)); setFlashcardFlipped(false); }}>Next →</button>
          </div>
        </div>
      );
    }

    return (
      <div className="notes-scroll" style={{ fontSize, lineHeight }}>
        {/* Chapter Header */}
        <div className="notes-chapter-header">
          <div className="notes-chapter-num-label">Chapter {j.chapter_number}</div>
          <div className="notes-chapter-header-top">
            <h1>{j.chapter_title}</h1>
            <div className="notes-chapter-actions">
              <button className={`notes-studied-btn ${studied ? 'studied' : ''}`} onClick={toggleStudied}>
                {studied ? '✓ Studied' : 'Mark as Studied'}
              </button>
              <button className="notes-export-btn" onClick={() => showToast('Export coming soon')}>
                <FileText size={14} /> Export
              </button>
            </div>
          </div>
          <div className="notes-chapter-meta-row">
            {j.difficulty_to_implement && <DiffBadge value={j.difficulty_to_implement} size="md" />}
            {j.obsidian_tags?.map(tag => (
              <button key={tag} className="notes-tag-pill" onClick={() => setTagFilter(tagFilter === tag ? null : tag)}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Core Lesson Hero */}
        <div className="notes-core-lesson">
          <div className="notes-core-lesson-label"><Lightbulb size={14} /> Core Lesson</div>
          <p className="notes-core-lesson-text">{j.core_lesson}</p>
          <CopyButton text={j.core_lesson} onToast={showToast} />
        </div>

        {/* Summary */}
        <div className="notes-section">
          <div className="notes-section-header" onClick={() => setSummaryOpen(o => !o)}>
            <div className="notes-section-title"><BookOpen size={15} className="icon" /> Summary</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="notes-summary-toggle" onClick={e => e.stopPropagation()}>
                <button className={summaryMode === 'brief' ? 'active' : ''} onClick={() => setSummaryMode('brief')}>Brief</button>
                <button className={summaryMode === 'full' ? 'active' : ''} onClick={() => setSummaryMode('full')}>Full</button>
              </div>
              <ChevronRight size={16} className={`notes-section-chevron ${summaryOpen ? 'open' : ''}`} />
            </div>
          </div>
          {summaryOpen && (
            <div className="notes-section-body">
              <p className="notes-summary-text">
                {summaryMode === 'brief' ? j.summary.split('. ').slice(0, 2).join('. ') + '.' : j.summary}
              </p>
            </div>
          )}
        </div>

        {/* Teachings Accordion */}
        <div className="notes-section">
          <div className="notes-section-header" onClick={() => setTeachingsOpen(o => !o)}>
            <div className="notes-section-title">
              <GraduationCap size={15} className="icon" /> Techniques
              <span className="notes-section-count">{j.teachings?.length ?? 0}</span>
            </div>
            <ChevronRight size={16} className={`notes-section-chevron ${teachingsOpen ? 'open' : ''}`} />
          </div>
          {teachingsOpen && (
            <div className="notes-section-body">
              {j.teachings?.map((t, i) => (
                <div key={i} className={`notes-teaching-card ${openTeaching === i ? 'open' : ''}`}>
                  <div className={`notes-teaching-trigger ${openTeaching === i ? 'open' : ''}`} onClick={() => setOpenTeaching(openTeaching === i ? null : i)}>
                    <span className="notes-teaching-idx">#{i + 1}</span>
                    <span className="notes-teaching-name">{t.technique}</span>
                    <ChevronDown size={14} className={`notes-teaching-chevron ${openTeaching === i ? 'open' : ''}`} />
                  </div>
                  {openTeaching === i && (
                    <div className="notes-teaching-body">
                      {t.explanation}
                      <CopyButton text={`${t.technique}: ${t.explanation}`} onToast={showToast} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Implementation Steps */}
        <div className="notes-section">
          <div className="notes-section-header" onClick={() => setStepsOpen(o => !o)}>
            <div className="notes-section-title">
              <ListChecks size={15} className="icon" /> Implementation Steps
              <span className="notes-section-count">{doneSteps}/{j.implementation_steps?.length ?? 0}</span>
            </div>
            <ChevronRight size={16} className={`notes-section-chevron ${stepsOpen ? 'open' : ''}`} />
          </div>
          {stepsOpen && (
            <div className="notes-section-body">
              <div className="notes-steps-progress-bar-wrap">
                <div className="notes-steps-progress-label">{doneSteps} of {j.implementation_steps?.length ?? 0} steps done</div>
                <div className="notes-steps-progress-bar">
                  <div className="notes-steps-progress-fill" style={{ width: `${j.implementation_steps?.length ? (doneSteps / j.implementation_steps.length) * 100 : 0}%` }} />
                </div>
              </div>
              {j.implementation_steps?.map((step, i) => (
                <div key={i} className="notes-step-item">
                  <input type="checkbox" checked={steps[i] ?? false} onChange={() => toggleStep(i)} />
                  <span className="notes-step-num">{i + 1}.</span>
                  <span className={`notes-step-text ${steps[i] ? 'done' : ''}`}>{step}</span>
                  <CopyButton text={step} onToast={showToast} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Supporting Quotes */}
        <div className="notes-section">
          <div className="notes-section-header" onClick={() => setQuotesOpen(o => !o)}>
            <div className="notes-section-title">
              <Quote size={15} className="icon" /> Supporting Quotes
              <span className="notes-section-count">{j.supporting_quotes?.length ?? 0}</span>
            </div>
            <ChevronRight size={16} className={`notes-section-chevron ${quotesOpen ? 'open' : ''}`} />
          </div>
          {quotesOpen && (
            <div className="notes-section-body">
              {j.supporting_quotes?.map((q, i) => (
                <div key={i} className="notes-quote-card">
                  <span className="notes-quote-icon">"</span>
                  {q}
                  <CopyButton text={q} onToast={showToast} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Reflections */}
        <div className="notes-reflections">
          <div className="notes-reflections-header" onClick={() => setReflectionsOpen(o => !o)}>
            <span>✍️ My Reflections</span>
            <ChevronDown size={15} style={{ transform: reflectionsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>
          {reflectionsOpen && (
            <div className="notes-reflections-body">
              {isEditingNotes ? (
                <textarea
                  autoFocus
                  className="notes-reflections-textarea"
                  value={userNotes}
                  onChange={e => setUserNotes(e.target.value)}
                  onBlur={handleNotesSave}
                  placeholder="Write your reflections, takeaways, or questions here... (Markdown supported)"
                />
              ) : (
                <div className="notes-reflections-preview" onClick={() => setIsEditingNotes(true)}>
                  {userNotes
                    ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{userNotes}</ReactMarkdown>
                    : <span className="notes-reflections-placeholder">Click to add your personal reflections...</span>
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="notes-viewer">
      {/* Left Sidebar */}
      <div className={`notes-sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
        <div className="notes-sidebar-header">
          <h3>📚 {currentBookTitle || 'Notes'}</h3>
          <div className="notes-studied-progress">
            <span>{studiedCount.studied}/{studiedCount.total} studied</span>
            <div className="notes-studied-bar">
              <div className="notes-studied-bar-fill" style={{ width: `${studiedCount.total ? (studiedCount.studied / studiedCount.total) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        {tagFilter && (
          <div className="notes-tag-filter-pill">
            <Tag size={10} /> {tagFilter}
            <button onClick={() => setTagFilter(null)}>×</button>
          </div>
        )}

        <div className="notes-chapter-list">
          {doneChapters.map((ch, i) => {
            const diff = (chapterDiffs[i] ?? '').toLowerCase();
            const diffClass = diff === 'easy' ? 'diff-easy' : diff === 'hard' ? 'diff-hard' : diff === 'medium' ? 'diff-medium' : '';
            return (
              <div
                key={ch.id ?? i}
                className={`notes-chapter-item ${activeChapterIdx === i ? 'active' : ''} ${diffClass}`}
                onClick={() => { setActiveChapterIdx(i); setViewMode('normal'); }}
              >
                <div className={`notes-status-dot ${ch.status}`} />
                <div className="notes-chapter-info">
                  <div className="notes-chapter-title">{ch.title}</div>
                  {chapterDiffs[i] && (
                    <div className="notes-chapter-meta">
                      <DiffBadge value={chapterDiffs[i]} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="notes-content-area">
        {!isSidebarOpen && (
          <button className="notes-sidebar-toggle" onClick={() => setIsSidebarOpen(true)} title="Show Sidebar">
            <ChevronRight size={16} />
          </button>
        )}

        {/* Toolbar */}
        <div className="notes-toolbar">
          <button className="notes-btn" onClick={() => setIsSidebarOpen(o => !o)} title="Toggle Sidebar">
            <Maximize2 size={14} />
          </button>
          <div className="notes-toolbar-sep" />
          <div className="notes-toolbar-group">
            <label>Font</label>
            <input type="range" min={13} max={22} value={fontSize} onChange={e => setFontSize(+e.target.value)} />
            <span style={{ fontSize: 12, color: 'var(--bs-text-muted)', minWidth: 28 }}>{fontSize}px</span>
          </div>
          <div className="notes-toolbar-group">
            <label>Spacing</label>
            <input type="range" min={1.4} max={2.2} step={0.05} value={lineHeight} onChange={e => setLineHeight(+e.target.value)} />
          </div>
          <div className="notes-toolbar-sep" />
          <button
            className={`notes-btn ${viewMode === 'insights' ? 'active' : ''}`}
            onClick={() => setViewMode(viewMode === 'insights' ? 'normal' : 'insights')}
          >
            <Zap size={14} /> Key Insights
          </button>
          <button
            className={`notes-btn ${viewMode === 'flashcard' ? 'active' : ''}`}
            onClick={() => setViewMode(viewMode === 'flashcard' ? 'normal' : 'flashcard')}
          >
            🃏 Flashcards
          </button>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--bs-text-muted)' }}>
            Alt+← / Alt+→ to navigate
          </span>
        </div>

        {viewMode === 'insights' ? renderKeyInsights() : renderContent()}
      </div>

      {/* Copilot Stub Pill */}
      {selectionPill && (
        <div
          className="notes-copilot-pill"
          style={{ left: selectionPill.x, top: selectionPill.y }}
          onMouseDown={e => e.preventDefault()}
          onClick={() => { showToast('✦ AI Copilot coming in Phase 6'); setSelectionPill(null); }}
        >
          ✦ Copilot
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </div>
  );
}
