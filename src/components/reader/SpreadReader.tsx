import React from 'react';
import { usePDFContext } from '../../hooks/usePDF';
import { PDFCanvas } from './PDFCanvas';

interface SpreadReaderProps {
  onContextMenuRequest?: (x: number, y: number, highlightId: string) => void;
}

export function SpreadReader({ onContextMenuRequest }: SpreadReaderProps) {
  const { currentPage, totalPages, scale, basePageSize } = usePDFContext();

  if (totalPages === 0) return null;

  // Determine which pages to show
  let leftPage: number | null = null;
  let rightPage: number | null = null;

  if (currentPage === 1) {
    rightPage = 1; // Cover page stands alone on the right (or center depending on book preference, usually right)
  } else {
    leftPage = Math.floor(currentPage / 2) * 2;
    rightPage = leftPage + 1;
    if (rightPage > totalPages) {
      rightPage = null; // Last page might be even and have no right pair
    }
  }

  return (
    <div 
      className="spread-reader" 
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'flex-start',
        padding: '2rem',
        minHeight: '100%',
        perspective: '2000px',
        gap: '0px', // Removed gap to bring pages perfectly together for the spine
        '--pdf-scale': scale || 1.2,
        '--pdf-base-width': basePageSize ? `${basePageSize.width}px` : '800px',
        '--pdf-base-height': basePageSize ? `${basePageSize.height}px` : '1100px',
      } as React.CSSProperties}
    >
      {/* Left Page Container */}
      <div 
        key={`left-${leftPage}`}
        className={leftPage ? 'page-flip-anim' : ''}
        style={{
        width: 'calc(var(--pdf-base-width, 800px) * var(--pdf-scale, 1.2))', 
        height: 'calc(var(--pdf-base-height, 1100px) * var(--pdf-scale, 1.2))',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        background: leftPage ? 'var(--bs-surface)' : 'rgba(0,0,0,0.02)',
        position: 'relative',
        boxShadow: leftPage ? '-5px 10px 20px rgba(0,0,0,0.15)' : 'none',
        zIndex: leftPage ? 2 : 1
      }}>
        {leftPage && (
          <>
            <PDFCanvas 
              pageNumber={leftPage} 
              onContextMenuRequest={onContextMenuRequest}
            />
            {/* Spine Shadow Overlay (Left) */}
            <div style={{
              position: 'absolute',
              top: 0, right: 0, bottom: 0, width: '40px',
              background: 'linear-gradient(to left, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 100%)',
              pointerEvents: 'none',
              zIndex: 10
            }} />
          </>
        )}
      </div>

      {/* Right Page Container */}
      <div 
        key={`right-${rightPage}`}
        className={rightPage ? 'page-flip-anim' : ''}
        style={{
        width: 'calc(var(--pdf-base-width, 800px) * var(--pdf-scale, 1.2))', 
        height: 'calc(var(--pdf-base-height, 1100px) * var(--pdf-scale, 1.2))',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        background: rightPage ? 'var(--bs-surface)' : 'rgba(0,0,0,0.02)',
        position: 'relative',
        boxShadow: rightPage ? '5px 10px 20px rgba(0,0,0,0.15)' : 'none',
        zIndex: rightPage ? 2 : 1
      }}>
        {rightPage && (
          <>
            <PDFCanvas 
              pageNumber={rightPage} 
              onContextMenuRequest={onContextMenuRequest}
            />
            {/* Spine Shadow Overlay (Right) */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, bottom: 0, width: '40px',
              background: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 100%)',
              pointerEvents: 'none',
              zIndex: 10
            }} />
          </>
        )}
      </div>
    </div>
  );
}
