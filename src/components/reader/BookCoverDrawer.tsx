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
  isSidebarOpen?: boolean;
  onJumpToPage?: (page: number) => void;
}

const STORAGE_KEY_X = 'booksage-cover-drawer-x';
const AUTO_HIDE_DELAY = 4500; // 4.5 seconds
const MODAL_WIDTH = 375; // EXACT equal width
const COMPACT_HEIGHT = 56;
const EXPANDED_HEIGHT = 245;

/**
 * Robust title & author parser:
 * Handles "Robert Greene - 48 Laws of Power -- Robert Greene"
 * Splits delimiters, detects author names, and strips author redundancy from title.
 */
function parseTitleAndAuthor(rawTitle: string): { title: string; author: string } {
  if (!rawTitle) return { title: 'Untitled Document', author: '' };
  let clean = rawTitle.replace(/\.pdf$/i, '').trim();

  // Split by common delimiters: " -- ", " — ", " – ", " - "
  const tokens = clean
    .split(/\s*(?:--|—|–|-)\s*/)
    .map(t => t.trim())
    .filter(Boolean);

  if (tokens.length >= 2) {
    const authorRegex = /^[A-Z][a-zA-Z.'-]+\s+[A-Z][a-zA-Z.'-]+$/;
    let detectedAuthor = '';
    const nonAuthorTokens: string[] = [];

    for (const token of tokens) {
      if (!detectedAuthor && authorRegex.test(token) && !/^\d/.test(token) && !/^(The|A|An|How|Why|What|Who|Where|When|Handbook|Guide|Principles)\b/i.test(token)) {
        detectedAuthor = token;
      } else if (token !== detectedAuthor) {
        nonAuthorTokens.push(token);
      }
    }

    let finalTitle = nonAuthorTokens.join(' - ');
    if (!finalTitle && tokens.length > 0) {
      finalTitle = tokens[0];
    }

    // Strip leading or trailing author name if it lingered
    if (detectedAuthor) {
      finalTitle = finalTitle
        .replace(new RegExp(`^${detectedAuthor}\\s*[-–—:]*\\s*`, 'i'), '')
        .replace(new RegExp(`\\s*[-–—:]*\\s*${detectedAuthor}$`, 'i'), '')
        .trim();
    }

    return {
      title: finalTitle || clean,
      author: detectedAuthor
    };
  }

  return { title: clean, author: '' };
}

export function BookCoverDrawer({
  currentBookTitle,
  currentPage,
  totalPages,
  currentChapter,
  isSidebarOpen = false,
  onJumpToPage
}: BookCoverDrawerProps) {
  const { pdfDocument } = usePDFContext();
  
  // Visibility & Interaction states
  const [isCompactVisible, setIsCompactVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Initial X position (ensures it starts to the right of an open 300px sidebar)
  const [posX, setPosX] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_X);
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0) {
          return isSidebarOpen ? Math.max(320, parsed) : parsed;
        }
      }
    } catch {
      // fallback
    }
    return isSidebarOpen ? 340 : 80;
  });

  // Keep position clamped if sidebar opens/closes
  useEffect(() => {
    if (isSidebarOpen) {
      setPosX(prev => Math.max(316, prev));
    }
  }, [isSidebarOpen]);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; initialX: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const autoHideTimerRef = useRef<any>(null);
  const isHoveredRef = useRef(false);

  // Canvas refs for book cover rendering
  const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null);
  const expandedCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isCoverLoaded, setIsCoverLoaded] = useState(false);

  const { title, author } = parseTitleAndAuthor(currentBookTitle);

  // 1. Render Page 1 as the Cover Art with HiDPI / Retina Sharpness
  useEffect(() => {
    let isMounted = true;
    let renderTaskThumb: pdfjsLib.RenderTask | null = null;
    let renderTaskLarge: pdfjsLib.RenderTask | null = null;

    const renderCovers = async () => {
      if (!pdfDocument) return;

      try {
        const page1 = await pdfDocument.getPage(1);
        if (!isMounted) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const originalViewport = page1.getViewport({ scale: 1 });

        // A. Render Compact Thumbnail (CSS display: 40px width)
        if (thumbnailCanvasRef.current) {
          const canvas = thumbnailCanvasRef.current;
          const targetWidth = 40;
          const thumbScale = targetWidth / originalViewport.width;
          const scaledViewport = page1.getViewport({ scale: thumbScale * dpr });
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = Math.round(scaledViewport.width);
            canvas.height = Math.round(scaledViewport.height);
            canvas.style.width = `${targetWidth}px`;
            canvas.style.height = `${Math.round(originalViewport.height * thumbScale)}px`;
            
            renderTaskThumb = page1.render({ 
              canvasContext: ctx, 
              viewport: scaledViewport 
            });
            await renderTaskThumb.promise;
          }
        }

        // B. Render Expanded Large Cover (CSS display: 105px width)
        if (expandedCanvasRef.current) {
          const canvas = expandedCanvasRef.current;
          const targetWidth = 105;
          const largeScale = targetWidth / originalViewport.width;
          const scaledViewport = page1.getViewport({ scale: largeScale * dpr });
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = Math.round(scaledViewport.width);
            canvas.height = Math.round(scaledViewport.height);
            canvas.style.width = `${targetWidth}px`;
            canvas.style.height = `${Math.round(originalViewport.height * largeScale)}px`;

            renderTaskLarge = page1.render({ 
              canvasContext: ctx, 
              viewport: scaledViewport 
            });
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
  }, [pdfDocument]);

  // 2. Auto-hide timer management
  const clearHideTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  }, []);

  const startHideTimer = useCallback(() => {
    clearHideTimer();
    // Do not auto-hide if expanded drawer is open or user is hovering/dragging
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

  // When expanded modal closes, restart auto-hide timer
  useEffect(() => {
    if (!isExpanded) {
      startHideTimer();
    } else {
      clearHideTimer();
    }
  }, [isExpanded, startHideTimer, clearHideTimer]);

  // 3. Click-Outside to Dismiss (smoothly morphs back to compact)
  useEffect(() => {
    if (!isExpanded) return;

    const handleOutsideClick = (e: PointerEvent) => {
      const target = e.target as Node;
      // If clicking inside the single card, do not dismiss
      if (cardRef.current && cardRef.current.contains(target)) return;

      // Clicked anywhere outside in the background: morph back to compact!
      setIsExpanded(false);
    };

    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', handleOutsideClick, true);
    }, 20);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handleOutsideClick, true);
    };
  }, [isExpanded]);

  // 4. Horizontal Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    
    // Don't drag if clicking buttons, canvas, or interactive controls
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

    // Bounds clamping: respect sidebar if open
    const parentWidth = containerRef.current?.parentElement?.clientWidth || window.innerWidth;
    const minBound = isSidebarOpen ? 312 : 16;
    const maxBound = Math.max(minBound, parentWidth - MODAL_WIDTH - 16);
    const clampedX = Math.max(minBound, Math.min(maxBound, rawX));

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

  // 5. Morph between compact and expanded
  const handleCoverClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearHideTimer();
    setIsExpanded(true);
  };

  const handleCollapse = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsExpanded(false);
  };

  const handleDismissCompletely = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
    setIsCompactVisible(false);
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
        pointerEvents: 'none', // Critical: does NOT restrict cursor or lock focus!
        zIndex: 45,
        overflow: 'hidden'
      }}
    >
      {/* ────────────────────────────────────────────────────────────────
          SINGLE MORPHING CARD (Converts smoothly from compact to expanded)
          - Exactly equal width: 375px
          - Smooth height expansion from 56px to 245px
          - No duplicate/stacked cards!
      ────────────────────────────────────────────────────────────────── */}
      <div
        ref={cardRef}
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
          width: `${MODAL_WIDTH}px`,
          minWidth: `${MODAL_WIDTH}px`,
          maxWidth: `${MODAL_WIDTH}px`,
          height: isExpanded ? `${EXPANDED_HEIGHT}px` : `${COMPACT_HEIGHT}px`,
          boxSizing: 'border-box',
          pointerEvents: isCompactVisible ? 'auto' : 'none',
          opacity: isCompactVisible ? 1 : 0,
          transform: isCompactVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, -65px, 0)',
          transition: isDragging 
            ? 'none' 
            : 'height 0.36s cubic-bezier(0.16, 1, 0.3, 1), transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease',
          background: 'rgba(22, 23, 28, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '12px',
          boxShadow: isExpanded
            ? '0 18px 42px -6px rgba(0, 0, 0, 0.7), 0 4px 14px rgba(0, 0, 0, 0.4)'
            : '0 10px 28px -4px rgba(0, 0, 0, 0.5), 0 2px 8px -1px rgba(0, 0, 0, 0.3)',
          userSelect: 'none',
          cursor: isDragging ? 'grabbing' : 'default',
          backdropFilter: 'blur(16px)',
          zIndex: 48,
          overflow: 'hidden',
          willChange: 'height, transform, opacity'
        }}
      >
        {/* ─── A. COMPACT VIEW (Morphs out when expanded) ─── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 12px',
            height: `${COMPACT_HEIGHT}px`,
            boxSizing: 'border-box',
            opacity: isExpanded ? 0 : 1,
            pointerEvents: isExpanded ? 'none' : 'auto',
            transform: isExpanded ? 'translate3d(0, -8px, 0)' : 'translate3d(0, 0, 0)',
            transition: 'opacity 0.2s ease, transform 0.25s ease',
            position: isExpanded ? 'absolute' : 'relative',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {/* Clickable Book Cover Thumbnail */}
          <div
            data-no-drag
            onClick={handleCoverClick}
            title="Click to expand book cover showcase"
            style={{
              width: '40px',
              minHeight: '44px',
              borderRadius: '4px',
              overflow: 'hidden',
              flexShrink: 0,
              cursor: 'pointer',
              background: '#18191e',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 150, 136, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.5)';
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
              <BookOpen size={16} color="#009688" />
            )}
          </div>

          {/* Title and Author Info */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <span
              style={{
                fontSize: '0.84rem',
                fontWeight: 600,
                color: '#ffffff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.25
              }}
              title={title}
            >
              {title}
            </span>
            {author && (
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#94a3b8',
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
              color: isDragging ? '#009688' : '#64748b',
              cursor: isDragging ? 'grabbing' : 'grab',
              transition: 'color 0.15s ease'
            }}
          >
            <GripHorizontal size={18} />
          </div>

          {/* Dismiss Button */}
          <button
            data-no-drag
            onClick={handleDismissCompletely}
            title="Hide book cover popup"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease, background 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ─── B. EXPANDED SHOWCASE VIEW (Morphs in when expanded) ─── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '14px 16px',
            boxSizing: 'border-box',
            opacity: isExpanded ? 1 : 0,
            pointerEvents: isExpanded ? 'auto' : 'none',
            transform: isExpanded ? 'translate3d(0, 0, 0)' : 'translate3d(0, 10px, 0)',
            transition: 'opacity 0.28s ease 0.08s, transform 0.34s cubic-bezier(0.16, 1, 0.3, 1)',
            position: isExpanded ? 'relative' : 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {/* Header: Chip + Chapter + Close */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                  color: '#2dd4bf',
                  background: 'rgba(0, 150, 136, 0.16)',
                  border: '1px solid rgba(0, 150, 136, 0.3)',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  flexShrink: 0
                }}
              >
                Book Showcase
              </span>
              {currentChapter && (
                <span
                  style={{
                    fontSize: '0.74rem',
                    color: '#94a3b8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={`Ch. ${currentChapter.num}: ${currentChapter.title}`}
                >
                  Ch. {currentChapter.num}: {currentChapter.title}
                </span>
              )}
            </div>

            <button
              data-no-drag
              onClick={handleCollapse}
              title="Collapse Showcase"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body: Cover Canvas + Book Info */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            {/* Cover Art */}
            <div
              style={{
                width: '105px',
                minHeight: '150px',
                borderRadius: '6px',
                overflow: 'hidden',
                flexShrink: 0,
                background: '#18191e',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '-3px 0 10px -2px rgba(0,0,0,0.5), 0 10px 20px -4px rgba(0, 0, 0, 0.7)',
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={24} color="#009688" />
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Loading...</span>
                </div>
              )}
            </div>

            {/* Details & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  margin: '0 0 2px 0',
                  lineHeight: 1.25,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={title}
              >
                {title}
              </h3>

              {author && (
                <p
                  style={{
                    fontSize: '0.78rem',
                    color: '#94a3b8',
                    margin: '0 0 8px 0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={author}
                >
                  by <strong style={{ color: '#e2e8f0' }}>{author}</strong>
                </p>
              )}

              {/* Reading Progress */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  marginBottom: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '5px' }}>
                  <span style={{ color: '#cbd5e1' }}>Reading Progress</span>
                  <span style={{ color: '#2dd4bf', fontWeight: 600 }}>{progressPercent}%</span>
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
                      background: 'linear-gradient(90deg, #009688, #14b8a6)',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8', marginTop: '5px' }}>
                  <span>Page {currentPage} of {totalPages}</span>
                  <span>{totalPages - currentPage} left</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', flexWrap: 'wrap' }}>
                {onJumpToPage && (
                  <button
                    data-no-drag
                    onClick={() => {
                      onJumpToPage(1);
                      handleCollapse();
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      background: '#009688',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 3px 10px rgba(0, 150, 136, 0.4)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#00796b';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#009688';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <ExternalLink size={12} />
                    Jump to Cover
                  </button>
                )}

                <button
                  data-no-drag
                  onClick={handleCollapse}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#e2e8f0',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
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
            background: 'rgba(22, 23, 28, 0.94)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderTop: 'none',
            borderBottomLeftRadius: '6px',
            borderBottomRightRadius: '6px',
            padding: '3px 9px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            color: '#94a3b8',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#2dd4bf';
            e.currentTarget.style.transform = 'translateY(2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <BookOpen size={12} />
          <span>Cover</span>
          <ChevronDown size={11} />
        </button>
      )}
    </div>
  );
}
