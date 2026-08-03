import { useState, useRef, useEffect } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { usePDF } from '../../hooks/usePDF';
import { useTextSelection, SelectionData } from '../../hooks/useTextSelection';
import { PDFCanvas } from '../reader/PDFCanvas';
import { PageControls } from '../reader/PageControls';
import { WordHighlighter } from '../reader/WordHighlighter';
import { ContinuousReader } from '../reader/ContinuousReader';
import { HighlightToolbar } from '../reader/HighlightToolbar';

export function BookReader() {
  const { pdfPath, currentBookTitle } = useBookStore();
  const pdfState = usePDF(pdfPath);
  const [viewMode, setViewMode] = useState<'single' | 'continuous'>('single');
  const [selection, setSelection] = useState<SelectionData | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAccumulator = useRef(0);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, highlightId: string } | null>(null);

  useTextSelection((sel) => {
    setSelection(sel);
    if (sel) {
      // In Phase 6, we'll trigger Copilot popup here alongside highlights
    }
  });

  if (!pdfPath) {
    return (
      <div className="view-container empty-state" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>No Book Loaded</h2>
          <p style={{ color: 'var(--bs-muted)' }}>Select a book from the Library to start reading.</p>
        </div>
      </div>
    );
  }

  const handlePageChangeRequest = (newPage: number) => {
    if (newPage >= 1 && newPage <= pdfState.totalPages) {
      pdfState.setPage(newPage);
      if (viewMode === 'continuous') {
        const el = document.getElementById(`pdf-page-${newPage}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  // Keyboard & Click navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
      
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handlePageChangeRequest(pdfState.currentPage + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePageChangeRequest(pdfState.currentPage - 1);
      } else if (e.ctrlKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          pdfState.setScale(prev => Math.min(prev * 1.2, 3.0));
        } else if (e.key === '-') {
          e.preventDefault();
          pdfState.setScale(prev => Math.max(prev / 1.2, 0.5));
        } else if (e.key === '0') {
          e.preventDefault();
          pdfState.setScale(1.0);
        }
      }
    };
    
    const handleClick = () => setContextMenu(null);
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [pdfState.currentPage, pdfState.totalPages, viewMode, pdfState.setScale]);

  // Use a ref to store the latest setScale to avoid re-adding the wheel listener on every render
  const setScaleRef = useRef(pdfState.setScale);
  useEffect(() => {
    setScaleRef.current = pdfState.setScale;
  }, [pdfState.setScale]);

  // Native wheel handler for pinch-to-zoom (requires passive: false)
  useEffect(() => {
    const nativeWheelHandler = (e: WheelEvent) => {
      if (e.ctrlKey) {
        // Prevent default browser zoom
        e.preventDefault();
        // Standard exponential zoom formula. Trackpad pinch deltaY is usually smaller but frequent.
        // We use a more aggressive multiplier so small pinches result in visible zoom
        const zoomFactor = Math.exp(-e.deltaY * 0.01);
        setScaleRef.current(prev => Math.min(Math.max(prev * zoomFactor, 0.5), 3.0));
      }
    };

    document.addEventListener('wheel', nativeWheelHandler, { passive: false });
    return () => document.removeEventListener('wheel', nativeWheelHandler);
  }, []);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Ignore Ctrl+Wheel here, handled by native event
    if (e.ctrlKey) return;

    // Single page mode scroll to turn pages
    if (viewMode === 'single') {
      const container = e.currentTarget;
      // Allow 2px tolerance for float precision
      const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 2;
      const atTop = container.scrollTop <= 2;

      if ((e.deltaY > 0 && atBottom) || (e.deltaY < 0 && atTop)) {
        scrollAccumulator.current += e.deltaY;

        // Require 250px of accumulated deliberate scroll before turning page
        if (scrollAccumulator.current > 250) {
          if (pdfState.currentPage < pdfState.totalPages) {
            pdfState.setPage(pdfState.currentPage + 1);
            scrollAccumulator.current = 0;
          }
        } else if (scrollAccumulator.current < -250) {
          if (pdfState.currentPage > 1) {
            pdfState.setPage(pdfState.currentPage - 1);
            scrollAccumulator.current = 0;
          }
        }
      } else {
        // Reset if they scroll away from boundaries
        scrollAccumulator.current = 0;
      }
    }
  };

  const handleContextMenuRequest = (x: number, y: number, highlightId: string) => {
    setContextMenu({ x, y, highlightId });
  };

  const handleDeleteHighlight = () => {
    if (contextMenu) {
      useBookStore.getState().deleteHighlightAction(contextMenu.highlightId);
      setContextMenu(null);
    }
  };

  return (
    <div className="view-container book-reader" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <header className="view-header" style={{ padding: '1rem', borderBottom: '1px solid var(--bs-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: 'var(--bs-heading)', margin: 0 }}>{currentBookTitle}</h2>
        
        <div className="view-toggles" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            className={`btn-toggle ${viewMode === 'single' ? 'active' : ''}`}
            onClick={() => setViewMode('single')}
            style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', background: viewMode === 'single' ? 'var(--bs-accent)' : 'transparent', color: viewMode === 'single' ? 'white' : 'var(--bs-text)', border: '1px solid var(--bs-border)', cursor: 'pointer' }}
          >
            Single Page
          </button>
          <button 
            className={`btn-toggle ${viewMode === 'continuous' ? 'active' : ''}`}
            onClick={() => setViewMode('continuous')}
            style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', background: viewMode === 'continuous' ? 'var(--bs-accent)' : 'transparent', color: viewMode === 'continuous' ? 'white' : 'var(--bs-text)', border: '1px solid var(--bs-border)', cursor: 'pointer' }}
          >
            Continuous
          </button>
        </div>
      </header>
      
      <PageControls pdfState={pdfState} onPageChangeRequest={handlePageChangeRequest} />

      <div 
        ref={scrollContainerRef}
        className="pdf-scroll-container" 
        onWheel={handleWheel}
        style={{ flex: 1, overflow: 'auto', textAlign: 'center', padding: '1rem', background: 'var(--bs-bg)' }}
      >
        {viewMode === 'single' ? (
          <PDFCanvas pdfState={pdfState} pageNumber={pdfState.currentPage} onContextMenuRequest={handleContextMenuRequest} />
        ) : (
          <ContinuousReader pdfState={pdfState} onContextMenuRequest={handleContextMenuRequest} />
        )}
        {viewMode === 'single' && <WordHighlighter />}
      </div>
      
      <HighlightToolbar selection={selection} onHighlightSaved={() => setSelection(null)} />

      {contextMenu && (
        <div 
          style={{
            position: 'fixed',
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            backgroundColor: 'var(--bs-surface)',
            border: '1px solid var(--bs-border)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            borderRadius: '4px',
            padding: '4px',
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={handleDeleteHighlight}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--bs-danger, #ef4444)',
              cursor: 'pointer',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 500,
              width: '100%',
              textAlign: 'left'
            }}
          >
            <span>🗑️</span> Remove Highlight
          </button>
        </div>
      )}
    </div>
  );
}
