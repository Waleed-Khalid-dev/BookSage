import React, { useState, useEffect } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { usePDFContext } from '../../hooks/usePDF';
import { getBookmarksForBook, getHighlightsForBook, BookmarkRecord, HighlightRecord } from '../../services/dbService';

export function SidebarTabs() {
  const [activeTab, setActiveTab] = useState<'toc' | 'thumbnails' | 'annotations'>('toc');
  const { chapters, bookId, highlightsRefreshCounter, bookmarksRefreshCounter } = useBookStore();
  const pdfState = usePDFContext();
  
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [highlights, setHighlights] = useState<HighlightRecord[]>([]);

  useEffect(() => {
    if (activeTab === 'annotations' && bookId) {
      getBookmarksForBook(bookId).then(setBookmarks);
      getHighlightsForBook(bookId).then(setHighlights);
    }
  }, [activeTab, bookId, highlightsRefreshCounter, bookmarksRefreshCounter]);

  const handlePageJump = (page: number) => {
    if (pdfState) {
      pdfState.setPage(page);
      
      // Attempt to scroll continuous view if active
      const el = document.getElementById(`pdf-page-${page}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
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
          <div style={{ textAlign: 'center', color: 'var(--bs-muted)', paddingTop: '2rem' }}>
            <p>Thumbnails coming soon</p>
          </div>
        )}

        {activeTab === 'annotations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Bookmarks Section */}
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--bs-heading)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Bookmarks</h4>
              {bookmarks.length === 0 ? (
                <p style={{ color: 'var(--bs-muted)', fontSize: '0.8rem' }}>No bookmarks added.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {bookmarks.map(b => (
                    <button
                      key={b.id}
                      onClick={() => handlePageJump(b.page_num)}
                      style={{
                        textAlign: 'left', padding: '0.5rem',
                        background: 'var(--bs-panel)', border: '1px solid var(--bs-border)',
                        borderRadius: '4px', color: 'var(--bs-text)', cursor: 'pointer',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <span style={{ fontSize: '0.85rem' }}>{b.label || `Page ${b.page_num}`}</span>
                      <span style={{ color: 'var(--bs-accent)' }}>🔖</span>
                    </button>
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
                    <button
                      key={h.id}
                      onClick={() => handlePageJump(h.page_num)}
                      style={{
                        textAlign: 'left', padding: '0.5rem',
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
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
