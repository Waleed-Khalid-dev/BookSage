import { useEffect, useState } from 'react';
import { getHighlightsForBook, HighlightRecord } from '../../services/dbService';
import { useBookStore } from '../../stores/bookStore';
import { RelativeRect } from '../../hooks/useTextSelection';

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
        
        return rects.map((rect, idx) => (
          <div
            key={`${hl.id}-${idx}`}
            style={{
              position: 'absolute',
              top: `${rect.top * scale}px`,
              left: `${rect.left * scale}px`,
              width: `${rect.width * scale}px`,
              height: `${rect.height * scale}px`,
              backgroundColor: hl.color,
              mixBlendMode: 'multiply',
            }}
          />
        ));
      })}
    </div>
  );
}
