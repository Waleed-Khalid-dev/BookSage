import { useBookStore } from '../../stores/bookStore';
import { upsertHighlight } from '../../services/dbService';
import { SelectionData } from '../../hooks/useTextSelection';
import { Sparkles, Underline, Strikethrough } from 'lucide-react';

interface HighlightToolbarProps {
  selection: SelectionData | null;
  onHighlightSaved?: () => void;
}

export function HighlightToolbar({ selection, onHighlightSaved }: HighlightToolbarProps) {
  const { bookId, triggerHighlightsRefresh } = useBookStore();

  if (!selection || !selection.viewportRect || selection.pageNum === null || selection.rects.length === 0) {
    return null;
  }

  const handleHighlight = async (color: string, type: 'highlight' | 'underline' | 'strikethrough' = 'highlight') => {
    if (!bookId || selection.pageNum === null) return;

    try {
      const { getHighlightsForBook, upsertHighlight, deleteHighlight } = await import('../../services/dbService');
      
      const allHighlights = await getHighlightsForBook(bookId);
      const pageHighlights = allHighlights.filter(h => h.page_num === selection.pageNum && (h.type || 'highlight') === type);
      
      const getIntersectionArea = (r1: any, r2: any) => {
        const overlapX = Math.max(0, Math.min(r1.left + r1.width, r2.left + r2.width) - Math.max(r1.left, r2.left));
        const overlapY = Math.max(0, Math.min(r1.top + r1.height, r2.top + r2.height) - Math.max(r1.top, r2.top));
        return overlapX * overlapY;
      };

      const selectionArea = selection.rects.reduce((sum, r) => sum + r.width * r.height, 0);
      let totalOverlapAreaForSelection = 0;
      
      const swallowedHighlights: typeof pageHighlights = [];
      const overlappingHighlights: typeof pageHighlights = [];

      for (const hl of pageHighlights) {
        let rects = [];
        try {
          rects = JSON.parse(hl.rects);
        } catch(e) { continue; }
        
        const existingArea = rects.reduce((sum: number, r: any) => sum + r.width * r.height, 0);
        let overlapArea = 0;
        
        for (const r1 of selection.rects) {
          for (const r2 of rects) {
            overlapArea += getIntersectionArea(r1, r2);
          }
        }
        
        if (overlapArea > 0) {
          totalOverlapAreaForSelection += overlapArea;
          if (overlapArea / existingArea > 0.7) {
            swallowedHighlights.push(hl);
          } else {
            overlappingHighlights.push(hl);
          }
        }
      }

      // If the selection is mostly (> 70%) already covered by existing annotations of this type,
      // it means the user is trying to toggle it OFF.
      const isFullyCovered = selectionArea > 0 && (totalOverlapAreaForSelection / selectionArea > 0.7);

      if (isFullyCovered) {
        // Toggle OFF: Delete all highlights that are contributing to this cover.
        for (const hl of [...swallowedHighlights, ...overlappingHighlights]) {
          await deleteHighlight(hl.id);
        }
      } else {
        // Toggle ON / Expand:
        // First delete any highlights that are completely swallowed to avoid duplicates/overlap
        for (const hl of swallowedHighlights) {
          await deleteHighlight(hl.id);
        }
        // Create the new highlight covering the whole selection
        await upsertHighlight({
          id: crypto.randomUUID(),
          book_id: bookId,
          page_num: selection.pageNum,
          color,
          text: selection.text,
          rects: JSON.stringify(selection.rects),
          type,
          created_at: Date.now()
        });
      }
      
      triggerHighlightsRefresh();
      
      if (onHighlightSaved) onHighlightSaved();
      
      // Clear selection
      window.getSelection()?.removeAllRanges();
    } catch (e) {
      console.error('Failed to save highlight:', e);
    }
  };

  const colors = [
    { name: 'yellow', value: 'rgba(255, 255, 0, 0.3)' },
    { name: 'green', value: 'rgba(0, 255, 0, 0.3)' },
    { name: 'blue', value: 'rgba(0, 200, 255, 0.3)' },
    { name: 'pink', value: 'rgba(255, 105, 180, 0.3)' }
  ];

  const handleCopilotAction = (action: string) => {
    // Stub for now. In Phase 6 this will send to AIChatView or open a popup.
    console.log(`Copilot action [${action}] on text: "${selection.text}"`);
    alert(`Copilot [${action}] feature coming in Phase 6!\nSelected: "${selection.text.substring(0, 50)}..."`);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div style={{
      position: 'fixed',
      top: selection.viewportRect.top - 45,
      left: selection.viewportRect.left + (selection.viewportRect.width / 2) - 80,
      background: 'var(--bs-surface)',
      border: '1px solid var(--bs-border)',
      borderRadius: '8px',
      padding: '6px',
      display: 'flex',
      gap: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 9999
    }}>
      {colors.map(c => (
        <button
          key={c.name}
          onClick={() => handleHighlight(c.value)}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: c.value,
            border: `2px solid ${c.value.replace('0.3', '1.0')}`,
            cursor: 'pointer',
            padding: 0
          }}
          title={`Highlight ${c.name}`}
        />
      ))}
      <div style={{ width: '1px', height: '24px', background: 'var(--bs-border)' }}></div>
      <button
        onClick={() => handleHighlight('#e05252', 'underline')}
        style={{ background: 'transparent', border: 'none', color: 'var(--bs-text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 4px' }}
        title="Underline"
      >
        <Underline size={16} />
      </button>
      <button
        onClick={() => handleHighlight('#e05252', 'strikethrough')}
        style={{ background: 'transparent', border: 'none', color: 'var(--bs-text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 4px' }}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </button>
      <div style={{ width: '1px', height: '24px', background: 'var(--bs-border)' }}></div>
      <button 
        onClick={() => handleCopilotAction('Explain')}
        style={{ background: 'transparent', border: 'none', color: 'var(--bs-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 500 }}
      >
        <Sparkles size={14} /> Explain
      </button>
      <button 
        onClick={() => handleCopilotAction('Summarize')}
        style={{ background: 'transparent', border: 'none', color: 'var(--bs-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 500 }}
      >
        <Sparkles size={14} /> Summarize
      </button>
    </div>
  );
}
