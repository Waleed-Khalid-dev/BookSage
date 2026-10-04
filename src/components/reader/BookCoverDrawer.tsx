import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePDFContext } from '../../hooks/usePDF';
import { GripHorizontal, X, BookOpen, ChevronDown, ExternalLink } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

interface BookCoverDrawerProps {
  currentBookTitle: string;
  currentPage: number;
  totalPages: number;
  currentChapter?: {
    num: number;
    title: string;
  } | null;
  onJumpToPage?: (page: number) => void;
}

const STORAGE_KEY_X = 'booksage-cover-drawer-x';
const AUTO_HIDE_DELAY = 4500; // 4.5 seconds

/**
 * Splits raw title into title and author if formatted as "Author - Title" or "Title - Author"
 */
function parseTitleAndAuthor(rawTitle: string): { title: string; author: string } {
  if (!rawTitle) return { title: 'Untitled Document', author: '' };
  const clean = rawTitle.replace(/\.pdf$/i, '').trim();
  
  if (clean.includes(' - ')) {
    const parts = clean.split(' - ').map(p => p.trim());
    if (parts.length >= 2) {
      // Common pattern: "Robert Greene - 48 Laws of Power"
      return { author: parts[0], title: parts.slice(1).join(' - ') };
    }
  }
  return { title: clean, author: '' };
}

export function BookCoverDrawer({
  currentBookTitle,
  currentPage,
  totalPages,
  currentChapter,
  onJumpToPage
}: BookCoverDrawerProps) {
  const { pdfDocument } = usePDFContext();
  
  // Visibility & Interaction states
  const [isCompactVisible, setIsCompactVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [posX, setPosX] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_X);
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    } catch {
      // fallback
    }
    return 80; // default initial left offset
  });

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; initialX: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const autoHideTimerRef = useRef<any>(null);
  const isHoveredRef = useRef(false);

  // Canvas refs for book cover rendering
  const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null);
  const expandedCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isCoverLoaded, setIsCoverLoaded] = useState(false);

  const { title, author } = parseTitleAndAuthor(currentBookTitle);

  // 1. Render Page 1 as the Cover Art
  useEffect(() => {
    let isMounted = true;
    let renderTaskThumb: pdfjsLib.RenderTask | null = null;
    let renderTaskLarge: pdfjsLib.RenderTask | null = null;

    const renderCovers = async () => {
      if (!pdfDocument) return;

      try {
        const page1 = await pdfDocument.getPage(1);
        if (!isMounted) return;

        // Render Compact Thumbnail (width ~40px)
        if (thumbnailCanvasRef.current) {
          const canvas = thumbnailCanvasRef.current;
          const viewport = page1.getViewport({ scale: 1 });
          const thumbScale = 44 / viewport.width;
          const scaledViewport = page1.getViewport({ scale: thumbScale });
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;
            renderTaskThumb = page1.render({ canvasContext: ctx, viewport: scaledViewport });
            await renderTaskThumb.promise;
          }
        }

        // Render Expanded Large Cover (width ~190px)
        if (expandedCanvasRef.current) {
          const canvas = expandedCanvasRef.current;
          const viewport = page1.getViewport({ scale: 1 });
          const largeScale = 190 / viewport.width;
          const scaledViewport = page1.getViewport({ scale: largeScale });
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;
            renderTaskLarge = page1.render({ canvasContext: ctx, viewport: scaledViewport });
            await renderTaskLarge.promise;
          }
        }

        if (isMounted) setIsCoverLoaded(true);
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.warn('Could not render cover thumbnail from page 1:', err);
        }
      }
    };

    renderCovers();

    return () => {
      isMounted = false;
      renderTaskThumb?.cancel();
      renderTaskLarge?.cancel();
    };
  }, [pdfDocument, isExpanded]);

  // 2. Auto-hide timer management
  const clearHideTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  }, []);

  const startHideTimer = useCallback(() => {
    clearHideTimer();
    // Do not auto-hide if expanded drawer is open or user is currently hovering/dragging
    if (isExpanded || isHoveredRef.current || isDragging) return;

    autoHideTimerRef.current = setTimeout(() => {
      if (!isHoveredRef.current && !isExpanded && !isDragging) {
        setIsCompactVisible(false);
      }
    }, AUTO_HIDE_DELAY);
  }, [clearHideTimer, isExpanded, isDragging]);

  // Restart timer on book title change or chapter change
  useEffect(() => {
    setIsCompactVisible(true);
    startHideTimer();
    return () => clearHideTimer();
  }, [currentBookTitle, currentChapter?.num, startHideTimer, clearHideTimer]);

  // When expanded drawer closes, restart compact auto-hide timer
  useEffect(() => {
    if (!isExpanded) {
      startHideTimer();
    } else {
      clearHideTimer();
    }
  }, [isExpanded, startHideTimer, clearHideTimer]);

  // 3. Horizontal Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag with primary mouse button
    if (e.button !== 0) return;
    
    // Don't drag if clicking buttons or cover thumbnail
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-no-drag]')) return;

    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      initialX: posX
    };

    clearHideTimer();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const rawX = dragStartRef.current.initialX + deltaX;

    // Bounds clamping based on parent container width
    const parentWidth = containerRef.current?.parentElement?.clientWidth || window.innerWidth;
    const popupWidth = popupRef.current?.offsetWidth || 340;
    const clampedX = Math.max(16, Math.min(parentWidth - popupWidth - 16, rawX));

    setPosX(clampedX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    dragStartRef.current = null;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // Persist position
    try {
      localStorage.setItem(STORAGE_KEY_X, posX.toString());
    } catch {
      // ignore
    }

    startHideTimer();
  };

  // 4. Click cover thumbnail to open expanded showcase
  const handleCoverClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearHideTimer();
    setIsExpanded(true);
  };

  const handleDismissExpanded = () => {
    setIsExpanded(false);
  };

  const progressPercent = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 45,
        overflow: 'hidden'
      }}
    >
      {/* ────────────────────────────────────────────────────────────────
          COMPACT RETRACTABLE POPUP
      ────────────────────────────────────────────────────────────────── */}
      <div
        ref={popupRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMouseEnter={() => {
          isHoveredRef.current = true;
          clearHideTimer();
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
          startHideTimer();
        }}
        style={{
          position: 'absolute',
          top: '12px',
          left: `${posX}px`,
          pointerEvents: isCompactVisible ? 'auto' : 'none',
          opacity: isCompactVisible ? 1 : 0,
          transform: isCompactVisible ? 'translateY(0)' : 'translateY(-65px)',
          transition: isDragging 
            ? 'opacity 0.2s ease' 
            : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 10px',
          background: 'var(--bs-surface, #1e1e24)',
          border: '1px solid var(--bs-border, rgba(255, 255, 255, 0.12))',
          borderRadius: '10px',
          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.45), 0 2px 6px -1px rgba(0, 0, 0, 0.2)',
          userSelect: 'none',
          cursor: isDragging ? 'grabbing' : 'default',
          backdropFilter: 'blur(10px)',
          maxWidth: '380px'
        }}
      >
        {/* Clickable Book Cover Thumbnail */}
        <div
          data-no-drag
          onClick={handleCoverClick}
          title="Click to expand book cover showcase"
          style={{
            width: '36px',
            height: '48px',
            borderRadius: '4px',
            overflow: 'hidden',
            flexShrink: 0,
            cursor: 'pointer',
            background: 'var(--bs-surface-hover, #282832)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.06)';
            e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 150, 136, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.35)';
          }}
        >
          <canvas
            ref={thumbnailCanvasRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: isCoverLoaded ? 'block' : 'none'
            }}
          />
          {!isCoverLoaded && (
            <BookOpen size={16} color="var(--bs-accent, #009688)" />
          )}
        </div>

        {/* Title and Author Info */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span
            style={{
              fontSize: '0.84rem',
              fontWeight: 600,
              color: 'var(--bs-heading, #ffffff)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2
            }}
            title={title}
          >
            {title}
          </span>
          {author && (
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--bs-text-secondary, #94a3b8)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginTop: '2px',
                lineHeight: 1.2
              }}
              title={author}
            >
              {author}
            </span>
          )}
        </div>

        {/* Center Drag Handle */}
        <div
          title="Drag horizontally to reposition"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px 4px',
            color: isDragging ? 'var(--bs-accent, #009688)' : 'var(--bs-text-secondary, #94a3b8)',
            cursor: isDragging ? 'grabbing' : 'grab',
            transition: 'color 0.15s ease'
          }}
        >
          <GripHorizontal size={18} />
        </div>

        {/* Dismiss Button */}
        <button
          data-no-drag
          onClick={() => setIsCompactVisible(false)}
          title="Hide book cover popup"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--bs-text-secondary, #94a3b8)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease, background 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--bs-heading, #ffffff)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--bs-text-secondary, #94a3b8)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <X size={15} />
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────────
          RE-SUMMON TAB (Pinned subtly to top edge when retracted)
      ────────────────────────────────────────────────────────────────── */}
      {!isCompactVisible && !isExpanded && (
        <button
          onClick={() => {
            setIsCompactVisible(true);
            startHideTimer();
          }}
          title="Show Book Cover popup"
          style={{
            position: 'absolute',
            top: 0,
            left: `${posX + 10}px`,
            pointerEvents: 'auto',
            background: 'var(--bs-surface, #1e1e24)',
            border: '1px solid var(--bs-border, rgba(255, 255, 255, 0.12))',
            borderTop: 'none',
            borderBottomLeftRadius: '6px',
            borderBottomRightRadius: '6px',
            padding: '3px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            color: 'var(--bs-text-secondary, #94a3b8)',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.25)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--bs-accent, #009688)';
            e.currentTarget.style.transform = 'translateY(2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--bs-text-secondary, #94a3b8)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <BookOpen size={12} />
          <span>Cover</span>
          <ChevronDown size={11} />
        </button>
      )}

      {/* ────────────────────────────────────────────────────────────────
          EXPANDED DOWNWARD SLIDING PANEL (Top Ceiling Showcase Drawer)
      ────────────────────────────────────────────────────────────────── */}
      {/* Blurred Backdrop */}
      <div
        onClick={handleDismissExpanded}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          opacity: isExpanded ? 1 : 0,
          pointerEvents: isExpanded ? 'auto' : 'none',
          transition: 'opacity 0.35s ease',
          zIndex: 50
        }}
      />

      {/* Downward Slide Drawer Card */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: isExpanded ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-100%)',
          transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: isExpanded ? 'auto' : 'none',
          zIndex: 55,
          width: 'min(560px, 92%)',
          background: 'var(--bs-surface, #1e1e24)',
          border: '1px solid var(--bs-border, rgba(255, 255, 255, 0.12))',
          borderTop: 'none',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px',
          boxShadow: '0 24px 48px -8px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* Drawer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 700,
                color: 'var(--bs-accent, #009688)',
                background: 'rgba(0, 150, 136, 0.12)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}
            >
              Book Showcase
            </span>
            {currentChapter && (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--bs-text-secondary, #94a3b8)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '300px'
                }}
              >
                Ch. {currentChapter.num}: {currentChapter.title}
              </span>
            )}
          </div>

          <button
            onClick={handleDismissExpanded}
            title="Close Showcase (Slide Up)"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--bs-text-secondary, #94a3b8)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--bs-heading, #ffffff)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--bs-text-secondary, #94a3b8)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content: Cover Art + Detailed Metadata */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          {/* Large High-Res Cover */}
          <div
            style={{
              width: '150px',
              height: '215px',
              borderRadius: '8px',
              overflow: 'hidden',
              flexShrink: 0,
              background: 'var(--bs-surface-hover, #282832)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 12px 28px rgba(0, 0, 0, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <canvas
              ref={expandedCanvasRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: isCoverLoaded ? 'block' : 'none'
              }}
            />
            {!isCoverLoaded && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={36} color="var(--bs-accent, #009688)" />
                <span style={{ fontSize: '0.72rem', color: 'var(--bs-text-secondary)' }}>Loading Cover...</span>
              </div>
            )}
          </div>

          {/* Details & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--bs-heading, #ffffff)',
                margin: '0 0 4px 0',
                lineHeight: 1.3
              }}
            >
              {title}
            </h3>

            {author && (
              <p
                style={{
                  fontSize: '0.88rem',
                  color: 'var(--bs-text-secondary, #94a3b8)',
                  margin: '0 0 14px 0'
                }}
              >
                by <strong style={{ color: 'var(--bs-text, #e2e8f0)' }}>{author}</strong>
              </p>
            )}

            {/* Reading Progress */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--bs-border, rgba(255, 255, 255, 0.08))',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--bs-text-secondary, #94a3b8)' }}>Reading Progress</span>
                <span style={{ color: 'var(--bs-accent, #009688)', fontWeight: 600 }}>{progressPercent}%</span>
              </div>
              
              {/* Progress bar */}
              <div
                style={{
                  height: '5px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: 'var(--bs-accent, #009688)',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--bs-text-secondary, #94a3b8)', marginTop: '6px' }}>
                <span>Page {currentPage} of {totalPages}</span>
                <span>{totalPages - currentPage} pages left</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', flexWrap: 'wrap' }}>
              {onJumpToPage && (
                <button
                  onClick={() => {
                    onJumpToPage(1);
                    handleDismissExpanded();
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: 'rgba(0, 150, 136, 0.12)',
                    border: '1px solid var(--bs-accent, #009688)',
                    color: 'var(--bs-accent, #009688)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bs-accent, #009688)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 150, 136, 0.12)';
                    e.currentTarget.style.color = 'var(--bs-accent, #009688)';
                  }}
                >
                  <ExternalLink size={13} />
                  Jump to Cover (Page 1)
                </button>
              )}

              <button
                onClick={handleDismissExpanded}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'var(--bs-surface-hover, #282832)',
                  border: '1px solid var(--bs-border, rgba(255, 255, 255, 0.12))',
                  color: 'var(--bs-text, #e2e8f0)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bs-surface-hover, #282832)';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
