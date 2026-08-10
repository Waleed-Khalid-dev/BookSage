import { useBookStore } from '../../stores/bookStore';

interface SearchHighlightLayerProps {
  pageNumber: number;
  scale?: number;
}

export function SearchHighlightLayer({ pageNumber, scale = 1.0 }: SearchHighlightLayerProps) {
  const { searchResults, currentSearchIndex, isSearching } = useBookStore();

  if (isSearching || searchResults.length === 0) return null;

  const pageMatches = searchResults.find(m => m.page === pageNumber);
  if (!pageMatches || pageMatches.rects.length === 0) return null;

  return (
    <div className="searchHighlightLayer" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
      {pageMatches.rects.map((rect, idx) => {
        const isActive = rect.matchIndex === currentSearchIndex;
        return (
          <div
            key={`search-${pageNumber}-${idx}`}
            id={isActive ? 'active-search-highlight' : undefined}
            style={{
              position: 'absolute',
              top: `${rect.top * scale}px`,
              left: `${rect.left * scale}px`,
              width: `${rect.width * scale}px`,
              height: `${rect.height * scale}px`,
              backgroundColor: isActive ? 'rgba(255, 165, 0, 0.6)' : 'rgba(255, 255, 0, 0.4)',
              border: isActive ? '2px solid orange' : 'none',
              boxSizing: 'border-box',
              mixBlendMode: 'multiply',
              transition: 'background-color 0.2s, border 0.2s',
              zIndex: isActive ? 10 : 5 // Bring active highlight to front
            }}
          />
        );
      })}
    </div>
  );
}
