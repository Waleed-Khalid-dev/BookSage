import React, { useState, useRef, useEffect } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { usePDF, PDFContext } from '../../hooks/usePDF';
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

  // Keep references for event listeners without triggering re-renders
  const setScaleRef = useRef(pdfState.setScale);
  const previousScaleRef = useRef(pdfState.scale);
  const anchorRef = useRef({ x: 0, y: 0, mouseX: 0, mouseY: 0 });
  
  // Helper to record the anchor point exactly where the mouse is
  const recordAnchor = (clientX: number, clientY: number, scrollEl: HTMLElement) => {
    // We target the explicit zoom-target wrapper to ensure contentRect is accurate
    const contentEl = scrollEl.firstElementChild as HTMLElement;
    if (!contentEl) return;

    const scrollRect = scrollEl.getBoundingClientRect();
    const contentRect = contentEl.getBoundingClientRect();

    // Mouse position relative to the scroll container's viewport
    anchorRef.current.mouseX = clientX - scrollRect.left;
    anchorRef.current.mouseY = clientY - scrollRect.top;

    // Mouse position relative to the content element
    const contentX = clientX - contentRect.left;
    const contentY = clientY - contentRect.top;

    // Normalized coordinates (0 to 1) inside the content element
    anchorRef.current.x = contentX / contentRect.width;
    anchorRef.current.y = contentY / contentRect.height;
  };

  useEffect(() => {
    setScaleRef.current = pdfState.setScale;
    previousScaleRef.current = pdfState.scale;
  }, [pdfState.setScale, pdfState.scale]);

  // Native wheel handler for pinch-to-zoom (requires passive: false)
  useEffect(() => {
    const nativeWheelHandler = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        
        const scrollEl = scrollContainerRef.current;
        if (scrollEl) {
          recordAnchor(e.clientX, e.clientY, scrollEl);
        }
        
        const zoomFactor = Math.exp(-e.deltaY * 0.01);
        setScaleRef.current(prev => Math.min(Math.max(prev * zoomFactor, 0.5), 3.0));
      }
    };

    document.addEventListener('wheel', nativeWheelHandler, { passive: false });
    return () => document.removeEventListener('wheel', nativeWheelHandler);
  }, []);
  
  React.useLayoutEffect(() => {
    if (previousScaleRef.current !== pdfState.scale) {
      const scrollEl = scrollContainerRef.current;
      if (scrollEl) {
        const contentEl = scrollEl.firstElementChild as HTMLElement;
        if (contentEl) {
          const contentRect = contentEl.getBoundingClientRect();
          const scrollRect = scrollEl.getBoundingClientRect();
          
          // Where the anchor point SHOULD be now that the layout has changed
          const newContentX = anchorRef.current.x * contentRect.width;
          const newContentY = anchorRef.current.y * contentRect.height;
          
          // Where the mouse cursor CURRENTLY is over the new layout before we scroll
          const currentMouseXOnContent = anchorRef.current.mouseX - (contentRect.left - scrollRect.left);
          const currentMouseYOnContent = anchorRef.current.mouseY - (contentRect.top - scrollRect.top);
          
          // The distance we need to scroll to put the anchor back under the mouse
          const deltaX = newContentX - currentMouseXOnContent;
          const deltaY = newContentY - currentMouseYOnContent;
          
          scrollEl.scrollLeft += deltaX;
          scrollEl.scrollTop += deltaY;
        }
      }
      // Update the previous scale after adjustments
      previousScaleRef.current = pdfState.scale;
    }
  }, [pdfState.scale, viewMode]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Record mouse X/Y relative to the scroll container for perfect zoom anchoring
    const container = e.currentTarget;
    recordAnchor(e.clientX, e.clientY, container);
    
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
        style={{ flex: 1, overflow: 'auto', padding: '1rem', background: 'var(--bs-bg)', overflowAnchor: 'none' }}
      >
        <div 
          className="zoom-target" 
          style={{ 
            width: 'fit-content', // Shrink-wraps the content for accurate contentRect math
            margin: '0 auto', // Safe centering that never cuts off left edge
            flexShrink: 0,
            textAlign: 'left' // Reset text alignment for inner content
          }}
        >
          <PDFContext.Provider value={pdfState}>
            {viewMode === 'single' ? (
              <PDFCanvas pageNumber={pdfState.currentPage} onContextMenuRequest={handleContextMenuRequest} />
            ) : (
              <ContinuousReader onContextMenuRequest={handleContextMenuRequest} />
            )}
          </PDFContext.Provider>
          {viewMode === 'single' && <WordHighlighter />}
        </div>
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
