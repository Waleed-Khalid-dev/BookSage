import { useEffect, useState } from 'react';
import { getHighlightsForBook, HighlightRecord } from '../../services/dbService';
import { useBookStore } from '../../stores/bookStore';
import { RelativeRect } from '../../hooks/useTextSelection';
import { StickyNote } from 'lucide-react';

interface HighlightLayerProps {
  pageNumber: number;
  scale?: number;
}

export function HighlightLayer({ pageNumber, scale = 1.0 }: HighlightLayerProps) {
  const { bookId, highlightsRefreshCounter } = useBookStore();
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
    <div className="highlightLayer" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
      {highlights.map(hl => {
        let rects: RelativeRect[] = [];
        try {
          rects = JSON.parse(hl.rects);
        } catch (e) {
          console.error('Failed to parse highlight rects', e);
        }
        
        const hasNote = Boolean(hl.note && hl.note.trim() !== '');
        
        const isUnderline = hl.type === 'underline';
        const isStrikethrough = hl.type === 'strikethrough';
        
        return rects.map((rect, idx) => {
          let style: React.CSSProperties = {
            position: 'absolute',
            top: `${rect.top * scale}px`,
            left: `${rect.left * scale}px`,
            width: `${rect.width * scale}px`,
            height: `${rect.height * scale}px`,
          };

          if (isUnderline) {
            style.borderBottom = `2px solid ${hl.color || '#e05252'}`;
          } else if (isStrikethrough) {
            style.textDecoration = `line-through 2px ${hl.color || '#e05252'}`;
            // To simulate strikethrough via div:
            style.background = `linear-gradient(to bottom, transparent 45%, ${hl.color || '#e05252'} 45%, ${hl.color || '#e05252'} 55%, transparent 55%)`;
          } else {
            style.backgroundColor = hl.color;
            style.mixBlendMode = 'multiply';
          }

          return (
          <div
            key={`${hl.id}-${idx}`}
            style={style}
          >
            {idx === 0 && hasNote && (
              <div 
                title={hl.note!} 
                style={{ 
                  position: 'absolute', 
                  top: -8, 
                  right: -8, 
                  pointerEvents: 'auto',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  borderRadius: '50%',
                  padding: '2px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <StickyNote size={12} fill="#fde68a" />
              </div>
            )}
          </div>
        );
        });
      })}
    </div>
  );
}
