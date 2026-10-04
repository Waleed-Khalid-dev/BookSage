// src/components/shared/ModalThemePicker.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { ModalTheme, MODAL_THEMES } from '../../stores/bookStore';
import './ModalThemePicker.css';

interface ModalThemePickerProps {
  currentTheme: ModalTheme;
  onSelectTheme: (theme: ModalTheme) => void;
  placement?: 'bottom-left' | 'bottom-right';
}

export const ModalThemePicker: React.FC<ModalThemePickerProps> = ({
  currentTheme,
  onSelectTheme,
  placement = 'bottom-right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const activeOption = MODAL_THEMES.find(t => t.id === currentTheme) || MODAL_THEMES[0];

  return (
    <div className="mtp-container" ref={containerRef} onMouseDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={`mtp-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={`Modal Theme: ${activeOption.label}`}
        aria-label="Select modal theme"
      >
        <span
          className="mtp-swatch-dot"
          style={{ background: activeOption.bgPreview, borderColor: activeOption.accentPreview }}
        />
        <Palette size={13} className="mtp-palette-icon" />
      </button>

      {isOpen && (
        <div className={`mtp-popover mtp-popover--${placement}`}>
          <div className="mtp-popover-title">Modal Color Theme</div>
          <div className="mtp-options-list">
            {MODAL_THEMES.map((theme) => {
              const isSelected = theme.id === currentTheme;
              return (
                <button
                  key={theme.id}
                  type="button"
                  className={`mtp-option-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectTheme(theme.id);
                    setIsOpen(false);
                  }}
                >
                  <span
                    className="mtp-swatch-circle"
                    style={{ background: theme.bgPreview, borderColor: theme.accentPreview }}
                  >
                    <span
                      className="mtp-swatch-accent-dot"
                      style={{ background: theme.accentPreview }}
                    />
                  </span>
                  <span className="mtp-option-label">{theme.label}</span>
                  {isSelected && <Check size={13} className="mtp-check-icon" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
