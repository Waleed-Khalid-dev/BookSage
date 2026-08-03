import { useEffect, useRef, useState } from 'react';
import { UsePDFResult } from '../../hooks/usePDF';
import { PDFCanvas } from './PDFCanvas';

interface LazyPDFPageProps {
  pdfState: UsePDFResult;
  pageNum: number;
  onContextMenuRequest?: (x: number, y: number, highlightId: string) => void;
}

function LazyPDFPage({ pdfState, pageNum, onContextMenuRequest }: LazyPDFPageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          setHasRendered(true);
        } else {
          setIsVisible(false);
        }
      },
      { rootMargin: '150% 0px' } // Load 1.5 viewports above and below
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
          pdfState.setPage(pageNum);
        }
      },
      { threshold: 0.3 } // If 30% of the page is visible, count it as the current page
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, [pageNum]);

  // Use accurate height from global base size if available, fallback to estimate
  const currentWidth = pdfState.basePageSize ? pdfState.basePageSize.width * (pdfState.scale || 1.2) : 800 * (pdfState.scale || 1.2);
  const currentHeight = pdfState.basePageSize ? pdfState.basePageSize.height * (pdfState.scale || 1.2) : 1100 * (pdfState.scale || 1.2);

  // If a page has EVER been rendered, we keep it in the DOM without content-visibility to perfectly preserve cross-page text selection
  const shouldRender = isVisible || hasRendered;

  return (
    <div 
      id={`pdf-page-${pageNum}`}
      ref={containerRef} 
      style={{ 
        height: `${currentHeight}px`, 
        marginBottom: '10px', 
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        width: '100%'
      }}
    >
      {shouldRender ? (
        <div style={{ position: 'relative', width: `${currentWidth}px`, height: `${currentHeight}px`, display: 'flex', justifyContent: 'center' }}>
          <PDFCanvas 
            pdfState={pdfState} 
            pageNumber={pageNum} 
            onContextMenuRequest={onContextMenuRequest}
          />
        </div>
      ) : (
        <div style={{ 
          height: `${currentHeight}px`, 
          background: 'var(--bs-surface)', 
          width: `${currentWidth}px`,
          maxWidth: '100%',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'var(--bs-muted)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          Loading Page {pageNum}...
        </div>
      )}
    </div>
  );
}

export function ContinuousReader({ pdfState, onContextMenuRequest }: { pdfState: UsePDFResult, onContextMenuRequest?: (x: number, y: number, highlightId: string) => void }) {
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
    <div className="continuous-reader" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {pages.map((pageNum) => (
        <LazyPDFPage key={pageNum} pdfState={pdfState} pageNum={pageNum} onContextMenuRequest={onContextMenuRequest} />
      ))}
    </div>
  );
}
