import { useEffect, useRef, useState } from 'react';
import { usePDFContext } from '../../hooks/usePDF';
import * as pdfjsLib from 'pdfjs-dist';

interface ThumbnailItemProps {
  pageNumber: number;
  isActive: boolean;
  onClick: (page: number) => void;
  width?: number;
}

export function ThumbnailItem({ pageNumber, isActive, onClick, width = 120 }: ThumbnailItemProps) {
  const { pdfDocument } = usePDFContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  useEffect(() => {
    let isMounted = true;

    const renderThumbnail = async () => {
      if (!pdfDocument || !canvasRef.current) return;
      
      try {
        setLoading(true);
        const page = await pdfDocument.getPage(pageNumber);
        
        // Cancel previous render task if any
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const viewport = page.getViewport({ scale: 1 });
        const scale = width / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current;
        if (!canvas) return; // Might have unmounted
        
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport
        };
        
        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        
        await renderTask.promise;
      } catch (error: any) {
        if (error.name !== 'RenderingCancelledException') {
          console.error(`Error rendering thumbnail ${pageNumber}:`, error);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    renderThumbnail();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDocument, pageNumber, width]);

  return (
    <div 
      onClick={() => onClick(pageNumber)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0.5rem',
        cursor: 'pointer',
        background: isActive ? 'var(--bs-panel)' : 'transparent',
        borderRadius: '8px',
        transition: 'background 0.2s',
      }}
    >
      <div style={{
        boxShadow: isActive ? '0 0 0 2px var(--bs-accent)' : '0 1px 3px rgba(0,0,0,0.3)',
        borderRadius: '4px',
        overflow: 'hidden',
        background: 'white', // PDF background is white
        position: 'relative',
        minHeight: `${width * 1.3}px`, // approximate aspect ratio until loaded
        width: `${width}px`
      }}>
        <canvas 
          ref={canvasRef} 
          style={{ 
            display: 'block', 
            opacity: loading ? 0.3 : 1,
            transition: 'opacity 0.2s'
          }} 
        />
        {loading && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', 
            transform: 'translate(-50%, -50%)',
            color: 'var(--bs-muted)',
            fontSize: '0.8rem'
          }}>
            ...
          </div>
        )}
      </div>
      <span style={{
        marginTop: '0.5rem',
        fontSize: '0.8rem',
        color: isActive ? 'var(--bs-accent)' : 'var(--bs-muted)',
        fontWeight: isActive ? 600 : 400
      }}>
        Page {pageNumber}
      </span>
    </div>
  );
}
