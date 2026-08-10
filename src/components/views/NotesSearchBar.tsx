import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';
import Mark from 'mark.js';

interface NotesSearchBarProps {
  containerSelector: string;
}

export function NotesSearchBar({ containerSelector }: NotesSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [totalMatches, setTotalMatches] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const markInstance = useRef<any>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        const uiState = useUiStore.getState();
        if (uiState.activeView !== 'notes' && uiState.focusedPanel !== 'notes') return; 
        
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
    window.addEventListener('open-notes-search', handleOpenSearch);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-notes-search', handleOpenSearch);
    };
  }, [isOpen]);

  // Clean up highlights on unmount
  useEffect(() => {
    return () => {
      if (markInstance.current) {
        markInstance.current.unmark();
      }
    };
  }, []);

  const performSearch = (query: string) => {
    if (!query) {
      clearSearch();
      return;
    }

    setIsSearching(true);
    if (!markInstance.current) {
      markInstance.current = new Mark(containerSelector);
    }

    // Clear previous marks
    markInstance.current.unmark({
      done: () => {
        // Apply new marks
        markInstance.current.mark(query, {
          separateWordSearch: false,
          done: (total: number) => {
            setTotalMatches(total);
            if (total > 0) {
              setCurrentIndex(0);
              scrollToMatch(0);
            } else {
              setCurrentIndex(-1);
            }
            setIsSearching(false);
          }
        });
      }
    });
  };

  const clearSearch = () => {
    setLocalQuery('');
    setTotalMatches(0);
    setCurrentIndex(-1);
    if (markInstance.current) {
      markInstance.current.unmark();
    }
  };

  const scrollToMatch = (index: number) => {
    const marks = document.querySelectorAll(`${containerSelector} mark`);
    if (marks && marks[index]) {
      marks.forEach(m => m.classList.remove('active-mark'));
      marks[index].classList.add('active-mark');
      marks[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const nextMatch = () => {
    if (totalMatches === 0) return;
    const nextIdx = (currentIndex + 1) % totalMatches;
    setCurrentIndex(nextIdx);
    scrollToMatch(nextIdx);
  };

  const prevMatch = () => {
    if (totalMatches === 0) return;
    const prevIdx = (currentIndex - 1 + totalMatches) % totalMatches;
    setCurrentIndex(prevIdx);
    scrollToMatch(prevIdx);
  };

  const handleClose = () => {
    setIsOpen(false);
    clearSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        prevMatch();
      } else if (totalMatches > 0) {
        nextMatch();
      } else {
        performSearch(localQuery);
      }
    }
  };

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
        onChange={e => {
            setLocalQuery(e.target.value);
            // Real-time search for Notes since it's fast
            if (e.target.value) {
                performSearch(e.target.value);
            } else {
                clearSearch();
            }
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search chapter..."
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--bs-text)',
          outline: 'none',
          width: '180px'
        }}
      />
      
      <div style={{ fontSize: '12px', color: 'var(--bs-text-muted)', whiteSpace: 'nowrap', minWidth: '40px', textAlign: 'right' }}>
        {totalMatches > 0 ? `${currentIndex + 1} / ${totalMatches}` : (localQuery && !isSearching ? '0 / 0' : '')}
      </div>

      <div style={{ display: 'flex', gap: '2px' }}>
        <button onClick={prevMatch} className="icon-btn" style={{ padding: '4px' }} disabled={totalMatches === 0}><ChevronUp size={16} /></button>
        <button onClick={nextMatch} className="icon-btn" style={{ padding: '4px' }} disabled={totalMatches === 0}><ChevronDown size={16} /></button>
      </div>
      <div style={{ width: '1px', height: '16px', background: 'var(--bs-border)' }}></div>
      <button onClick={handleClose} className="icon-btn" style={{ padding: '4px' }}><X size={16} /></button>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        mark {
          background-color: rgba(255, 255, 0, 0.4);
          color: inherit;
          border-radius: 2px;
          padding: 0 2px;
        }
        mark.active-mark {
          background-color: rgba(255, 165, 0, 0.7);
          box-shadow: 0 0 0 2px var(--bs-accent);
        }
      `}</style>
    </div>
  );
}
