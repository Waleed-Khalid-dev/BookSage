import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useUiStore } from '../../stores/uiStore';
import './SplitView.css';

interface SplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

export function SplitView({ left, right }: SplitViewProps) {
  const { notesSplitWidth, setNotesSplitWidth } = useUiStore();
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Clamp the width between 20% and 80% to ensure both sides remain usable
    const clampedWidth = Math.min(Math.max(newWidth, 20), 80);
    setNotesSplitWidth(clampedWidth);
  }, [isDragging, setNotesSplitWidth]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="split-view-container" ref={containerRef}>
      <div 
        className="split-view-pane left-pane" 
        style={{ flexBasis: `${notesSplitWidth}%` }}
      >
        {left}
      </div>
      
      <div 
        className={`split-view-divider ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div className="divider-handle"></div>
      </div>
      
      <div 
        className="split-view-pane right-pane"
        style={{ flexBasis: `${100 - notesSplitWidth}%` }}
      >
        {right}
      </div>
    </div>
  );
}
