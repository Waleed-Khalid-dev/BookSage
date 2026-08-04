import { useBookStore } from '../../stores/bookStore';
import { upsertHighlight } from '../../services/dbService';
import { SelectionData } from '../../hooks/useTextSelection';
import { Sparkles } from 'lucide-react';

interface HighlightToolbarProps {
  selection: SelectionData | null;
  onHighlightSaved?: () => void;
}

export function HighlightToolbar({ selection, onHighlightSaved }: HighlightToolbarProps) {
  const { bookId, triggerHighlightsRefresh } = useBookStore();

  if (!selection || !selection.viewportRect || selection.pageNum === null || selection.rects.length === 0) {
    return null;
  }

  const handleHighlight = async (color: string) => {
    if (!bookId || selection.pageNum === null) return;

    try {
      await upsertHighlight({
        id: crypto.randomUUID(),
        book_id: bookId,
        page_num: selection.pageNum,
        color,
        text: selection.text,
        rects: JSON.stringify(selection.rects),
        created_at: Date.now()
      });
      
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
