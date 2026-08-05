import { useState, useEffect, useRef } from 'react';
import { useSearchStore } from '../../stores/searchStore';
import { searchAnnotations, SearchResult } from '../../services/dbService';
import { Search, X, BookOpen } from 'lucide-react';
import { useBookStore } from '../../stores/bookStore';

export function GlobalSearchModal() {
  const { isSearchModalOpen, setSearchModalOpen } = useSearchStore();
  const { loadBook } = useBookStore();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isSearchModalOpen && inputRef.current) {
      inputRef.current.focus();
    } else if (!isSearchModalOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isSearchModalOpen]);

  // Handle Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
      if (e.key === 'Escape' && isSearchModalOpen) {
        setSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, setSearchModalOpen]);

  // Debounced Search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      const res = await searchAnnotations(query.trim());
      setResults(res);
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timeout);
  }, [query]);

  if (!isSearchModalOpen) return null;

  const handleResultClick = (result: SearchResult) => {
    setSearchModalOpen(false);
    
    // Check if we're already on the reader view for this book
    const currentBookId = useBookStore.getState().bookId;
    if (currentBookId === result.book_id) {
      window.dispatchEvent(new CustomEvent('booksage-jump-page', { detail: result.page_num }));
    } else {
      loadBook(result.book_id).then(() => {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('booksage-jump-page', { detail: result.page_num }));
        }, 500); // Give it time to load the book
      });
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      paddingTop: '10vh', zIndex: 9999
    }} onClick={() => setSearchModalOpen(false)}>
      
      <div style={{
        background: 'var(--bs-surface)', width: '600px', maxWidth: '90vw',
        maxHeight: '80vh', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Search Input Area */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--bs-border)' }}>
          <Search size={20} color="var(--bs-muted)" style={{ marginRight: '0.5rem' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your highlights and notes..."
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              color: 'var(--bs-text)', fontSize: '1.1rem'
            }}
          />
          <button onClick={() => setSearchModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--bs-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Results Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {query.trim().length > 0 && query.trim().length < 2 && (
            <p style={{ textAlign: 'center', color: 'var(--bs-muted)' }}>Type at least 2 characters to search...</p>
          )}
          
          {isLoading && results.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--bs-muted)' }}>Searching...</p>
          )}

          {!isLoading && query.trim().length >= 2 && results.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--bs-muted)' }}>No results found.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => handleResultClick(r)}
                style={{
                  textAlign: 'left', padding: '0.75rem', background: 'var(--bs-panel)',
                  border: '1px solid var(--bs-border)', borderRadius: '8px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: '0.25rem', transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bs-border)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'var(--bs-panel)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--bs-muted)', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <BookOpen size={12} />
                    <span>{r.book_title}</span>
                  </div>
                  <span>Page {r.page_num}</span>
                </div>
                
                {r.text && r.text.trim() !== '' && (
                  <div style={{ fontSize: '0.9rem', color: 'var(--bs-text)', fontStyle: 'italic', borderLeft: `3px solid ${r.color}`, paddingLeft: '0.5rem' }}>
                    "{r.text}"
                  </div>
                )}
                
                {r.note && r.note.trim() !== '' && (
                  <div style={{ fontSize: '0.9rem', color: 'var(--bs-text)', marginTop: '0.25rem' }}>
                    <strong>Note:</strong> {r.note}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0.5rem 1rem', background: 'var(--bs-panel)', borderTop: '1px solid var(--bs-border)', fontSize: '0.75rem', color: 'var(--bs-muted)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Search across all books</span>
          <span><kbd style={{ background: 'var(--bs-border)', padding: '2px 4px', borderRadius: '4px' }}>ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
