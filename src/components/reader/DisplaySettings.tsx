import React, { useState } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { Settings2 } from 'lucide-react';

export function DisplaySettings() {
  const [isOpen, setIsOpen] = useState(false);
  const { readerTheme, setReaderTheme } = useBookStore();

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
        </div>
      )}
    </div>
  );
}
