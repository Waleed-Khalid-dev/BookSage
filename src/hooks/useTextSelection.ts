import { useEffect } from 'react';

export interface RelativeRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface SelectionData {
  text: string;
  rects: RelativeRect[];
  viewportRect: DOMRect | null;
  pageNum: number | null;
}

export function useTextSelection(onSelection: (data: SelectionData | null) => void) {
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const text = selection.toString().trim();
        const range = selection.getRangeAt(0);
        
        // Find if we are inside a textLayer (which means we are selecting PDF text)
        let container = range.commonAncestorContainer as HTMLElement;
        if (container.nodeType === 3) container = container.parentElement as HTMLElement;
        
        const textLayer = container.closest('.textLayer') as HTMLElement;
        
        if (textLayer) {
          // Calculate rects relative to the textLayer
          const textLayerRect = textLayer.getBoundingClientRect();
          const clientRects = Array.from(range.getClientRects());
          
          const scaleAttr = textLayer.style.getPropertyValue('--scale-factor');
          const scale = scaleAttr ? parseFloat(scaleAttr) : 1.0;

          const relativeRects = clientRects.map(rect => ({
            top: (rect.top - textLayerRect.top) / scale,
            left: (rect.left - textLayerRect.left) / scale,
            width: rect.width / scale,
            height: rect.height / scale
          }));
          
          // Try to extract page number if we passed it as a data attribute or from parent
          // We can put data-page-number on the textLayer
          const pageNumAttr = textLayer.getAttribute('data-page-number');
          const pageNum = pageNumAttr ? parseInt(pageNumAttr, 10) : null;

          onSelection({ 
            text, 
            rects: relativeRects, 
            viewportRect: range.getBoundingClientRect(),
            pageNum
          });
          return;
        }
        
        // Non-PDF selection fallback
        onSelection({ text, rects: [], viewportRect: range.getBoundingClientRect(), pageNum: null });
      } else {
        setTimeout(() => {
           const newSel = window.getSelection();
           if (!newSel || newSel.toString().trim().length === 0) {
             onSelection(null);
           }
        }, 100);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onSelection]);
}
