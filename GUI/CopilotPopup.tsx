import React, { useState } from 'react';
import { ChevronDown, Send, Sparkles } from 'lucide-react';
import './_group.css';

const models = [
  { name: 'gemini-2.0-flash', ready: true },
  { name: 'gemini-1.5-pro', ready: true },
  { name: 'gpt-4o', ready: false },
  { name: 'claude-sonnet-4', ready: false },
  { name: 'Ollama (local)', ready: true },
];

export function CopilotPopup() {
  const [prompt, setPrompt] = useState('');
  const [action, setAction] = useState('Summarize');
  const [open, setOpen] = useState(true);
  return (
    <div className="booksage-theme flex h-screen w-full items-center justify-center bg-[var(--bs-bg)] text-[13px] text-[var(--bs-text)]">
      <div className="w-[420px] overflow-visible rounded-[10px] border bg-[var(--bs-copilot-bg)] shadow-[0_8px_32px_rgba(0,0,0,.7),0_0_0_1px_color-mix(in_srgb,var(--bs-accent)_10%,transparent)]" style={{ borderColor: 'var(--bs-copilot-border)' }}>
        <div className="mx-auto mt-2 h-[3px] w-8 rounded-full" style={{ backgroundColor: 'var(--bs-copilot-border)' }} />
        <div className="flex h-8 items-center justify-between px-3">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--bs-text-bright)]"><Sparkles size={12} style={{ color: 'var(--bs-accent)' }} />✦ Copilot</div>
          <button className="text-lg leading-none text-[var(--bs-text-muted)] hover:text-[var(--bs-text-bright)]" aria-label="Close">×</button>
        </div>
        <div className="mx-3 rounded-md bg-[var(--bs-surface)] px-2.5 py-1.5 text-[10px] italic text-[var(--bs-text-muted)]">...keep people off-balance and in the dark by never revealing...</div>
        <div className="flex gap-1.5 overflow-x-auto px-3 py-2">
          {['Summarize', 'Simplify', 'Explain', 'Shorter', 'Longer'].map((item) => (
            <button key={item} onClick={() => setAction(item)} className="shrink-0 rounded-full border px-3 py-1 text-[11px] text-[var(--bs-text-bright)]" style={{ backgroundColor: action === item ? 'var(--bs-accent)' : 'var(--bs-surface)', borderColor: 'var(--bs-border-strong)' }}>{item}</button>
          ))}
        </div>
        <div className="h-px bg-[var(--bs-border)]" />
        <div className="max-h-[200px] overflow-y-auto px-3 py-3 text-[12px] leading-relaxed text-[var(--bs-text)]">
          <strong className="text-[var(--bs-text-bright)]">Summary:</strong> This passage explains Greene's core teaching on concealment strategy. The key insight is that people cannot defend against what they don't see coming. By maintaining an ambiguous exterior, you preserve strategic optionality while others commit prematurely.
        </div>
        <div className="h-px bg-[var(--bs-border)]" />
        <div className="flex gap-2 px-3 py-2">
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-w-0 flex-1 rounded-md border bg-[var(--bs-surface)] px-3 py-2 text-xs text-[var(--bs-text-bright)] outline-none placeholder:text-[var(--bs-text-muted)]" style={{ borderColor: 'var(--bs-border-strong)' }} placeholder="Ask a question..." />
          <button className="flex h-[30px] w-[30px] items-center justify-center rounded bg-[var(--bs-accent)] text-white" aria-label="Send"><Send size={14} /></button>
        </div>
        <div className="relative px-3 pb-3">
          <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-[10px] text-[var(--bs-text-muted)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--bs-done)]" />gemini-2.0-flash<ChevronDown size={12} /></button>
          {open && <div className="absolute bottom-0 left-3 z-10 w-[calc(100%-24px)] translate-y-full rounded-md border bg-[var(--bs-surface)] p-1 shadow-[0_8px_24px_rgba(0,0,0,.6)]" style={{ borderColor: 'var(--bs-border-strong)' }}>
            {models.map((model, index) => <React.Fragment key={model.name}>
              {(index === 2 || index === 4) && <div className="my-1 h-px bg-[var(--bs-border)]" />}
              <div className={`flex items-center gap-2 rounded px-2 py-1.5 text-[11px] ${model.ready && index === 0 ? 'text-[var(--bs-accent)]' : model.ready ? 'text-[var(--bs-text-bright)]' : 'text-[var(--bs-text-muted)]'}`}><span className={`h-1.5 w-1.5 rounded-full ${model.ready ? 'bg-[var(--bs-done)]' : 'bg-[var(--bs-text-muted)]'}`} />{model.name}{!model.ready && <span className="ml-auto text-[10px]">Needs API key</span>}{model.ready && index === 0 && <span className="ml-auto">●</span>}</div>
            </React.Fragment>)}
          </div>}
        </div>
      </div>
    </div>
  );
}