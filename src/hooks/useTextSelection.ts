import { useEffect } from 'react';
import { useUiStore } from '../stores/uiStore';

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
  startNonWs?: number;
  lengthNonWs?: number;
}

export function useTextSelection(onSelection: (data: SelectionData | null) => void) {
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const text = selection.toString().trim();
        const range = selection.getRangeAt(0);
        
        // Find if we are inside a textLayer (which means we are selecting PDF text)
        // Use range.startContainer instead of anchorNode so cross-page selections in Continuous Mode still work
        let container = range.startContainer as HTMLElement;
        if (container.nodeType === 3) container = container.parentElement as HTMLElement;
        
        // Ignore selections inside the copilot popup itself
        if (container.closest('.cpp-root') || container.closest('.ctx-root')) {
          return;
        }

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

          import('../utils/domUtils').then(({ getNonWsOffset }) => {
            const startNonWs = getNonWsOffset(textLayer, range.startContainer, range.startOffset);
            const lengthNonWs = text.replace(/\s/g, '').length;
            
            onSelection({ 
              text, 
              rects: relativeRects, 
              viewportRect: range.getBoundingClientRect(),
              pageNum,
              startNonWs,
              lengthNonWs
            });
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
    
    // Track active selection pages during drag to prevent virtualization unmounts
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        useUiStore.getState().setActiveSelectionPages(null);
        return;
      }
      
      const anchorNode = selection.anchorNode;
      const focusNode = selection.focusNode;
      
      if (anchorNode && focusNode) {
        let anchorContainer = anchorNode.nodeType === 3 ? anchorNode.parentElement : anchorNode as HTMLElement;
        let focusContainer = focusNode.nodeType === 3 ? focusNode.parentElement : focusNode as HTMLElement;
        
        const anchorTextLayer = anchorContainer?.closest('.textLayer');
        const focusTextLayer = focusContainer?.closest('.textLayer');
        
        if (anchorTextLayer && focusTextLayer) {
          const anchorPageAttr = anchorTextLayer.getAttribute('data-page-number');
          const focusPageAttr = focusTextLayer.getAttribute('data-page-number');
          
          if (anchorPageAttr && focusPageAttr) {
            const anchorPage = parseInt(anchorPageAttr, 10);
            const focusPage = parseInt(focusPageAttr, 10);
            const minPage = Math.min(anchorPage, focusPage);
            const maxPage = Math.max(anchorPage, focusPage);
            useUiStore.getState().setActiveSelectionPages([minPage, maxPage]);
            return;
          }
        }
      }
      
      // If we got here, it's not a valid PDF multi-page selection
      useUiStore.getState().setActiveSelectionPages(null);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [onSelection]);
}
