import React, { useEffect, useRef, useState } from 'react';
import { usePDFContext } from '../../hooks/usePDF';
import { PDFCanvas } from './PDFCanvas';

interface LazyPDFPageProps {
  pageNum: number;
  onContextMenuRequest?: (x: number, y: number, highlightId: string) => void;
  onPageVisible: (pageNum: number) => void;
}

const LazyPDFPage = React.memo(function LazyPDFPage({ pageNum, onContextMenuRequest, onPageVisible }: LazyPDFPageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      { rootMargin: '400% 0px' } // Load 4 viewports above and below to prevent loading flashes
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Sync current page number in the PageControls based on scroll position
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onPageVisible(pageNum);
        }
      },
      { threshold: 0.3 } // If 30% of the page is visible, count it as the current page
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, [pageNum, onPageVisible]);

  // We only render when visible (or nearby). This drops GPU memory for pages scrolled past.
  const shouldRender = isVisible;

  return (
    <div 
      id={`pdf-page-${pageNum}`}
      ref={containerRef} 
      style={{ 
        height: 'calc(var(--pdf-base-height, 1100px) * var(--pdf-scale, 1.2))', 
        marginBottom: 'calc(10px * var(--pdf-scale, 1.2))', 
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      {shouldRender ? (
        <div style={{ 
          position: 'relative', 
          width: 'calc(var(--pdf-base-width, 800px) * var(--pdf-scale, 1.2))', 
          height: 'calc(var(--pdf-base-height, 1100px) * var(--pdf-scale, 1.2))', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <PDFCanvas 
            pageNumber={pageNum} 
            onContextMenuRequest={onContextMenuRequest}
          />
        </div>
      ) : (
        <div style={{ 
          height: '100%', 
          background: 'white', 
          width: 'calc(var(--pdf-base-width, 800px) * var(--pdf-scale, 1.2))',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }} />
      )}
    </div>
  );
});

export function ContinuousReader({ onContextMenuRequest }: { onContextMenuRequest?: (x: number, y: number, highlightId: string) => void }) {
  const pdfState = usePDFContext();
  
  // Create a stable callback for setPage so we don't break LazyPDFPage memoization
  const setPageRef = useRef(pdfState.setPage);
  useEffect(() => {
    setPageRef.current = pdfState.setPage;
  }, [pdfState.setPage]);
  
  const handlePageVisible = React.useCallback((pageNum: number) => {
    setPageRef.current(pageNum);
  }, []);
  
  // Jump to the current page on initial mount before IntersectionObserver overrides it
  useEffect(() => {
    // Small timeout ensures the DOM has rendered the placeholders
    const timeout = setTimeout(() => {
      const el = document.getElementById(`pdf-page-${pdfState.currentPage}`);
      if (el) {
        el.scrollIntoView();
      }
    }, 50);
    return () => clearTimeout(timeout);
  }, []); // Only run once on mount!

  if (pdfState.totalPages === 0) return null;

  const pages = Array.from({ length: pdfState.totalPages }, (_, i) => i + 1);
  
  return (
    <div 
      className="continuous-reader" 
      style={{ 
        display: 'inline-flex', 
        flexDirection: 'column', 
        alignItems: 'center', // Centers pages within the reader, but the reader itself grows to fit them
        '--pdf-scale': pdfState.scale || 1.2,
        '--pdf-base-width': pdfState.basePageSize ? `${pdfState.basePageSize.width}px` : '800px',
        '--pdf-base-height': pdfState.basePageSize ? `${pdfState.basePageSize.height}px` : '1100px',
      } as React.CSSProperties}
    >
      {pages.map((pageNum) => (
        <LazyPDFPage 
          key={pageNum} 
          pageNum={pageNum} 
          onContextMenuRequest={onContextMenuRequest} 
          onPageVisible={handlePageVisible}
        />
      ))}
    </div>
  );
}
