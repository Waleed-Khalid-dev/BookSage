import { useState } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { Settings2 } from 'lucide-react';

export function DisplaySettings() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    readerTheme,    setReaderTheme,
    invertPdfColors,
    setInvertPdfColors,
    pdfTintColor,
    setPdfTintColor,
    pdfTextColor,
    setPdfTextColor,
    pdfMarginCrop,
    setPdfMarginCrop,
    highlightOpacity,
    setHighlightOpacity
  } = useBookStore();

  const themes = [
    { id: 'dark', label: 'Dark (Default)' },
    { id: 'light', label: 'Light' },
    { id: 'sepia', label: 'Sepia' },
    { id: 'night', label: 'Night' },
    { id: 'oled', label: 'OLED' },
    { id: 'focus', label: 'Focus' }
  ];

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="icon-btn" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: isOpen ? 'var(--bs-surface)' : 'transparent',
          color: 'var(--bs-text)',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px'
        }}
        title="Display Settings"
      >
        <Settings2 size={20} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          background: 'var(--bs-surface)',
          border: '1px solid var(--bs-border)',
          borderRadius: '8px',
          padding: '1rem',
          minWidth: '200px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          zIndex: 100
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--bs-heading)' }}>Theme</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => setReaderTheme(t.id as any)}
                style={{
                  padding: '0.5rem',
                  textAlign: 'left',
                  borderRadius: '4px',
                  border: `1px solid ${readerTheme === t.id ? 'var(--bs-accent)' : 'var(--bs-border)'}`,
                  background: readerTheme === t.id ? 'var(--bs-panel)' : 'transparent',
                  color: 'var(--bs-text)',
                  cursor: 'pointer'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--bs-border)', margin: '1rem 0' }} />

          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--bs-heading)' }}>PDF Rendering</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--bs-text)' }}>
              <input 
                type="checkbox" 
                checked={invertPdfColors}
                onChange={(e) => setInvertPdfColors(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Invert PDF Colors
            </label>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
              <span style={{ color: 'var(--bs-text)', fontSize: '0.9rem' }}>PDF BG Tint:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="color" 
                  value={pdfTintColor || '#ffffff'}
                  onChange={(e) => setPdfTintColor(e.target.value)}
                  style={{ width: '24px', height: '24px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                  title="Choose PDF BG Tint"
                />
                {pdfTintColor && (
                  <button 
                    onClick={() => setPdfTintColor('')}
                    style={{ background: 'transparent', border: '1px solid var(--bs-border)', color: 'var(--bs-text-muted)', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
              <span style={{ color: 'var(--bs-text)', fontSize: '0.9rem' }}>PDF Text Tint:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="color" 
                  value={pdfTextColor || '#000000'}
                  onChange={(e) => setPdfTextColor(e.target.value)}
                  style={{ width: '24px', height: '24px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                  title="Choose PDF Text Tint"
                />
                {pdfTextColor && (
                  <button 
                    onClick={() => setPdfTextColor('')}
                    style={{ background: 'transparent', border: '1px solid var(--bs-border)', color: 'var(--bs-text-muted)', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--bs-text)', fontSize: '0.9rem' }}>Margin Crop:</span>
                <span style={{ color: 'var(--bs-text-muted)', fontSize: '0.8rem' }}>{pdfMarginCrop}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="25" step="1"
                value={pdfMarginCrop}
                onChange={(e) => setPdfMarginCrop(parseInt(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--bs-text)', fontSize: '0.9rem' }}>Highlight Opacity:</span>
                <span style={{ color: 'var(--bs-text-muted)', fontSize: '0.8rem' }}>{Math.round(highlightOpacity * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0.1" max="1.0" step="0.05"
                value={highlightOpacity}
                onChange={(e) => setHighlightOpacity(parseFloat(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
