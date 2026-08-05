import React, { useEffect, useState } from 'react';
import { getHighlightsForBook, HighlightRecord } from '../../services/dbService';
import { useBookStore } from '../../stores/bookStore';
import { RelativeRect } from '../../hooks/useTextSelection';
import { StickyNote } from 'lucide-react';

interface HighlightLayerProps {
  pageNumber: number;
  scale?: number;
}

export function HighlightLayer({ pageNumber, scale = 1.0 }: HighlightLayerProps) {
  const { bookId, highlightsRefreshCounter, highlightOpacity } = useBookStore();
  const [highlights, setHighlights] = useState<HighlightRecord[]>([]);

  useEffect(() => {
    let active = true;
    if (!bookId) return;

    const fetchHighlights = async () => {
      try {
        const allHighlights = await getHighlightsForBook(bookId);
        if (active) {
          // Filter only for this page
          setHighlights(allHighlights.filter(h => h.page_num === pageNumber));
        }
      } catch (e) {
        console.error('Failed to fetch highlights for page', pageNumber, e);
      }
    };

    fetchHighlights();
    return () => {
      active = false;
    };
  }, [bookId, pageNumber, highlightsRefreshCounter]);

  if (highlights.length === 0) return null;

  return (
    <>
      {/* Highlights Container (Multiplies with canvas) */}
      <div 
        className="highlight-rects-layer" 
        style={{ 
          position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, 
          pointerEvents: 'none', 
          mixBlendMode: 'multiply',
          opacity: highlightOpacity
        }}
      >
        {highlights.map(hl => {
          let rects: RelativeRect[] = [];
          try {
            rects = JSON.parse(hl.rects);
          } catch (e) {
            console.error('Failed to parse highlight rects', e);
          }
          
          const isUnderline = hl.type === 'underline';
          const isStrikethrough = hl.type === 'strikethrough';
          
          return (
            <React.Fragment key={`rects-${hl.id}`}>
              {rects.map((rect, idx) => {
                let style: React.CSSProperties = {
                  position: 'absolute',
                  top: `${rect.top * scale}px`,
                  left: `${rect.left * scale}px`,
                  width: `${rect.width * scale}px`,
                  height: `${rect.height * scale}px`,
                };

                let displayColor = hl.color || '#e05252';
                // Convert legacy semi-transparent colors to opaque so they don't double-darken on overlaps
                if (displayColor.includes('rgba') && displayColor.includes('0.3')) {
                  displayColor = displayColor.replace(/,\s*0\.3\s*\)/, ', 1)');
                }

                if (isUnderline) {
                  style.borderBottom = `2px solid ${displayColor}`;
                } else if (isStrikethrough) {
                  style.textDecoration = `line-through 2px ${displayColor}`;
                  style.background = `linear-gradient(to bottom, transparent 45%, ${displayColor} 45%, ${displayColor} 55%, transparent 55%)`;
                } else {
                  style.backgroundColor = displayColor;
                  // Mix blend mode is on the parent container, so opaque colors multiply smoothly
                }

                return <div key={`${hl.id}-${idx}`} style={style} />;
              })}
            </React.Fragment>
          );
        })}
      </div>

      {/* Sticky Notes Container (Normal blending, interactive) */}
      <div 
        className="highlight-icons-layer" 
        style={{ 
          position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, 
          pointerEvents: 'none' 
        }}
      >
        {highlights.map(hl => {
          let rects: RelativeRect[] = [];
          try {
            rects = JSON.parse(hl.rects);
          } catch (e) {}
          
          const hasNote = Boolean(hl.note && hl.note.trim() !== '');
          if (!hasNote || rects.length === 0) return null;
          
          return (
            <div 
              key={`note-${hl.id}`}
              className="highlight-note-icon"
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('booksage-open-sidebar', { detail: hl.id }));
              }}
              style={{ 
                position: 'absolute', 
                top: rects[0].top * scale - 8, 
                left: rects[0].left * scale + rects[0].width * scale - 8, 
                pointerEvents: 'auto',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                borderRadius: '50%',
                padding: '2px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <StickyNote size={12} fill="#fde68a" />
              {/* Custom Tooltip */}
              <div className="note-tooltip" style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: '4px',
                backgroundColor: 'var(--bs-surface)',
                color: 'var(--bs-text)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                border: '1px solid var(--bs-border)',
                opacity: 0,
                transition: 'opacity 0.15s ease-in-out',
                zIndex: 20
              }}>
                {hl.note}
              </div>
              <style>
                {`
                  .highlight-note-icon:hover .note-tooltip {
                    opacity: 1 !important;
                  }
                `}
              </style>
            </div>
          );
        })}
      </div>
    </>
  );
}
