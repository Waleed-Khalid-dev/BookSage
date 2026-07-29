import React from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import './_group.css';

export function ContextMenu() {
  const actions = ['Summarize', 'Simplify', 'Explain like I am 5', 'Make shorter', 'Make longer', 'Fix grammar and spelling'];
  return (
    <div className="booksage-theme relative flex h-screen w-full items-center justify-center overflow-hidden bg-[var(--bs-bg)] text-[13px]">
      <div className="absolute max-w-[560px] text-xl leading-relaxed text-[var(--bs-text-muted)]">
        Keep people <span className="rounded-sm bg-[color-mix(in_srgb,var(--bs-accent)_35%,transparent)] text-[var(--bs-text-bright)]">off-balance and in the dark</span> by never revealing the purpose behind your actions.
      </div>
      <div className="relative z-10 w-[220px] rounded-lg border bg-[var(--bs-surface)] p-1 text-[var(--bs-text-bright)] shadow-[0_8px_24px_rgba(0,0,0,.6)]" style={{ borderColor: 'var(--bs-border-strong)' }}>
        <div className="rounded px-2 py-1.5 text-[var(--bs-text)]">Add selection to chat context</div>
        <div className="rounded px-2 py-1.5 text-[var(--bs-text)]">Quick Ask</div>
        <div className="my-1 h-px bg-[var(--bs-border)]" />
        <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--bs-accent)]"><Sparkles size={12} />Copilot</div>
        {actions.map((label) => <div key={label} className={`flex items-center justify-between rounded px-2.5 py-1.5 ${label === 'Simplify' ? 'bg-[var(--bs-accent)] text-white' : 'text-[var(--bs-text)] hover:bg-[var(--bs-accent)] hover:text-white'}`}>{label}<ChevronRight size={13} /></div>)}
        <div className="group relative flex items-center justify-between rounded px-2.5 py-1.5 text-[var(--bs-text)] hover:bg-[var(--bs-accent)] hover:text-white">Translate to...<ChevronRight size={13} />
          <div className="absolute left-full top-0 ml-1 hidden w-28 rounded-md border bg-[var(--bs-surface)] p-1 shadow-[0_8px_24px_rgba(0,0,0,.6)] group-hover:block" style={{ borderColor: 'var(--bs-border-strong)' }}>
            {['中文', 'Spanish', 'French', 'Arabic'].map((language) => <div key={language} className="rounded px-2 py-1.5 text-[var(--bs-text)] hover:bg-[var(--bs-accent)] hover:text-white">{language}</div>)}
          </div>
        </div>
        <div className="my-1 h-px bg-[var(--bs-border)]" />
        <div className="rounded px-2 py-1.5 text-[var(--bs-text)]">Copy</div>
        <div className="rounded px-2 py-1.5 text-[var(--bs-text)]">Copy as Markdown</div>
      </div>
    </div>
  );
}