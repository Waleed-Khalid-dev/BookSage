import { useEffect } from 'react';

// For MVP, this is a placeholder that will hook into keyboard events
// to allow word-by-word highlighting over the text layer.
export function WordHighlighter() {
  useEffect(() => {
    // Keyboard navigation logic would go here
    const handleKeyDown = (e: KeyboardEvent) => {
      // Example: 'ArrowRight' to move highlight next word
      if (e.key === 'ArrowRight') {
         // Advance word
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null; // This is a logic component/overlay
}
