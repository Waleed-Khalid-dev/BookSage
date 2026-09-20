import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, Copy, Check, RotateCcw, X, MessageSquare, AlertCircle } from 'lucide-react';
import { invokePython } from '../../services/pythonService';
import { getCachedBookRecap, saveCachedBookRecap } from '../../services/dbService';
import { useApiKeys } from '../../stores/apiKeysStore';
import { CitationChip } from './CitationChip';
import './StorySoFarModal.css';

interface ChapterInfo {
  id?: string;
  num: number;
  title: string;
  pp?: string;
  pages?: string;
  json_path?: string;
}

interface StorySoFarModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string | null;
  bookTitle: string;
  currentChapterNum: number;
  currentChapterTitle?: string;
  currentPage?: number;
  chapters: ChapterInfo[];
  aiModel?: string;
  onDiscussInCopilot?: (recapText: string) => void;
}

export function StorySoFarModal({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  currentChapterNum,
  currentChapterTitle,
  currentPage,
  chapters,
  aiModel = 'gemini-3.6-flash',
  onDiscussInCopilot
}: StorySoFarModalProps) {
  const { getKey } = useApiKeys();
  const [recap, setRecap] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Determine which chapters are before currentChapterNum
  const previousChapters = chapters.filter(c => c.num < currentChapterNum);
  const provider = 'gemini'; // default provider
  const apiKey = getKey(provider);

  const fetchRecap = useCallback(async (forceRefresh = false) => {
    if (!bookId) return;

    setError(null);

    // 1. Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = await getCachedBookRecap(bookId, currentChapterNum);
      if (cached) {
        setRecap(cached);
        return;
      }
    }

    if (!apiKey) {
      setError('Please configure your Gemini API Key in Settings to generate the "Story So Far" recap.');
      return;
    }

    setIsLoading(true);

    try {
      const allJsonPaths = chapters
        .map(c => c.json_path)
        .filter(Boolean) as string[];

      const chaptersMeta = chapters.map(c => ({
        num: c.num,
        title: c.title,
        pages: c.pp || c.pages,
        json_path: c.json_path
      }));

      const res = await invokePython({
        command: 'story_so_far_recap',
        book_title: bookTitle,
        current_chapter_num: currentChapterNum,
        current_chapter_title: currentChapterTitle,
        current_page: currentPage,
        all_json_paths: allJsonPaths,
        chapters_meta: chaptersMeta,
        provider,
        api_key: apiKey,
        model_name: aiModel
      });

      if (res.status === 'success' && res.recap) {
        setRecap(res.recap);
        await saveCachedBookRecap(bookId, currentChapterNum, res.recap);
      } else {
        setError(res.message || 'Failed to generate recap.');
      }
    } catch (err: any) {
      console.error('Error generating story so far:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [bookId, currentChapterNum, currentChapterTitle, currentPage, chapters, bookTitle, apiKey, aiModel]);

  // Trigger fetch when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchRecap();
    }
  }, [isOpen, fetchRecap]);

  const handleCopy = () => {
    if (!recap) return;
    navigator.clipboard.writeText(recap);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDiscuss = () => {
    if (recap && onDiscussInCopilot) {
      onDiscussInCopilot(recap);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="story-so-far-overlay" onClick={onClose}>
      <div className="story-so-far-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="story-so-far-header">
          <div className="story-so-far-title-group">
            <div className="story-so-far-badge-row">
              <span className="story-so-far-badge">
                <BookOpen size={13} />
                Story So Far
              </span>
              <span className="story-so-far-progress">
                {previousChapters.length > 0 
                  ? `Chapters 1–${currentChapterNum - 1} Recap` 
                  : 'Beginning of Book'}
              </span>
            </div>
            <h2 className="story-so-far-title">{bookTitle}</h2>
            <p className="story-so-far-subtitle">
              Resuming on Chapter {currentChapterNum}
              {currentChapterTitle ? `: ${currentChapterTitle}` : ''}
              {currentPage ? ` (Page ${currentPage})` : ''}
            </p>
          </div>
          <button className="story-so-far-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="story-so-far-body">
          {isLoading ? (
            <div className="story-so-far-loading">
              <div className="story-so-far-spinner" />
              <p>Synthesizing your journey through the previous chapters…</p>
            </div>
          ) : error ? (
            <div className="story-so-far-error">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--bs-heading)' }}>
                <AlertCircle size={18} />
                <strong>Unable to generate recap</strong>
              </div>
              <p style={{ margin: 0 }}>{error}</p>
            </div>
          ) : recap ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => {
                  const childStr = String(children || '');
                  if (href?.startsWith('cite:')) {
                    const chNum = parseInt(href.replace('cite:', ''), 10);
                    return <CitationChip chapterNum={chNum} label={childStr} />;
                  }
                  const chMatch = href?.match(/(?:cite:)?(?:ch(?:apter)?\.?|law)?\s*(\d+)/i) ||
                                  childStr.match(/(?:ch(?:apter)?\.?|law)\s*(\d+)/i);
                  if (chMatch) {
                    const chNum = parseInt(chMatch[1], 10);
                    return <CitationChip chapterNum={chNum} label={childStr} />;
                  }
                  return (
                    <span 
                      style={{ color: 'var(--bs-accent, #009688)', fontWeight: 500 }}
                    >
                      {children}
                    </span>
                  );
                }
              }}
            >
              {recap}
            </ReactMarkdown>
          ) : (
            <div className="story-so-far-loading">
              <p>No recap available yet.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="story-so-far-footer">
          <div className="story-so-far-footer-left">
            <button
              className="story-so-far-btn"
              onClick={() => fetchRecap(true)}
              disabled={isLoading}
              title="Regenerate recap with fresh AI synthesis"
            >
              <RotateCcw size={13} />
              Regenerate
            </button>
            <button
              className="story-so-far-btn"
              onClick={handleCopy}
              disabled={!recap || isLoading}
              title="Copy recap to clipboard"
            >
              {copied ? <Check size={13} color="var(--bs-accent)" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="story-so-far-footer-right">
            {onDiscussInCopilot && (
              <button
                className="story-so-far-btn"
                onClick={handleDiscuss}
                disabled={!recap || isLoading}
                title="Open Copilot chat to discuss this recap"
              >
                <MessageSquare size={13} />
                Discuss in Copilot
              </button>
            )}
            <button className="story-so-far-btn story-so-far-btn-primary" onClick={onClose}>
              Resume Reading ➔
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
