import { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usePDFContext } from '../../hooks/usePDF';
import { ThumbnailItem } from './ThumbnailItem';

interface ThumbnailListProps {
  onPageSelect: (page: number) => void;
}

export function ThumbnailList({ onPageSelect }: ThumbnailListProps) {
  const { totalPages, currentPage, basePageSize } = usePDFContext();
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Estimate height: width (120) * aspect ratio + padding/text (approx 50px)
  const estimatedHeight = basePageSize 
    ? (120 * (basePageSize.height / basePageSize.width)) + 50 
    : 200;

  const virtualizer = useVirtualizer({
    count: totalPages,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedHeight,
    overscan: 5,
  });

  // Scroll to current page when list mounts if it's far away
  useEffect(() => {
    if (currentPage > 0 && virtualizer) {
      // scrollToIndex can take options. 'center' keeps it in view cleanly.
      virtualizer.scrollToIndex(currentPage - 1, { align: 'center' });
    }
    // We explicitly only want this to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div 
      ref={parentRef} 
      style={{ 
        height: '100%', 
        overflowY: 'auto', 
        overflowX: 'hidden',
        width: '100%'
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const pageNum = virtualItem.index + 1;
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <ThumbnailItem 
                pageNumber={pageNum}
                isActive={currentPage === pageNum}
                onClick={onPageSelect}
                width={120}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
