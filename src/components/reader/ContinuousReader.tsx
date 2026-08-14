import React, { useEffect, useRef, useState } from 'react';
import { usePDFContext } from '../../hooks/usePDF';
import { PDFCanvas } from './PDFCanvas';
import { useBookStore } from '../../stores/bookStore';
import { useUiStore } from '../../stores/uiStore';

interface LazyPDFPageProps {
  pageNum: number;
  onContextMenuRequest?: (x: number, y: number, highlightId: string) => void;
  onPageVisible: (pageNum: number) => void;
}

const LazyPDFPage = React.memo(function LazyPDFPage({ pageNum, onContextMenuRequest, onPageVisible }: LazyPDFPageProps) {
  const { currentPage } = usePDFContext();
  // Pre-render the active page and its immediate neighbors to prevent blank screens on initial load
  const [isVisible, setIsVisible] = useState(() => Math.abs(pageNum - currentPage) <= 3);
  const containerRef = useRef<HTMLDivElement>(null);
  const { invertPdfColors, pdfTintColor, continuousGapless } = useBookStore();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      { rootMargin: '800% 0px' } // Load 8 viewports above and below to significantly reduce blank loading pages
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

  const activeSelectionPages = useUiStore(s => s.activeSelectionPages);

  // We only render when visible (or nearby). This drops GPU memory for pages scrolled past.
  // Selection Lock: Keep pages mounted if they are part of an active multi-page selection
  const isSelected = activeSelectionPages && pageNum >= activeSelectionPages[0] && pageNum <= activeSelectionPages[1];
  const shouldRender = isVisible || isSelected;

  return (
    <div 
      id={`pdf-page-${pageNum}`}
      ref={containerRef} 
      style={{ 
        height: `calc(var(--pdf-base-height, 1100px) * var(--pdf-scale, 1.2) + ${continuousGapless ? 0 : 10}px)`, 
        paddingBottom: 'calc(10px * var(--pdf-scale, 1.2))', 
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        width: '100%'
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
          backgroundColor: invertPdfColors ? '#000000' : (pdfTintColor || 'white'), 
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
  const scaleRef = useRef(pdfState.scale);
  useEffect(() => {
    setPageRef.current = pdfState.setPage;
    scaleRef.current = pdfState.scale;
  }, [pdfState.setPage, pdfState.scale]);
  
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
    
    const handleSearchJump = (e: any) => {
      if (e.detail && e.detail.page) {
        const el = document.getElementById(`pdf-page-${e.detail.page}`);
        if (el) {
          if (e.detail.rect) {
            const cropScale = 1 + (useBookStore.getState().pdfMarginCrop || 0) / 100;
            const visualScale = (scaleRef.current || 1.2) * cropScale;
            const relativeTop = e.detail.rect.top * visualScale;
            
            // Scroll the page into view at the top first
            el.scrollIntoView({ behavior: 'auto', block: 'start' });
            
            // Then scroll the container down by the relative offset
            setTimeout(() => {
               let container = el.parentElement;
               while (container && container.scrollHeight === container.clientHeight && container !== document.body) {
                  container = container.parentElement;
               }
               if (container) {
                  container.scrollBy({ top: Math.max(0, relativeTop - 150), behavior: 'smooth' });
               }
            }, 50);
          } else {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    };
    window.addEventListener('continuous-jump', handleSearchJump);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('continuous-jump', handleSearchJump);
    };
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
