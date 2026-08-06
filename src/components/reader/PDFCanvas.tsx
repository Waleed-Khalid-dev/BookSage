import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';
import { HighlightLayer } from './HighlightLayer';
import { SearchHighlightLayer } from './SearchHighlightLayer';
import { DrawingLayer } from './DrawingLayer';
import { TTSHighlightLayer } from './TTSHighlightLayer';
import { useBookStore } from '../../stores/bookStore';
import { getHighlightsForBook } from '../../services/dbService';

import { usePDFContext } from '../../hooks/usePDF';

interface PDFCanvasProps {
  pageNumber: number;
  onLoadSuccess?: (width: number, height: number) => void;
  onContextMenuRequest?: (x: number, y: number, highlightId: string) => void;
}

export function PDFCanvas({ pageNumber, onLoadSuccess, onContextMenuRequest }: PDFCanvasProps) {
  const pdfState = usePDFContext();
  const { pdfDocument, scale, isLoading, error } = pdfState;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track the scale at which the canvas was LAST actually rendered
  const [renderedScale, setRenderedScale] = useState(scale);
  const renderTimeout = useRef<number | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Debounce the heavy PDF.js rendering by 250ms during active pinch/scroll
  useEffect(() => {
    if (scale !== renderedScale) {
      if (renderTimeout.current) clearTimeout(renderTimeout.current);
      renderTimeout.current = setTimeout(() => {
        setRenderedScale(scale);
      }, 250);
    }
    return () => {
      if (renderTimeout.current) clearTimeout(renderTimeout.current);
    };
  }, [scale, renderedScale]);

  // Smoothly scale the text layer during zoom before PDF.js finishes rendering the new DOM.
  // This visually scales the native browser text selection so it perfectly tracks the canvas.
  useEffect(() => {
    if (textLayerRef.current) {
      const currentTextLayerScale = parseFloat(textLayerRef.current.style.getPropertyValue('--scale-factor') || String(renderedScale));
      if (currentTextLayerScale > 0) {
        const ratio = scale / currentTextLayerScale;
        if (ratio !== 1) {
          textLayerRef.current.style.transform = `scale(${ratio})`;
          textLayerRef.current.style.transformOrigin = 'top left';
        }
      }
    }
  }, [scale, renderedScale]);

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current || !textLayerRef.current) return;

    let renderTask: pdfjsLib.RenderTask | null = null;
    let active = true;

    const renderPage = async (retryCount = 0) => {
      try {
        setRenderError(null);
        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale: renderedScale });
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.height = viewport.height;
        offscreenCanvas.width = viewport.width;
        
        const context = offscreenCanvas.getContext('2d', { alpha: false });
        if (!context) return;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const baseViewport = page.getViewport({ scale: 1.0 });
        if (onLoadSuccess) {
          onLoadSuccess(baseViewport.width, baseViewport.height);
        }

        renderTask = page.render(renderContext);
        
        // Timeout the render task if it hangs (fixes the blank canvas bug)
        const renderPromise = renderTask.promise;
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Render timeout')), 3000));
        
        await Promise.race([renderPromise, timeoutPromise]);

        // Copy rendered frame to the visible canvas instantaneously
        if (active && canvasRef.current) {
          const visibleCanvas = canvasRef.current;
          visibleCanvas.height = viewport.height;
          visibleCanvas.width = viewport.width;
          const visibleContext = visibleCanvas.getContext('2d', { alpha: false });
          if (visibleContext) {
            visibleContext.drawImage(offscreenCanvas, 0, 0);
          }
        }

        const textContent = await page.getTextContent();

        if (active && textLayerRef.current) {
          const textLayerDiv = textLayerRef.current;
          textLayerDiv.innerHTML = '';
          textLayerDiv.style.height = `${viewport.height}px`;
          textLayerDiv.style.width = `${viewport.width}px`;
          textLayerDiv.style.transform = `none`;
          textLayerDiv.style.setProperty('--scale-factor', viewport.scale.toString());

          const textLayerTask = pdfjsLib.renderTextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: viewport,
            textDivs: []
          });

          const restoreSelection = () => {
            import('../../stores/uiStore').then(({ useUiStore }) => {
              const activeSelection = useUiStore.getState().activeSelection;
              if (activeSelection && activeSelection.pageNum === pageNumber && activeSelection.startNonWs !== undefined && activeSelection.lengthNonWs !== undefined) {
                import('../../utils/domUtils').then(({ getRangeByNonWs }) => {
                  const range = getRangeByNonWs(textLayerDiv, activeSelection.startNonWs!, activeSelection.lengthNonWs!);
                  if (range) {
                    const sel = window.getSelection();
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                  }
                });
              }
            });
          };

          if (textLayerTask && textLayerTask.promise) {
            textLayerTask.promise.then(() => {
              if (active) restoreSelection();
            });
          } else {
            setTimeout(() => {
              if (active) restoreSelection();
            }, 100);
          }
        }
      } catch (err: any) {
        if (err.name === 'RenderingCancelledException') {
          // Normal cancellation
        } else {
          console.error(`Render error on page ${pageNumber}:`, err);
          if (active && retryCount < 2) {
            console.log(`Retrying render for page ${pageNumber}...`);
            setTimeout(() => { if (active) renderPage(retryCount + 1); }, 200);
          } else if (active) {
            setRenderError(err.message || String(err));
          }
        }
      }
    };

    let renderTimeoutId: ReturnType<typeof setTimeout>;

    // Wait 25ms before starting the render. This prevents rapid scrolling 
    // from choking the PDF.js worker queue with pages that are instantly skipped.
    renderTimeoutId = setTimeout(() => {
      if (active) renderPage();
    }, 25);

    return () => {
      active = false;
      clearTimeout(renderTimeoutId);
      // We explicitly DO NOT call renderTask.cancel() here.
      // In many versions of PDF.js, cancelling a render task corrupts the internal 
      // operator list stream for that specific page. If the user scrolls back to this 
      // page later, the page will render completely blank because its stream was aborted.
      // Letting it finish in the background is safer. (We check `active` after it resolves).
    };
  }, [pdfDocument, pageNumber, renderedScale, pdfState.basePageSize]);

  const { 
    bookId, isDrawingMode, invertPdfColors, pdfTintColor, pdfTextColor, pdfMarginCrop 
  } = useBookStore();

  if (isLoading) return <div className="pdf-status">Loading PDF...</div>;
  if (error) return <div className="pdf-status error">Error loading PDF: {error}</div>;
  if (!pdfDocument) return <div className="pdf-status">No PDF loaded</div>;

  const handleContextMenu = async (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!bookId || !onContextMenuRequest) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // Hitbox detection must account for the CSS transform ratio as well
    const cropScale = 1 + (pdfMarginCrop || 0) / 100;
    const visualScale = scale * cropScale; 
    const x = (e.clientX - rect.left) / visualScale;
    const y = (e.clientY - rect.top) / visualScale;

    try {
      const allHighlights = await getHighlightsForBook(bookId);
      const pageHighlights = allHighlights.filter(h => h.page_num === pageNumber);

      for (const hl of pageHighlights) {
        const hlRects = JSON.parse(hl.rects);
        for (const r of hlRects) {
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

  const hasDuotone = pdfTintColor && pdfTextColor;

  return (
    <div 
      ref={containerRef}
      className="pdf-container" 
      style={{ 
        position: 'relative', 
        display: 'inline-block',
        flexShrink: 0,
        overflow: 'hidden',
        width: `${(pdfState.basePageSize?.width || 800) * scale}px`,
        height: `${(pdfState.basePageSize?.height || 1100) * scale}px`,
        backgroundColor: invertPdfColors ? '#000000' : (pdfTintColor || 'white'),
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        filter: hasDuotone ? 'url(#pdf-duotone)' : (invertPdfColors ? 'invert(1) hue-rotate(180deg)' : 'none'),
      }}
    >
      {renderError && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(255,0,0,0.8)', color: 'white', padding: '1rem', borderRadius: '8px', zIndex: 1000,
          maxWidth: '80%', textAlign: 'center', wordBreak: 'break-all'
        }}>
          <b>Render Error (Page {pageNumber})</b><br/>{renderError}
        </div>
      )}
      <div 
        className="pdf-crop-wrapper" 
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          transform: `scale(${1 + (pdfMarginCrop || 0) / 100})`,
          transformOrigin: 'center center'
        }}
      >
        <canvas 
          ref={canvasRef} 
          className="pdf-canvas" 
          style={{ 
            display: 'block',
            width: '100%', 
            height: '100%'
          }}
        />
      {pdfTintColor && !hasDuotone && (
        <div 
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: pdfTintColor,
            mixBlendMode: invertPdfColors ? 'screen' : 'multiply',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
      )}
      <DrawingLayer 
        pageNumber={pageNumber} 
        scale={scale} 
        width={pdfState.basePageSize?.width}
        height={pdfState.basePageSize?.height}
      />
      <SearchHighlightLayer pageNumber={pageNumber} scale={scale} />
        <div 
          ref={textLayerRef} 
          className="textLayer" 
          onContextMenu={handleContextMenu}
          data-page-number={pageNumber}
          style={{ 
            position: 'absolute', 
            left: 0, 
            top: 0, 
            right: 0, 
            bottom: 0, 
            overflow: 'hidden',
            pointerEvents: isDrawingMode ? 'none' : 'auto',
            userSelect: isDrawingMode ? 'none' : 'text',
            WebkitUserSelect: isDrawingMode ? 'none' : 'text'
          }}
        />
        <HighlightLayer pageNumber={pageNumber} scale={scale} />
        <TTSHighlightLayer pageNumber={pageNumber} scale={scale} />
      </div>
    </div>
  );
}
