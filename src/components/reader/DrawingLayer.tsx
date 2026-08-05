import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { getDrawingsForBook, DrawingRecord } from '../../services/dbService';

interface DrawingLayerProps {
  pageNumber: number;
  scale: number;
  width?: number;
  height?: number;
}

interface Point {
  x: number;
  y: number;
}

export function DrawingLayer({ pageNumber, scale, width, height }: DrawingLayerProps) {
  const { bookId, isDrawingMode, drawingColor, drawingTool, penSize, eraserSize, addDrawingAction, deleteDrawingAction } = useBookStore();
  
  // Actually we need to listen to drawingsRefreshCounter but Zustand store doesn't expose it individually if we don't select it.
  const drawingsRefreshCounter = useBookStore(s => (s as any).drawingsRefreshCounter || 0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawings, setDrawings] = useState<DrawingRecord[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPathRef = useRef<Point[]>([]);

  // Load drawings from DB
  useEffect(() => {
    if (!bookId) return;
    getDrawingsForBook(bookId).then(allDrawings => {
      const pageDrawings = allDrawings.filter(d => d.page_num === pageNumber);
      setDrawings(pageDrawings);
    });
  }, [bookId, pageNumber, drawingsRefreshCounter]);

  // Render all drawings onto the canvas
  const renderDrawings = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Scale ctx to match the visual scale for saved paths
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw saved drawings
    for (const drawing of drawings) {
      try {
        const path: Point[] = JSON.parse(drawing.path_data);
        if (path.length === 0) continue;

        ctx.beginPath();
        ctx.strokeStyle = drawing.color;
        ctx.lineWidth = drawing.stroke_width * scale;
        
        ctx.moveTo(path[0].x * scale, path[0].y * scale);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x * scale, path[i].y * scale);
        }
        ctx.stroke();
      } catch (e) {
        console.error("Failed to parse drawing path", e);
      }
    }

    // Draw current active path
    if (isDrawing && currentPathRef.current.length > 0) {
      const path = currentPathRef.current;
      ctx.beginPath();
      ctx.strokeStyle = drawingColor;
      ctx.lineWidth = penSize * scale;
      
      ctx.moveTo(path[0].x * scale, path[0].y * scale);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x * scale, path[i].y * scale);
      }
      ctx.stroke();
    }
  }, [drawings, scale, isDrawing, drawingColor, width, height]);

  useEffect(() => {
    renderDrawings();
  }, [renderDrawings]);

  // Handle drawing events
  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // X,Y relative to scale 1.0
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    };
  };

  const dist2 = (v: Point, w: Point) => Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
  const distToSegmentSquared = (p: Point, v: Point, w: Point) => {
    const l2 = dist2(v, w);
    if (l2 === 0) return dist2(p, v);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
  };

  const checkEraser = (pos: Point) => {
    const thresholdSq = Math.pow(eraserSize / scale, 2);
    let erasedAny = false;
    
    // Create a new array of drawings to keep
    const nextDrawings = [];
    
    for (const drawing of drawings) {
      let hit = false;
      try {
        const path: Point[] = JSON.parse(drawing.path_data);
        if (path.length === 1) {
          if (dist2(pos, path[0]) < thresholdSq) hit = true;
        } else {
          for (let i = 0; i < path.length - 1; i++) {
            if (distToSegmentSquared(pos, path[i], path[i+1]) < thresholdSq) {
              hit = true;
              break;
            }
          }
        }
      } catch(e) {}
      
      if (hit) {
        deleteDrawingAction(drawing);
        erasedAny = true;
      } else {
        nextDrawings.push(drawing);
      }
    }
    
    if (erasedAny) {
      setDrawings(nextDrawings);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || e.button !== 0) return;
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPointerPos(e);
    
    if (drawingTool === 'eraser') {
      checkEraser(pos);
    } else {
      currentPathRef.current = [pos];
      renderDrawings();
    }
    
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !isDrawing) return;
    e.preventDefault();
    const pos = getPointerPos(e);
    
    if (drawingTool === 'eraser') {
      checkEraser(pos);
    } else {
      currentPathRef.current.push(pos);
      renderDrawings();
    }
  };

  const handlePointerUp = async (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
    (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);

    if (drawingTool === 'eraser') return;

    const path = currentPathRef.current;
    if (path.length > 0 && bookId) {
      try {
        const drawing = {
          id: crypto.randomUUID(),
          book_id: bookId,
          page_num: pageNumber,
          path_data: JSON.stringify(path),
          color: drawingColor,
          stroke_width: penSize,
          created_at: Date.now()
        };
        await addDrawingAction(drawing);
      } catch (err) {
        console.error("Failed to save drawing", err);
      }
    }
    currentPathRef.current = [];
  };

  return (
    <canvas
      ref={canvasRef}
      width={width ? width * scale : 0}
      height={height ? height * scale : 0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: isDrawingMode ? 'auto' : 'none',
        zIndex: 5, // Above highlights, below text layer (text layer will have pointerEvents:none during drawing)
        touchAction: isDrawingMode ? 'none' : 'auto' // Prevent scrolling while drawing on touch devices
      }}
    />
  );
}
