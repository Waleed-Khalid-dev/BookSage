import React, { useState, useRef, useEffect } from 'react';
import './ModelSelector.css';

export interface ModelOption {
  id: string;
  label: string;
  provider: 'gemini' | 'openai' | 'claude' | 'ollama';
}

const MODEL_GROUPS: { label: string; provider: ModelOption['provider']; models: { id: string; label: string }[] }[] = [
  {
    label: 'Google Gemini',
    provider: 'gemini',
    models: [
      { id: 'gemini-3.6-flash',   label: 'Gemini 3.6 Flash' },
      { id: 'gemini-2.0-flash',   label: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-pro',     label: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash',   label: 'Gemini 1.5 Flash' },
    ],
  },
  {
    label: 'OpenAI',
    provider: 'openai',
    models: [
      { id: 'gpt-4o',       label: 'GPT-4o' },
      { id: 'gpt-4o-mini',  label: 'GPT-4o Mini' },
    ],
  },
  {
    label: 'Anthropic',
    provider: 'claude',
    models: [
      { id: 'claude-sonnet-4',  label: 'Claude Sonnet 4' },
      { id: 'claude-haiku-3',   label: 'Claude Haiku 3' },
    ],
  },
  {
    label: 'Ollama (Local)',
    provider: 'ollama',
    models: [
      { id: 'ollama/llama3', label: 'Llama 3 (local)' },
    ],
  },
];

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string, provider: ModelOption['provider']) => void;
  /** Which providers have API keys configured (show green dot) */
  activeProviders?: Set<string>;
  compact?: boolean;
}

export function ModelSelector({ value, onChange, activeProviders = new Set(['gemini']), compact = false }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentLabel =
    MODEL_GROUPS.flatMap(g => g.models).find(m => m.id === value)?.label ?? value;

  const currentProvider =
    MODEL_GROUPS.find(g => g.models.some(m => m.id === value))?.provider ?? 'gemini';

  const available = activeProviders.has(currentProvider);

  return (
    <div ref={ref} className={`ms-root ${compact ? 'ms-compact' : ''}`}>
      <button
        className="ms-trigger"
        onClick={() => setOpen(o => !o)}
        title="Select AI model"
      >
        <span className={`ms-dot ${available ? 'ms-dot--on' : 'ms-dot--off'}`} />
        <span className="ms-label">{currentLabel}</span>
        <span className="ms-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="ms-dropdown">
          {MODEL_GROUPS.map((group, gi) => {
            const providerActive = activeProviders.has(group.provider);
            return (
              <React.Fragment key={group.provider}>
                {gi > 0 && <div className="ms-separator" />}
                <div className="ms-group-label">{group.label}</div>
                {group.models.map(model => (
                  <button
                    key={model.id}
                    className={`ms-option ${model.id === value ? 'ms-option--active' : ''}`}
                    onClick={() => { onChange(model.id, group.provider); setOpen(false); }}
                  >
                    <span className={`ms-dot ${providerActive ? 'ms-dot--on' : 'ms-dot--off'}`} />
                    <span>{model.label}</span>
                    {!providerActive && <span className="ms-needs-key">Needs key</span>}
                  </button>
                ))}
              </React.Fragment>
            );
          })}
          <div className="ms-separator" />
          <div className="ms-configure">
            Configure keys in <strong>Settings ⚙️</strong>
          </div>
        </div>
      )}
    </div>
  );
}
