import React from 'react';
import { useUiStore } from '../../stores/uiStore';

interface TTSHighlightLayerProps {
  pageNumber: number;
  scale?: number;
}

export function TTSHighlightLayer({ pageNumber, scale = 1.0 }: TTSHighlightLayerProps) {
  const { ttsHighlight } = useUiStore();

  if (!ttsHighlight || ttsHighlight.rects.length === 0) return null;
  if (ttsHighlight.pageNum !== pageNumber) return null;

  return (
    <div 
      className="tts-highlight-layer" 
      style={{ 
        position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, 
        pointerEvents: 'none', 
        zIndex: 5,
        transform: `scale(${scale})`,
        transformOrigin: '0 0'
      }}
    >
      {ttsHighlight.rects.map((rect, idx) => (
        <div 
          key={`tts-hl-${idx}`} 
          style={{
            position: 'absolute',
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            backgroundColor: 'rgba(255, 223, 0, 0.4)', // transparent yellow
            mixBlendMode: 'multiply',
            borderRadius: '3px',
            transition: 'top 0.1s, left 0.1s, width 0.1s, height 0.1s'
          }} 
        />
      ))}
    </div>
  );
}
