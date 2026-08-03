import { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';
import { UsePDFResult } from '../../hooks/usePDF';
import { HighlightLayer } from './HighlightLayer';
import { useBookStore } from '../../stores/bookStore';
import { getHighlightsForBook } from '../../services/dbService';

interface PDFCanvasProps {
  pdfState: UsePDFResult;
  pageNumber: number;
  onLoadSuccess?: (width: number, height: number) => void;
  onContextMenuRequest?: (x: number, y: number, highlightId: string) => void;
}

export function PDFCanvas({ pdfState, pageNumber, onLoadSuccess, onContextMenuRequest }: PDFCanvasProps) {
  const { pdfDocument, scale, isLoading, error } = pdfState;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current || !textLayerRef.current) return;

    let renderTask: pdfjsLib.RenderTask | null = null;
    let active = true;

    const renderPage = async () => {
      try {
        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const baseViewport = page.getViewport({ scale: 1.0 });
        if (onLoadSuccess) {
          onLoadSuccess(baseViewport.width, baseViewport.height);
        }

        renderTask = page.render(renderContext);
        await renderTask.promise;

        const textContent = await page.getTextContent();

        if (active && textLayerRef.current) {
          const textLayerDiv = textLayerRef.current;
          textLayerDiv.innerHTML = '';
          // Use the ACTUAL scaled viewport dimensions
          textLayerDiv.style.height = `${viewport.height}px`;
          textLayerDiv.style.width = `${viewport.width}px`;
          // Remove the transform hack that broke hitboxes
          textLayerDiv.style.transform = `none`;
          
          // Provide the scale factor to CSS so we can bypass browser min-font limits mathematically
          textLayerDiv.style.setProperty('--scale-factor', viewport.scale.toString());

          pdfjsLib.renderTextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: viewport, // Pass the scaled viewport so it calculates positions correctly
            textDivs: []
          });
        }
      } catch (err: any) {
        if (err.name === 'RenderingCancelledException') {
          // Normal cancellation
        } else {
          console.error('Render error:', err);
        }
      }
    };

    renderPage();

    return () => {
      active = false;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDocument, pageNumber, scale]);

  const { bookId } = useBookStore();

  if (isLoading) return <div className="pdf-status">Loading PDF...</div>;
  if (error) return <div className="pdf-status error">Error loading PDF: {error}</div>;
  if (!pdfDocument) return <div className="pdf-status">No PDF loaded</div>;

  const handleContextMenu = async (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent the native browser context menu IMMEDIATELY.
    // If we wait for the async SQLite call, the browser will have already shown it!
    e.preventDefault();
    e.stopPropagation();

    if (!bookId || !onContextMenuRequest) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    try {
      const allHighlights = await getHighlightsForBook(bookId);
      const pageHighlights = allHighlights.filter(h => h.page_num === pageNumber);

      for (const hl of pageHighlights) {
        const hlRects = JSON.parse(hl.rects);
        for (const r of hlRects) {
          // Add a small buffer of 2px to make clicking easier
          if (x >= r.left - 2 && x <= r.left + r.width + 2 && y >= r.top - 2 && y <= r.top + r.height + 2) {
            e.preventDefault();
            e.stopPropagation();
            onContextMenuRequest(e.clientX, e.clientY, hl.id);
            return;
          }
        }
      }
    } catch (err) {
      console.error('Failed to handle context menu:', err);
    }
  };

  return (
    <div className="pdf-container" style={{ position: 'relative', display: 'inline-block' }}>
      <canvas ref={canvasRef} className="pdf-canvas" />
      <HighlightLayer pageNumber={pageNumber} scale={scale} />
      <div 
        ref={textLayerRef} 
        className="textLayer" 
        onContextMenu={handleContextMenu}
        data-page-number={pageNumber}
        style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}
      />
    </div>
  );
}
