import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useBookStore } from '../../stores/bookStore';
import {
  getBookmarksForBook,
  getHighlightsForBook,
  deleteBookmark,
  deleteHighlight,
  getAllPinnedInsightsForBook,
  unpinChapterInsight,
  BookmarkRecord,
  HighlightRecord,
  PinnedInsightRecord
} from '../../services/dbService';
import { ThumbnailList } from './ThumbnailList';
import { copyExportToClipboard, saveExportToFile } from '../../services/exportService';
import { Download, Copy, Check, Search, Trash2 } from 'lucide-react';
import { useSearchStore } from '../../stores/searchStore';

function PinnedInsightItem({
  item,
  startPage,
  onJump,
  onUnpin
}: {
  item: PinnedInsightRecord;
  startPage: number;
  onJump: (page: number) => void;
  onUnpin: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = item.insight.length > 150;

  // Clean prompt boilerplate preamble if present
  let displayContent = item.insight;
  if (displayContent.startsWith('Based on your ACTIVE USER READING POSITION') || displayContent.startsWith('Based on the book context')) {
    const lines = displayContent.split('\n');
    const contentStartIdx = lines.findIndex(l => 
      l.includes('Main Takeaways') || l.includes('Takeaways') || l.includes('Key Lessons') || l.includes('Core Lessons')
    );
    if (contentStartIdx !== -1) {
      displayContent = lines.slice(contentStartIdx).join('\n');
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        background: 'var(--bs-panel)',
        border: '1px solid var(--bs-border)',
        borderLeft: '3px solid var(--bs-accent, #009688)',
        borderRadius: '6px',
        padding: '0.55rem 0.65rem',
        transition: 'all 0.15s ease'
      }}
    >
      {/* Header with Chapter badge, page jump pill, and delete */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
        <div 
          onClick={() => onJump(startPage)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden', flex: 1, cursor: 'pointer' }}
          title={`Jump to ${item.chapterTitle} (p.${startPage})`}
        >
          <span style={{
            background: 'rgba(0, 150, 136, 0.15)',
            color: 'var(--bs-accent, #009688)',
            padding: '1px 5px',
            borderRadius: '3px',
            fontSize: '0.7rem',
            fontWeight: 700,
            whiteSpace: 'nowrap'
          }}>
            Ch. {item.chapterNum}
          </span>
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 600,
              color: 'var(--bs-text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {item.chapterTitle}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={() => onJump(startPage)}
            style={{
              background: 'transparent',
              border: '1px solid var(--bs-border)',
              borderRadius: '3px',
              padding: '1px 5px',
              fontSize: '0.68rem',
              color: 'var(--bs-muted)',
              cursor: 'pointer'
            }}
            title={`Jump to page ${startPage}`}
          >
            p.{startPage} ↗
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnpin();
            }}
            style={{
              padding: '2px 4px',
              background: 'transparent',
              border: 'none',
              color: 'var(--bs-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bs-danger, #ef4444)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bs-muted)')}
            title="Unpin Insight"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Content Preview without ugly scrollbars */}
      <div
        style={{
          fontSize: '0.78rem',
          color: 'var(--bs-text)',
          lineHeight: '1.42',
          wordBreak: 'break-word',
          opacity: 0.9,
          ...(isExpanded ? {} : {
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          })
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ children }) => (
              <span style={{ color: 'var(--bs-accent, #009688)', fontWeight: 500 }}>{children}</span>
            ),
            p: ({ children }) => <p style={{ margin: '0 0 0.2rem 0' }}>{children}</p>,
            ul: ({ children }) => <ul style={{ margin: '0 0 0.2rem 0', paddingLeft: '1rem' }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ margin: '0 0 0.2rem 0', paddingLeft: '1rem' }}>{children}</ol>,
            li: ({ children }) => <li style={{ margin: '0 0 0.1rem 0' }}>{children}</li>,
          }}
        >
          {displayContent}
        </ReactMarkdown>
      </div>

      {/* Show more toggle */}
      {isLong && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            alignSelf: 'flex-start',
            background: 'transparent',
            border: 'none',
            color: 'var(--bs-accent, #009688)',
            fontSize: '0.7rem',
            cursor: 'pointer',
            padding: 0,
            marginTop: '1px',
            fontWeight: 500
          }}
        >
          {isExpanded ? 'Show less ▴' : 'Show more ▾'}
        </button>
      )}
    </div>
  );
}

export function SidebarTabs() {
  const [activeTab, setActiveTab] = useState<'toc' | 'thumbnails' | 'annotations'>('toc');
  const { chapters, bookId, highlightsRefreshCounter, bookmarksRefreshCounter, insightsRefreshCounter } = useBookStore();
  const { setSearchModalOpen } = useSearchStore();

  
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [highlights, setHighlights] = useState<HighlightRecord[]>([]);
  const [pinnedInsights, setPinnedInsights] = useState<PinnedInsightRecord[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (activeTab === 'annotations' && bookId) {
      getBookmarksForBook(bookId).then(setBookmarks);
      getHighlightsForBook(bookId).then(setHighlights);
      getAllPinnedInsightsForBook(bookId).then(setPinnedInsights);
    }
  }, [activeTab, bookId, highlightsRefreshCounter, bookmarksRefreshCounter, insightsRefreshCounter]);

  useEffect(() => {
    const handleOpenNote = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setActiveTab('annotations');
      
      // Delay scrolling to allow the annotations tab to render and fetch data
      setTimeout(() => {
        const annotationId = customEvent.detail;
        if (annotationId) {
          const el = document.getElementById(`annotation-${annotationId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight the element briefly
            el.style.transition = 'background-color 0.5s';
            el.style.backgroundColor = 'var(--bs-primary-light)';
            setTimeout(() => {
              el.style.backgroundColor = 'var(--bs-panel)';
            }, 1000);
          }
        }
      }, 300);
    };
    
    window.addEventListener('booksage-open-sidebar', handleOpenNote);
    return () => window.removeEventListener('booksage-open-sidebar', handleOpenNote);
  }, []);

  const handlePageJump = (page: number) => {
    useBookStore.getState().setLastPage(page);
    window.dispatchEvent(new CustomEvent('booksage-jump-page', { detail: { pageNum: page } }));
    window.dispatchEvent(new CustomEvent('booksage-jump-page', { detail: page }));
  };

  const handleCopy = async () => {
    if (!bookId) return;
    setIsExporting(true);
    const success = await copyExportToClipboard(bookId);
    setIsExporting(false);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    if (!bookId) return;
    setIsExporting(true);
    await saveExportToFile(bookId);
    setIsExporting(false);
  };

  return (
    <div style={{
      width: '300px',
      borderRight: '1px solid var(--bs-border)',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bs-surface)',
      height: '100%'
    }}>
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--bs-border)',
        padding: '0.5rem',
        gap: '0.5rem'
      }}>
        <button 
          onClick={() => setActiveTab('toc')}
          style={{
            flex: 1, padding: '0.5rem', borderRadius: '4px', cursor: 'pointer',
            background: activeTab === 'toc' ? 'var(--bs-accent)' : 'transparent',
            color: activeTab === 'toc' ? 'white' : 'var(--bs-text)',
            border: 'none', fontWeight: 500
          }}>
          TOC
        </button>
        <button 
          onClick={() => setActiveTab('thumbnails')}
          style={{
            flex: 1, padding: '0.5rem', borderRadius: '4px', cursor: 'pointer',
            background: activeTab === 'thumbnails' ? 'var(--bs-accent)' : 'transparent',
            color: activeTab === 'thumbnails' ? 'white' : 'var(--bs-text)',
            border: 'none', fontWeight: 500
          }}>
          Pages
        </button>
        <button 
          onClick={() => setActiveTab('annotations')}
          style={{
            flex: 1, padding: '0.5rem', borderRadius: '4px', cursor: 'pointer',
            background: activeTab === 'annotations' ? 'var(--bs-accent)' : 'transparent',
            color: activeTab === 'annotations' ? 'white' : 'var(--bs-text)',
            border: 'none', fontWeight: 500
          }}>
          Notes
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {activeTab === 'toc' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {chapters.length === 0 ? (
              <p style={{ color: 'var(--bs-muted)', fontSize: '0.9rem', textAlign: 'center' }}>No table of contents available.</p>
            ) : (
              chapters.map(ch => {
                // Parse start page from "start-end"
                const startPage = parseInt(ch.pp.split('-')[0]) || 1;
                return (
                  <button
                    key={ch.id || ch.num}
                    onClick={() => handlePageJump(startPage)}
                    style={{
                      textAlign: 'left', padding: '0.5rem',
                      background: 'transparent', border: '1px solid var(--bs-border)',
                      borderRadius: '4px', color: 'var(--bs-text)', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{ch.num}. {ch.title}</span>
                    <span style={{ color: 'var(--bs-muted)', fontSize: '0.8rem' }}>p.{startPage}</span>
                  </button>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'thumbnails' && (
          <ThumbnailList onPageSelect={handlePageJump} />
        )}

        {activeTab === 'annotations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Export Toolbar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button 
                onClick={handleCopy}
                disabled={isExporting}
                title="Copy all notes to clipboard (Markdown)"
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: '4px', cursor: 'pointer',
                  background: 'var(--bs-panel)', border: '1px solid var(--bs-border)',
                  color: 'var(--bs-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                {isCopied ? <Check size={16} color="green" /> : <Copy size={16} />}
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{isCopied ? 'Copied!' : 'Copy'}</span>
              </button>
              
              <button 
                onClick={handleDownload}
                disabled={isExporting}
                title="Export as Markdown file"
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: '4px', cursor: 'pointer',
                  background: 'var(--bs-panel)', border: '1px solid var(--bs-border)',
                  color: 'var(--bs-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                <Download size={16} />
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Export MD</span>
              </button>

              <button 
                onClick={() => setSearchModalOpen(true)}
                title="Search all annotations"
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: '4px', cursor: 'pointer',
                  background: 'var(--bs-panel)', border: '1px solid var(--bs-border)',
                  color: 'var(--bs-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                <Search size={16} />
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Search</span>
              </button>
            </div>
            
            {/* Bookmarks Section */}
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--bs-heading)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Bookmarks</h4>
              {bookmarks.length === 0 ? (
                <p style={{ color: 'var(--bs-muted)', fontSize: '0.8rem' }}>No bookmarks added.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {bookmarks.map(b => (
                    <div key={b.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => handlePageJump(b.page_num)}
                        style={{
                          flex: 1, textAlign: 'left', padding: '0.5rem',
                          background: 'var(--bs-panel)', border: '1px solid var(--bs-border)',
                          borderRadius: '4px', color: 'var(--bs-text)', cursor: 'pointer',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                      >
                        <span style={{ fontSize: '0.85rem' }}>{b.label || `Page ${b.page_num}`}</span>
                        <span style={{ color: 'var(--bs-accent)' }}>🔖</span>
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await deleteBookmark(b.id);
                          useBookStore.getState().triggerBookmarksRefresh();
                        }}
                        style={{
                          padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--bs-danger, #ef4444)', cursor: 'pointer'
                        }}
                        title="Delete Bookmark"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--bs-border)' }} />

            {/* Highlights Section */}
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--bs-heading)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Highlights</h4>
              {highlights.length === 0 ? (
                <p style={{ color: 'var(--bs-muted)', fontSize: '0.8rem' }}>No highlights added.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {highlights.map(h => (
                    <div id={`annotation-${h.id}`} key={h.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <button
                        onClick={() => handlePageJump(h.page_num)}
                        style={{
                          flex: 1, textAlign: 'left', padding: '0.5rem',
                          background: 'var(--bs-panel)', border: '1px solid var(--bs-border)',
                          borderLeft: `4px solid ${h.color}`,
                          borderRadius: '4px', color: 'var(--bs-text)', cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', gap: '0.25rem'
                        }}
                      >
                        {h.note && h.note.trim() !== '' && (
                          <div style={{ 
                            background: '#fef3c7', 
                            padding: '0.5rem', 
                            borderRadius: '4px', 
                            color: '#92400e',
                            fontSize: '0.85rem',
                            marginBottom: '0.25rem',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                          }}>
                            <strong>Note:</strong> {h.note}
                          </div>
                        )}
                        <span style={{ fontSize: '0.85rem', fontStyle: 'italic', opacity: 0.9 }}>"{h.text}"</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--bs-muted)', alignSelf: 'flex-end' }}>p.{h.page_num}</span>
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await deleteHighlight(h.id);
                          useBookStore.getState().triggerHighlightsRefresh();
                        }}
                        style={{
                          padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--bs-danger, #ef4444)', cursor: 'pointer'
                        }}
                        title="Delete Highlight"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--bs-border)' }} />

            {/* Pinned AI Insights Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <h4 style={{ margin: 0, color: 'var(--bs-heading)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>📌</span> Pinned Insights
                </h4>
                <span style={{ background: 'var(--bs-panel)', border: '1px solid var(--bs-border)', borderRadius: '10px', padding: '1px 7px', fontSize: '0.72rem', color: 'var(--bs-accent)' }}>
                  {pinnedInsights.length}
                </span>
              </div>

              {pinnedInsights.length === 0 ? (
                <p style={{ color: 'var(--bs-muted)', fontSize: '0.8rem', lineHeight: '1.45', margin: 0 }}>
                  No pinned AI insights yet. Click 📌 Pin on any Copilot message to save key takeaways here.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {pinnedInsights.map((item, idx) => {
                    let startPage = 1;
                    if (item.pages) {
                      startPage = parseInt(item.pages.split('-')[0], 10) || 1;
                    } else {
                      const ch = chapters.find(c => c.id === item.chapterId || c.num === item.chapterNum);
                      if (ch?.pp) {
                        startPage = parseInt(ch.pp.split('-')[0], 10) || 1;
                      }
                    }

                    return (
                      <PinnedInsightItem
                        key={`${item.chapterId}-${item.index}-${idx}`}
                        item={item}
                        startPage={startPage}
                        onJump={handlePageJump}
                        onUnpin={async () => {
                          await unpinChapterInsight(item.chapterId, item.index);
                          useBookStore.getState().triggerInsightsRefresh();
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
