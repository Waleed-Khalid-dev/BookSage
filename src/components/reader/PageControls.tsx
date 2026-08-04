import { UsePDFResult } from '../../hooks/usePDF';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Bookmark, PanelLeft } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { getBookmarksForBook } from '../../services/dbService';

interface PageControlsProps {
  pdfState: UsePDFResult;
  onPageChangeRequest?: (page: number) => void;
  viewMode?: 'single' | 'continuous' | 'spread';
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function PageControls({ pdfState, onPageChangeRequest, viewMode = 'single', isSidebarOpen, onToggleSidebar }: PageControlsProps) {
  const { currentPage, totalPages, setPage, setScale, isLoading } = pdfState;
  const { bookId, bookmarksRefreshCounter, toggleBookmarkAction } = useBookStore();

  const [inputValue, setInputValue] = useState(currentPage.toString());
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    setInputValue(currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    if (bookId) {
      getBookmarksForBook(bookId).then(bookmarks => {
        setIsBookmarked(bookmarks.some(b => b.page_num === currentPage));
      });
    }
  }, [bookId, currentPage, bookmarksRefreshCounter]);

  const requestPage = (page: number) => {
    if (onPageChangeRequest) {
      onPageChangeRequest(page);
    } else {
      setPage(page);
    }
  };

  const handlePrev = () => {
    const step = (viewMode === 'spread' && currentPage === 2) ? 1 : (viewMode === 'spread' && currentPage > 2) ? 2 : 1;
    requestPage(currentPage - step);
  };
  
  const handleNext = () => {
    const step = (viewMode === 'spread' && currentPage > 1) ? 2 : 1;
    requestPage(currentPage + step);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = () => {
    const val = parseInt(inputValue, 10);
    if (!isNaN(val) && val >= 1 && val <= totalPages) {
      requestPage(val);
    } else {
      setInputValue(currentPage.toString()); // reset on invalid
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 3.0));
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));

  return (
    <div className="page-controls" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '1rem', 
      padding: '0.5rem 1rem', 
      background: 'var(--bs-panel)', 
      borderRadius: '8px',
      margin: '1rem 0'
    }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {onToggleSidebar && (
          <>
            <button 
              onClick={onToggleSidebar}
              className={`icon-btn ${!isSidebarOpen ? 'inactive' : ''}`}
              title="Toggle Sidebar"
              style={{ color: isSidebarOpen ? 'var(--bs-accent)' : 'var(--bs-muted)' }}
            >
              <PanelLeft size={20} />
            </button>
            <div style={{ width: '1px', height: '20px', background: 'var(--bs-border)', margin: '0 4px', alignSelf: 'center' }}></div>
          </>
        )}
        <button onClick={handlePrev} disabled={currentPage <= 1 || isLoading} className="icon-btn">
          <ChevronLeft size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input 
            type="text" 
            value={inputValue} 
            onChange={handleInputChange} 
            onKeyDown={handleKeyDown}
            onBlur={handleSubmit}
            disabled={isLoading || totalPages === 0}
            style={{ width: '50px', textAlign: 'center', background: 'var(--bs-surface)', color: 'var(--bs-fg)', border: '1px solid var(--bs-border)', borderRadius: '4px' }}
          />
          <span style={{ color: 'var(--bs-muted)' }}>/ {totalPages || 0}</span>
        </div>
        <button onClick={handleNext} disabled={currentPage >= totalPages || isLoading} className="icon-btn">
          <ChevronRight size={20} />
        </button>
      </div>

      <div style={{ flex: 1 }}></div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          onClick={() => toggleBookmarkAction(currentPage)} 
          disabled={isLoading || !bookId} 
          className="icon-btn" 
          title={isBookmarked ? "Remove Bookmark" : "Bookmark Page"}
          style={{ color: isBookmarked ? 'var(--bs-accent)' : 'inherit' }}
        >
          <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
        <button onClick={zoomOut} disabled={isLoading} className="icon-btn" title="Zoom Out">
          <ZoomOut size={20} />
        </button>
        <button onClick={zoomIn} disabled={isLoading} className="icon-btn" title="Zoom In">
          <ZoomIn size={20} />
        </button>
      </div>
    </div>
  );
}
