
import { useUiStore } from '../../stores/uiStore';
import { useBookStore } from '../../stores/bookStore';

interface ActiveSelectionLayerProps {
  pageNumber: number;
  scale?: number;
}

export function ActiveSelectionLayer({ pageNumber, scale = 1.0 }: ActiveSelectionLayerProps) {
  const { activeSelection } = useUiStore();
  const { highlightOpacity } = useBookStore();

  if (!activeSelection || activeSelection.rects.length === 0) return null;
  // If we have pageNum tracking and this isn't the page, skip
  if (activeSelection.pageNum !== null && activeSelection.pageNum !== pageNumber) return null;

  return (
    <div 
      className="active-selection-layer" 
      style={{ 
        position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, 
        pointerEvents: 'none', 
        mixBlendMode: 'multiply',
        opacity: highlightOpacity
      }}
    >
      {activeSelection.rects.map((rect, idx) => (
        <div 
          key={`active-sel-${idx}`} 
          style={{
            position: 'absolute',
            top: `${rect.top * scale}px`,
            left: `${rect.left * scale}px`,
            width: `${rect.width * scale}px`,
            height: `${rect.height * scale}px`,
            backgroundColor: 'rgba(0, 120, 215, 0.4)', // Classic selection blue
          }} 
        />
      ))}
    </div>
  );
}
