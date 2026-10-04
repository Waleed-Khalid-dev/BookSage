import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useChatStore, CopilotPersona } from '../../stores/chatStore';
import './CopilotPersonaSelector.css';

export interface PersonaOption {
  id: CopilotPersona;
  icon: string;
  label: string;
  description: string;
}

export const COPILOT_PERSONAS: PersonaOption[] = [
  {
    id: 'scholar',
    icon: '🎓',
    label: 'Scholar',
    description: 'Deep academic analysis — cites principles, uses precise language.',
  },
  {
    id: 'teacher',
    icon: '👨‍🏫',
    label: 'Teacher',
    description: 'Simple explanations — breaks concepts down with clear analogies.',
  },
  {
    id: 'coach',
    icon: '🔥',
    label: 'Coach',
    description: 'Action-oriented — provides direct, motivational, practical next steps.',
  },
  {
    id: 'devil',
    icon: '🤔',
    label: "Devil's Advocate",
    description: 'Challenges assumptions — explores flaws, counterarguments, and blind spots.',
  },
];

export interface CopilotPersonaSelectorProps {
  className?: string;
  size?: 'normal' | 'compact';
  menuPlacement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

export const CopilotPersonaSelector: React.FC<CopilotPersonaSelectorProps> = ({
  className = '',
  size = 'normal',
  menuPlacement = 'bottom-right',
}) => {
  const { persona, setPersona } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activePersona = COPILOT_PERSONAS.find(p => p.id === persona) || COPILOT_PERSONAS[0];

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (p: CopilotPersona) => {
    setPersona(p);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`bs-persona-selector bs-persona-selector--${size} ${className}`}
      onMouseDown={e => e.stopPropagation()}
    >
      <button
        type="button"
        className={`bs-persona-pill ${isOpen ? 'bs-persona-pill--open' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        title={`Copilot Persona: ${activePersona.label} (${activePersona.description})`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="bs-persona-pill-icon">{activePersona.icon}</span>
        <span className="bs-persona-pill-label">{activePersona.label}</span>
        <ChevronDown size={11} className={`bs-persona-pill-chevron ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className={`bs-persona-menu bs-persona-menu--${menuPlacement}`} role="listbox">
          <div className="bs-persona-menu-header">
            <span>Copilot Persona</span>
          </div>
          <div className="bs-persona-options">
            {COPILOT_PERSONAS.map(opt => {
              const isSelected = opt.id === persona;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`bs-persona-item ${isSelected ? 'bs-persona-item--active' : ''}`}
                  onClick={() => handleSelect(opt.id)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="bs-persona-item-icon">{opt.icon}</span>
                  <div className="bs-persona-item-content">
                    <div className="bs-persona-item-title-row">
                      <span className="bs-persona-item-title">{opt.label}</span>
                      {isSelected && <Check size={13} className="bs-persona-item-check" />}
                    </div>
                    <span className="bs-persona-item-desc">{opt.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
