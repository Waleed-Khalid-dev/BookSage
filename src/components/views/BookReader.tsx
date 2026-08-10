import React, { useState, useRef, useEffect } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { usePDF, PDFContext } from '../../hooks/usePDF';
import { useUiStore } from '../../stores/uiStore';
import { useChatStore } from '../../stores/chatStore';
import { useTextSelection, SelectionData } from '../../hooks/useTextSelection';
import { PDFCanvas } from '../reader/PDFCanvas';
import { PageControls } from '../reader/PageControls';
import { WordHighlighter } from '../reader/WordHighlighter';
import { ContinuousReader } from '../reader/ContinuousReader';
import { SpreadReader } from '../reader/SpreadReader';
import { HighlightToolbar } from '../reader/HighlightToolbar';
import { SidebarTabs } from '../reader/SidebarTabs';
import { DisplaySettings } from '../reader/DisplaySettings';
import { AudioToolbar } from '../reader/AudioToolbar';
import { SearchBar } from '../reader/SearchBar';
import { ReadingStats } from '../reader/ReadingStats';
import { CopilotPopup } from '../copilot/CopilotPopup';
import { ContextMenu as AiContextMenu } from '../copilot/ContextMenu';
import { CopilotSidebar } from '../copilot/CopilotSidebar';
import { Search, ChevronRight, PenTool, Undo, Redo, Eraser, Maximize, Minimize } from 'lucide-react';

const hexToRgbNormalized = (hex: string) => {
  const h = hex.replace('#', '');
  if (h.length !== 6) return { r: 1, g: 1, b: 1 };
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return { r, g, b };
};

export function BookReader() {
  const { 
    pdfPath, currentBookTitle, bookId, lastPage, setLastPage, incrementReadingStats,
    isDrawingMode, drawingColor, setIsDrawingMode, setDrawingColor, 
    undoDrawingAction, redoDrawingAction, undoStack, redoStack,
    drawingTool, setDrawingTool, eraserSize, setEraserSize, penSize, setPenSize,
    pdfTintColor, pdfTextColor, isWordHighlightingEnabled
  } = useBookStore();
  const { isTtsPlaying, setActiveSelection, setFocusedPanel } = useUiStore();
  const { setSelection: setCopilotSelection, openContextMenu, closeContextMenu } = useChatStore();
  const pdfState = usePDF(pdfPath, lastPage);
  const [viewMode, setViewMode] = useState<'single' | 'continuous' | 'spread'>('single');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [selection, setSelection] = useState<SelectionData | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAccumulator = useRef(0);
  const lastActivityTime = useRef(Date.now());
  const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  
  // Legacy highlight context menu (right-click on existing highlight)
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, highlightId: string } | null>(null);
  
  // Note Editor State
  const [editingNote, setEditingNote] = useState<{ highlightId: string, text: string } | null>(null);

  useTextSelection((sel) => {
    setSelection(sel);
    setActiveSelection(sel);
    // Phase 6: also feed selection into copilot store for popup/context-menu
    if (sel) {
      const domSel = window.getSelection();
      const range = domSel && domSel.rangeCount > 0 ? domSel.getRangeAt(0) : null;
      const rect = range ? range.getBoundingClientRect() : new DOMRect();
      setCopilotSelection({ text: sel.text, rect });
    } else {
      setCopilotSelection(null);
    }
  });

  // Sync current page back to store
  useEffect(() => {
    if (pdfState.currentPage > 0 && pdfState.currentPage !== lastPage) {
      setLastPage(pdfState.currentPage);
      incrementReadingStats(0, 1);
    }
  }, [pdfState.currentPage, lastPage, setLastPage, incrementReadingStats]);

  // Track reading time with idle detection
  useEffect(() => {
    if (!pdfPath) return;

    // Activity tracking to prevent infinite tracking if user walks away
    const updateActivity = () => {
      lastActivityTime.current = Date.now();
    };

    // Attach global listeners for common interactions
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity, true); // capture phase for any scroll container

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityTime.current;
      
      // Only increment time if user has been active within the timeout threshold
      if (timeSinceLastActivity < IDLE_TIMEOUT_MS) {
        incrementReadingStats(10, 0); // Add 10 seconds
      }
    }, 10000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity, true);
    };
  }, [pdfPath, incrementReadingStats]);
  // Focus Mode Handlers
  const toggleFocusMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => {
        console.error("Error attempting to enable full-screen mode:", e);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      setIsFocusMode(isFullscreen);
      if (isFullscreen) {
        setIsSidebarOpen(false); // Force sidebar closed on enter
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'F11') {
        e.preventDefault();
        toggleFocusMode();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global Customizable Shortcuts
  useEffect(() => {
    const handleGlobalShortcut = (e: CustomEvent) => {
      const action = e.detail.action;
      if (action === 'undo') {
        undoDrawingAction();
      } else if (action === 'redo') {
        redoDrawingAction();
      } else if (action === 'freehand') {
        if (!isDrawingMode || drawingTool === 'eraser') {
          setIsDrawingMode(true);
          setDrawingTool('pen');
        } else {
          setIsDrawingMode(false);
        }
      } else if (action === 'eraser') {
        if (!isDrawingMode || drawingTool === 'pen') {
          setIsDrawingMode(true);
          setDrawingTool('eraser');
        } else {
          setIsDrawingMode(false);
        }
      }
    };
    
    window.addEventListener('shortcut-triggered', handleGlobalShortcut as EventListener);
    return () => window.removeEventListener('shortcut-triggered', handleGlobalShortcut as EventListener);
  }, [undoDrawingAction, redoDrawingAction, isDrawingMode, drawingTool, setIsDrawingMode, setDrawingTool]);

  // Handle open sidebar from events (like clicking a sticky note)
  useEffect(() => {
    const handleOpenSidebar = () => {
      setIsSidebarOpen(true);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
      }
    };
    window.addEventListener('booksage-open-sidebar', handleOpenSidebar);
    return () => window.removeEventListener('booksage-open-sidebar', handleOpenSidebar);
  }, []);

  const handlePageChangeRequest = (newPage: number) => {
    // Block pagination in single page mode if TTS and word highlighting are active
    if (viewMode === 'single' && isTtsPlaying && isWordHighlightingEnabled) {
      return;
    }

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

  // Use a ref to store latest state so event listeners don't need to re-attach
  const readerStateRef = useRef({
    currentPage: pdfState.currentPage,
    totalPages: pdfState.totalPages,
    scale: pdfState.scale,
    setPage: pdfState.setPage,
    setScale: pdfState.setScale,
    viewMode,
    isTtsPlaying,
    isWordHighlightingEnabled,
  });

  useEffect(() => {
    readerStateRef.current = {
      currentPage: pdfState.currentPage,
      totalPages: pdfState.totalPages,
      scale: pdfState.scale,
      setPage: pdfState.setPage,
      setScale: pdfState.setScale,
      viewMode,
      isTtsPlaying,
      isWordHighlightingEnabled,
    };
  });

  // Keyboard & Click navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = readerStateRef.current;
      if (e.key === 'Escape') {
        setContextMenu(null);
        setEditingNote(null);
      }
      
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const step = (state.viewMode === 'spread' && state.currentPage > 1) ? 2 : 1;
        const newPage = state.currentPage + step;
        
        if (state.viewMode === 'single' && state.isTtsPlaying && state.isWordHighlightingEnabled) return;
        if (newPage >= 1 && newPage <= state.totalPages) {
          state.setPage(newPage);
          if (state.viewMode === 'continuous') {
            const el = document.getElementById(`pdf-page-${newPage}`);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const step = (state.viewMode === 'spread' && state.currentPage === 2) ? 1 : (state.viewMode === 'spread' && state.currentPage > 2) ? 2 : 1;
        const newPage = state.currentPage - step;
        
        if (state.viewMode === 'single' && state.isTtsPlaying && state.isWordHighlightingEnabled) return;
        if (newPage >= 1 && newPage <= state.totalPages) {
          state.setPage(newPage);
          if (state.viewMode === 'continuous') {
            const el = document.getElementById(`pdf-page-${newPage}`);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        }
      } else if (e.key === 'j') {
        // Vim down
        const scrollEl = scrollContainerRef.current;
        if (scrollEl) {
          scrollEl.scrollTop += 100;
        }
      } else if (e.key === 'k') {
        // Vim up
        const scrollEl = scrollContainerRef.current;
        if (scrollEl) {
          scrollEl.scrollTop -= 100;
        }
      } else if (e.ctrlKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          state.setScale(prev => Math.min(prev * 1.2, 3.0));
        } else if (e.key === '-') {
          e.preventDefault();
          state.setScale(prev => Math.max(prev / 1.2, 0.5));
        } else if (e.key === '0') {
          e.preventDefault();
          state.setScale(1.0);
        }
      }
    };
    
    const handleClick = () => {
      setContextMenu(null);
    };
    
    const handleSearchJump = (e: any) => {
      const state = readerStateRef.current;
      if (e.detail && e.detail.page) {
        if (state.viewMode === 'single' || state.viewMode === 'spread') {
          const newPage = e.detail.page;
          if (state.viewMode === 'single' && state.isTtsPlaying && state.isWordHighlightingEnabled) return;
          if (newPage >= 1 && newPage <= state.totalPages) {
            state.setPage(newPage);
          }
          
          setTimeout(() => {
            let attempts = 0;
            const tryScroll = () => {
              const activeHighlight = document.getElementById('active-search-highlight');
              if (activeHighlight) {
                activeHighlight.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
              } else if (attempts < 50) {
                attempts++;
                setTimeout(tryScroll, 100);
              } else {
                // Fallback if highlight element isn't found
                const scrollEl = scrollContainerRef.current;
                if (scrollEl && e.detail.rect) {
                  const cropScale = 1 + (useBookStore.getState().pdfMarginCrop || 0) / 100;
                  const visualScale = readerStateRef.current.scale * cropScale;
                  
                  const top = e.detail.rect.top * visualScale;
                  let left = e.detail.rect.left * visualScale;
                  
                  if (state.viewMode === 'spread') {
                    const isRightPage = newPage % 2 !== 0; 
                    if (isRightPage) {
                      const leftPageEl = scrollEl.querySelector('.spread-reader > div:first-child') as HTMLElement;
                      if (leftPageEl) {
                         left += leftPageEl.offsetWidth;
                      }
                    }
                  }
                  
                  scrollEl.scrollTo({ 
                    top: Math.max(0, top - 150), 
                    left: Math.max(0, left - 150), 
                    behavior: 'smooth' 
                  });
                }
              }
            };
            tryScroll();
          }, 50);
        } else if (state.viewMode === 'continuous') {
          // For continuous, we trigger the native scroll event handled by ContinuousReader
          window.dispatchEvent(new CustomEvent('continuous-jump', { detail: { page: e.detail.page, rect: e.detail.rect } }));
        }
      }
    };
    
    const handleBookSageJump = (e: any) => {
      const state = readerStateRef.current;
      if (typeof e.detail === 'number') {
        const page = e.detail;
        if (state.viewMode === 'single' || state.viewMode === 'spread') {
          if (state.viewMode === 'single' && state.isTtsPlaying && state.isWordHighlightingEnabled) return;
          if (page >= 1 && page <= state.totalPages) {
            state.setPage(page);
          }
        } else if (state.viewMode === 'continuous') {
          window.dispatchEvent(new CustomEvent('continuous-jump', { detail: { page } }));
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);
    window.addEventListener('search-jump', handleSearchJump);
    window.addEventListener('booksage-jump-page', handleBookSageJump);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('search-jump', handleSearchJump);
      window.removeEventListener('booksage-jump-page', handleBookSageJump);
    };
  }, []);

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
      // Block scrolling to other pages if TTS word highlighting is active
      if (isTtsPlaying && isWordHighlightingEnabled) {
        return;
      }

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

  const handleEditNoteRequest = async () => {
    if (contextMenu) {
      const { highlightId } = contextMenu;
      setContextMenu(null);
      
      const { getHighlightsForBook } = await import('../../services/dbService');
      const { bookId } = useBookStore.getState();
      if (bookId) {
        const hls = await getHighlightsForBook(bookId);
        const hl = hls.find(h => h.id === highlightId);
        if (hl) {
          setEditingNote({ highlightId, text: hl.note || '' });
        }
      }
    }
  };

  const handleSaveNote = async () => {
    if (editingNote) {
      const { upsertHighlight, getHighlightsForBook } = await import('../../services/dbService');
      const { bookId, triggerHighlightsRefresh } = useBookStore.getState();
      if (bookId) {
        const hls = await getHighlightsForBook(bookId);
        const hl = hls.find(h => h.id === editingNote.highlightId);
        if (hl) {
          await upsertHighlight({ ...hl, note: editingNote.text });
          triggerHighlightsRefresh();
        }
      }
      setEditingNote(null);
    }
  };

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

  return (
    <PDFContext.Provider value={pdfState}>
      {pdfTintColor && pdfTextColor && (
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <filter id="pdf-duotone">
            <feColorMatrix type="matrix" values={`
              ${(hexToRgbNormalized(pdfTintColor).r - hexToRgbNormalized(pdfTextColor).r) * 0.2126} ${(hexToRgbNormalized(pdfTintColor).r - hexToRgbNormalized(pdfTextColor).r) * 0.7152} ${(hexToRgbNormalized(pdfTintColor).r - hexToRgbNormalized(pdfTextColor).r) * 0.0722} 0 ${hexToRgbNormalized(pdfTextColor).r}
              ${(hexToRgbNormalized(pdfTintColor).g - hexToRgbNormalized(pdfTextColor).g) * 0.2126} ${(hexToRgbNormalized(pdfTintColor).g - hexToRgbNormalized(pdfTextColor).g) * 0.7152} ${(hexToRgbNormalized(pdfTintColor).g - hexToRgbNormalized(pdfTextColor).g) * 0.0722} 0 ${hexToRgbNormalized(pdfTextColor).g}
              ${(hexToRgbNormalized(pdfTintColor).b - hexToRgbNormalized(pdfTextColor).b) * 0.2126} ${(hexToRgbNormalized(pdfTintColor).b - hexToRgbNormalized(pdfTextColor).b) * 0.7152} ${(hexToRgbNormalized(pdfTintColor).b - hexToRgbNormalized(pdfTextColor).b) * 0.0722} 0 ${hexToRgbNormalized(pdfTextColor).b}
              0 0 0 1 0
            `} />
          </filter>
        </svg>
      )}
      
      <div 
        className="view-container book-reader" 
        style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}
        onMouseEnter={() => setFocusedPanel('reader')}
        onClick={() => setFocusedPanel('reader')}
      >
        <SearchBar />
      
      {!isFocusMode && (
        <header className="view-header" style={{ padding: '1rem', borderBottom: '1px solid var(--bs-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ color: 'var(--bs-heading)', margin: 0, maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={currentBookTitle}>{currentBookTitle}</h2>
        
        <div className="view-toggles" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
          <button 
            className={`btn-toggle ${viewMode === 'spread' ? 'active' : ''}`}
            onClick={() => setViewMode('spread')}
            style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', background: viewMode === 'spread' ? 'var(--bs-accent)' : 'transparent', color: viewMode === 'spread' ? 'white' : 'var(--bs-text)', border: '1px solid var(--bs-border)', cursor: 'pointer' }}
          >
            Spread
          </button>
          
          <div style={{ width: '1px', height: '24px', background: 'var(--bs-border)' }}></div>
          
          {/* Drawing Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', background: isDrawingMode ? 'var(--bs-surface-hover)' : 'transparent', borderRadius: '4px' }}>
            <button
              onClick={() => {
                if (isDrawingMode && drawingTool === 'pen') {
                  setIsDrawingMode(false);
                } else {
                  setIsDrawingMode(true);
                  setDrawingTool('pen');
                }
              }}
              style={{
                background: isDrawingMode && drawingTool === 'pen' ? 'var(--bs-surface)' : 'transparent', 
                border: 'none', cursor: 'pointer', borderRadius: '4px', padding: '4px',
                color: isDrawingMode && drawingTool === 'pen' ? 'var(--bs-accent)' : 'var(--bs-text)',
                display: 'flex', alignItems: 'center'
              }}
              title="Freehand Drawing (Pen)"
            >
              <PenTool size={18} />
            </button>
            <button
              onClick={() => {
                if (isDrawingMode && drawingTool === 'eraser') {
                  setIsDrawingMode(false);
                } else {
                  setIsDrawingMode(true);
                  setDrawingTool('eraser');
                }
              }}
              style={{
                background: isDrawingMode && drawingTool === 'eraser' ? 'var(--bs-surface)' : 'transparent', 
                border: 'none', cursor: 'pointer', borderRadius: '4px', padding: '4px',
                color: isDrawingMode && drawingTool === 'eraser' ? 'var(--bs-accent)' : 'var(--bs-text)',
                display: 'flex', alignItems: 'center'
              }}
              title="Eraser"
            >
              <Eraser size={18} />
            </button>
            {isDrawingMode && (
              <>
                {drawingTool === 'pen' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
                    <input 
                      type="color" 
                      value={drawingColor} 
                      onChange={(e) => setDrawingColor(e.target.value)}
                      style={{ width: '24px', height: '24px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                      title="Pen Color"
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--bs-text-secondary)' }}>Size:</span>
                      <input 
                        type="range" min="1" max="10" step="1" 
                        value={penSize} 
                        onChange={(e) => setPenSize(Number(e.target.value))}
                        style={{ width: '40px' }}
                        title="Pen Size"
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--bs-text-secondary)' }}>Size:</span>
                    <input 
                      type="range" min="5" max="50" step="5" 
                      value={eraserSize} 
                      onChange={(e) => setEraserSize(Number(e.target.value))}
                      style={{ width: '60px' }}
                    />
                  </div>
                )}
                <div style={{ width: '1px', height: '16px', background: 'var(--bs-border)', margin: '0 4px' }}></div>
                <button
                  onClick={undoDrawingAction}
                  disabled={undoStack.length === 0}
                  style={{
                    background: 'transparent', border: 'none', cursor: undoStack.length === 0 ? 'default' : 'pointer',
                    color: undoStack.length === 0 ? 'var(--bs-text-secondary)' : 'var(--bs-text)', display: 'flex', alignItems: 'center', padding: '4px'
                  }}
                  title="Undo Last Action"
                >
                  <Undo size={18} />
                </button>
                <button
                  onClick={redoDrawingAction}
                  disabled={redoStack.length === 0}
                  style={{
                    background: 'transparent', border: 'none', cursor: redoStack.length === 0 ? 'default' : 'pointer',
                    color: redoStack.length === 0 ? 'var(--bs-text-secondary)' : 'var(--bs-text)', display: 'flex', alignItems: 'center', padding: '4px'
                  }}
                  title="Redo Action"
                >
                  <Redo size={18} />
                </button>
              </>
            )}
          </div>
          
          <div style={{ width: '1px', height: '24px', background: 'var(--bs-border)' }}></div>
          <button 
            className="icon-btn" 
            onClick={() => window.dispatchEvent(new Event('open-search'))}
            title="Search (Ctrl+F)"
          >
            <Search size={20} />
          </button>
          <button 
            className="icon-btn" 
            onClick={toggleFocusMode}
            title="Focus Mode (F11)"
          >
            <Maximize size={20} />
          </button>
          <ReadingStats />
          <AudioToolbar />
          <DisplaySettings />
        </div>
      </header>
      )}
      
      <PageControls 
        pdfState={pdfState} 
        onPageChangeRequest={handlePageChangeRequest} 
        viewMode={viewMode}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          
          {/* Left annotation sidebar */}
          <div style={{
            width: isSidebarOpen ? '300px' : '0px',
            minWidth: isSidebarOpen ? '300px' : '0px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            borderRight: isSidebarOpen ? '1px solid var(--bs-border)' : 'none',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <SidebarTabs />
          </div>

          {!isSidebarOpen && !isFocusMode && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'var(--bs-surface)',
                border: '1px solid var(--bs-border)',
                borderLeft: 'none',
                borderRadius: '0 8px 8px 0',
                padding: '16px 4px',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--bs-muted)'
              }}
              title="Show Sidebar"
            >
              <ChevronRight size={16} />
            </button>
          )}
          
          {/* PDF scroll area */}
          <div 
            ref={scrollContainerRef}
            className="pdf-scroll-container" 
            onWheel={handleWheel}
            onContextMenu={(e) => {
              // If right-clicking on an existing highlight the highlight handler fires first;
              // if not, open the AI context menu
              if (!contextMenu) {
                e.preventDefault();
                openContextMenu(e.clientX, e.clientY);
              }
            }}
            style={{ flex: 1, overflow: 'auto', padding: '1rem', background: 'var(--bs-bg)', overflowAnchor: 'none', position: 'relative' }}
          >
            <div 
              className="zoom-target" 
              style={{ 
                width: 'fit-content',
                margin: '0 auto',
                flexShrink: 0,
                textAlign: 'left'
              }}
            >
              {viewMode === 'single' && (
                <PDFCanvas pageNumber={pdfState.currentPage} onContextMenuRequest={handleContextMenuRequest} />
              )}
              {viewMode === 'continuous' && (
                <ContinuousReader onContextMenuRequest={handleContextMenuRequest} />
              )}
              {viewMode === 'spread' && (
                <SpreadReader onContextMenuRequest={handleContextMenuRequest} />
              )}
              {viewMode === 'single' && <WordHighlighter />}
            </div>
          </div>

          {/* Right: AI Copilot Sidebar */}
          <CopilotSidebar
            bookId={bookId}
            bookTitle={currentBookTitle}
            contextText={`You are helping a reader who is reading "${currentBookTitle}". Answer their questions about the book.`}
          />
        </div>
      
      <HighlightToolbar selection={selection} onHighlightSaved={() => setSelection(null)} />

      {/* Phase 6: AI Copilot overlays */}
      <CopilotPopup />
      <AiContextMenu />

      {/* Reading Progress Bar */}
      <div style={{ height: '4px', width: '100%', background: 'var(--bs-border)' }}>
        <div 
          style={{ 
            height: '100%', 
            width: `${pdfState.totalPages > 0 ? (pdfState.currentPage / pdfState.totalPages) * 100 : 0}%`, 
            background: 'var(--bs-accent)',
            transition: 'width 0.3s ease'
          }} 
        />
      </div>

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
            onClick={handleEditNoteRequest}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--bs-text)',
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
            <span>📝</span> Edit Note
          </button>
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

      {editingNote && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--bs-surface)',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          zIndex: 10001,
          width: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h3 style={{ margin: 0, color: 'var(--bs-heading)' }}>Edit Note</h3>
          <textarea 
            value={editingNote.text}
            onChange={(e) => setEditingNote({ ...editingNote, text: e.target.value })}
            autoFocus
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '0.5rem',
              background: 'var(--bs-bg)',
              color: 'var(--bs-text)',
              border: '1px solid var(--bs-border)',
              borderRadius: '4px',
              resize: 'vertical'
            }}
            placeholder="Write your note here..."
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button 
              onClick={() => setEditingNote(null)}
              style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--bs-border)', color: 'var(--bs-text)', borderRadius: '4px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveNote}
              style={{ padding: '0.5rem 1rem', background: 'var(--bs-accent)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      {editingNote && (
        <div 
          onClick={() => setEditingNote(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 10000
          }} 
        />
      )}

      {isFocusMode && (
        <button
          onClick={toggleFocusMode}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'var(--bs-surface)',
            border: '1px solid var(--bs-border)',
            borderRadius: '50%',
            padding: '8px',
            color: 'var(--bs-text)',
            cursor: 'pointer',
            zIndex: 1000,
            opacity: 0.3,
            transition: 'opacity 0.2s, background-color 0.2s',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.backgroundColor = 'var(--bs-surface-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.3';
            e.currentTarget.style.backgroundColor = 'var(--bs-surface)';
          }}
          title="Exit Focus Mode (F11 or Esc)"
        >
          <Minimize size={20} />
        </button>
      )}
      
      {/* Floating Action Button for Drawing */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        right: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        zIndex: 100
      }}>
        {isDrawingMode && (
          <>
            <div style={{
              background: 'var(--bs-surface)',
              border: '1px solid var(--bs-border)',
              borderRadius: '24px',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              marginBottom: '8px'
            }}>
              <button
                onClick={() => setDrawingTool('pen')}
                style={{
                  background: drawingTool === 'pen' ? 'var(--bs-surface-hover)' : 'transparent',
                  border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  color: drawingTool === 'pen' ? 'var(--bs-accent)' : 'var(--bs-text)'
                }}
                title="Pen Tool"
              >
                <PenTool size={18} />
              </button>
              <button
                onClick={() => setDrawingTool('eraser')}
                style={{
                  background: drawingTool === 'eraser' ? 'var(--bs-surface-hover)' : 'transparent',
                  border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  color: drawingTool === 'eraser' ? 'var(--bs-accent)' : 'var(--bs-text)'
                }}
                title="Eraser Tool"
              >
                <Eraser size={18} />
              </button>
              
              <div style={{ width: '24px', height: '1px', background: 'var(--bs-border)' }}></div>
              
              {drawingTool === 'pen' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="color" 
                    value={drawingColor} 
                    onChange={(e) => setDrawingColor(e.target.value)}
                    style={{ width: '24px', height: '24px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                    title="Pen Color"
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--bs-text-secondary)' }}>{penSize}px</span>
                    <input 
                      type="range" min="1" max="10" step="1" 
                      value={penSize} 
                      onChange={(e) => setPenSize(Number(e.target.value))}
                      style={{ width: '40px', transform: 'rotate(-90deg)', margin: '16px 0' }}
                      title="Pen Size"
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--bs-text-secondary)' }}>{eraserSize}px</span>
                  <input 
                    type="range" min="5" max="50" step="5" 
                    value={eraserSize} 
                    onChange={(e) => setEraserSize(Number(e.target.value))}
                    style={{ width: '60px', transform: 'rotate(-90deg)', margin: '24px 0' }}
                    title="Eraser Size"
                  />
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
              <button
                onClick={redoDrawingAction}
                disabled={redoStack.length === 0}
                style={{
                  background: 'var(--bs-surface)',
                  border: '1px solid var(--bs-border)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  cursor: redoStack.length === 0 ? 'default' : 'pointer',
                  color: redoStack.length === 0 ? 'var(--bs-text-secondary)' : 'var(--bs-text)',
                }}
                title="Redo Action"
              >
                <Redo size={20} />
              </button>
              <button
                onClick={undoDrawingAction}
                disabled={undoStack.length === 0}
                style={{
                  background: 'var(--bs-surface)',
                  border: '1px solid var(--bs-border)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  cursor: undoStack.length === 0 ? 'default' : 'pointer',
                  color: undoStack.length === 0 ? 'var(--bs-text-secondary)' : 'var(--bs-text)',
                }}
                title="Undo Last Action"
              >
                <Undo size={20} />
              </button>
            </div>
          </>
        )}
        <button
          onClick={() => {
            if (isDrawingMode) {
              setIsDrawingMode(false);
            } else {
              setIsDrawingMode(true);
              setDrawingTool('pen');
            }
          }}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: isDrawingMode ? 'var(--bs-accent)' : 'var(--bs-surface)',
            color: isDrawingMode ? 'white' : 'var(--bs-text)',
            border: isDrawingMode ? 'none' : '1px solid var(--bs-border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title={isDrawingMode ? 'Exit Drawing Mode' : 'Enter Drawing Mode'}
        >
          {isDrawingMode && drawingTool === 'eraser' ? <Eraser size={24} /> : <PenTool size={24} />}
        </button>
      </div>

      </div>
    </PDFContext.Provider>
  );
}
