import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { useBookStore } from '../../stores/bookStore';
import { useUiStore } from '../../stores/uiStore';

export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { 
    performSearch, 
    nextSearchResult, 
    prevSearchResult, 
    clearSearch, 
    isSearching, 
    totalSearchMatches, 
    currentSearchIndex,
    searchResults
  } = useBookStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        const currentFocus = useUiStore.getState().focusedPanel;
        // In full-screen reader mode, it's fine. In split view, if notes has focus, ignore.
        if (currentFocus === 'notes') return;
        
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    
    const handleOpenSearch = () => {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-search', handleOpenSearch);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-search', handleOpenSearch);
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    clearSearch();
    setLocalQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        prevSearchResult();
      } else if (totalSearchMatches > 0 && localQuery === useBookStore.getState().searchQuery) {
        nextSearchResult();
      } else {
        performSearch(localQuery);
      }
    }
  };

  // Scroll to active match when currentSearchIndex changes
  useEffect(() => {
    if (currentSearchIndex >= 0 && totalSearchMatches > 0) {
      // Find which page the current match is on
      for (const pageMatches of searchResults) {
        for (const rect of pageMatches.rects) {
          if (rect.matchIndex === currentSearchIndex) {
            window.dispatchEvent(new CustomEvent('search-jump', { detail: { page: pageMatches.page, rect: rect } }));
            return;
          }
        }
      }
    }
  }, [currentSearchIndex, totalSearchMatches, searchResults]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      background: 'var(--bs-surface)',
      border: '1px solid var(--bs-border)',
      borderRadius: '8px',
      padding: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      zIndex: 1000
    }}>
      {isSearching ? <Loader2 size={16} className="spinner" color="var(--bs-text-muted)" style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} color="var(--bs-text-muted)" />}
      
      <input
        ref={inputRef}
        type="text"
        value={localQuery}
        onChange={e => setLocalQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search in PDF..."
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--bs-text)',
          outline: 'none',
          width: '180px'
        }}
      />
      
      <div style={{ fontSize: '12px', color: 'var(--bs-text-muted)', whiteSpace: 'nowrap', minWidth: '40px', textAlign: 'right' }}>
        {totalSearchMatches > 0 ? `${currentSearchIndex + 1} / ${totalSearchMatches}` : (localQuery && !isSearching && useBookStore.getState().searchQuery === localQuery ? '0 / 0' : '')}
      </div>

      <div style={{ display: 'flex', gap: '2px' }}>
        <button onClick={prevSearchResult} className="icon-btn" style={{ padding: '4px' }} disabled={totalSearchMatches === 0}><ChevronUp size={16} /></button>
        <button onClick={() => {
            if (totalSearchMatches > 0 && localQuery === useBookStore.getState().searchQuery) {
                nextSearchResult();
            } else {
                performSearch(localQuery);
            }
        }} className="icon-btn" style={{ padding: '4px' }}><ChevronDown size={16} /></button>
      </div>
      <div style={{ width: '1px', height: '16px', background: 'var(--bs-border)' }}></div>
      <button onClick={handleClose} className="icon-btn" style={{ padding: '4px' }}><X size={16} /></button>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
