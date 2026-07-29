import React from 'react';
import { Settings, X, Eye, Check, ChevronDown } from 'lucide-react';
import './_group.css';

export function SettingsDialog() {
  return (
    <div className="booksage-theme fixed inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center font-sans text-[13px] select-none z-50">
      
      {/* Dialog Window */}
      <div className="w-[660px] bg-[var(--bs-panel)] border border-[var(--bs-border-strong)] rounded-lg shadow-2xl flex flex-col overflow-hidden text-[var(--bs-text)]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--bs-border)] bg-[var(--bs-bg)]">
          <div className="flex items-center gap-2 text-[var(--bs-text-bright)]">
            <Settings size={16} className="text-[var(--bs-text-muted)]" />
            <h2 className="font-semibold text-sm tracking-wide">BookSage Settings</h2>
          </div>
          <button className="text-[var(--bs-text-muted)] hover:text-[var(--bs-text-bright)] transition-colors rounded p-1 hover:bg-[var(--bs-surface)]">
            <X size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex h-[420px]">
          <div className="flex-1 flex flex-col">
            {/* Horizontal Tabs */}
            <div className="flex border-b border-[var(--bs-border)] px-4 bg-[var(--bs-bg)]">
              <Tab active>AI Provider</Tab>
              <Tab>Prompt Template</Tab>
              <Tab>Output Schema</Tab>
              <Tab>Chapter Detection</Tab>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--bs-text-bright)] uppercase tracking-wider">Provider</label>
                <div className="relative">
                  <select className="w-full bg-[var(--bs-surface)] border border-[var(--bs-border-strong)] rounded-md px-3 py-2 text-sm text-[var(--bs-text-bright)] outline-none focus:border-[var(--bs-accent)] appearance-none cursor-pointer">
                    <option>Gemini</option>
                    <option>OpenAI</option>
                    <option>Claude</option>
                    <option>Local (Ollama)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--bs-text-muted)] pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--bs-text-bright)] uppercase tracking-wider">API Key</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input 
                      type="password" 
                      value="sk-1234567890abcdef1234567890abcdef" 
                      readOnly
                      className="w-full bg-[var(--bs-surface)] border border-[var(--bs-border-strong)] rounded-md pl-3 pr-10 py-2 text-sm text-[var(--bs-text-bright)] outline-none focus:border-[var(--bs-accent)] booksage-mono tracking-widest placeholder:tracking-normal" 
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--bs-text-muted)] hover:text-[var(--bs-text-bright)] p-1 rounded hover:bg-[var(--bs-surface-hover)]">
                      <Eye size={14} />
                    </button>
                  </div>
                  <button className="bg-[var(--bs-surface)] border border-[var(--bs-border-strong)] rounded-md px-4 py-2 text-sm font-medium hover:bg-[var(--bs-surface-hover)] transition-colors text-[var(--bs-text-bright)] shrink-0">
                    Test Connection
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[var(--bs-done)] bg-[var(--bs-done)]/10 w-fit px-2 py-0.5 rounded border border-[var(--bs-done)]/20">
                  <Check size={12} strokeWidth={3} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Connected</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--bs-text-bright)] uppercase tracking-wider">Model Name</label>
                  <input 
                    type="text" 
                    defaultValue="gemini-1.5-pro" 
                    className="w-full bg-[var(--bs-surface)] border border-[var(--bs-border-strong)] rounded-md px-3 py-2 text-sm text-[var(--bs-text-bright)] outline-none focus:border-[var(--bs-accent)] booksage-mono" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--bs-text-bright)] uppercase tracking-wider">Max Tokens</label>
                  <input 
                    type="number" 
                    defaultValue={4096} 
                    className="w-full bg-[var(--bs-surface)] border border-[var(--bs-border-strong)] rounded-md px-3 py-2 text-sm text-[var(--bs-text-bright)] outline-none focus:border-[var(--bs-accent)] booksage-mono" 
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-[var(--bs-text-bright)] uppercase tracking-wider">Temperature</label>
                  <span className="text-xs text-[var(--bs-text-muted)] booksage-mono bg-[var(--bs-surface)] px-2 py-1 rounded border border-[var(--bs-border-strong)] font-medium">0.3</span>
                </div>
                <div className="relative w-full h-1.5 bg-[var(--bs-surface)] rounded-full border border-[var(--bs-border-strong)]">
                  <div className="absolute left-0 top-0 h-full bg-[var(--bs-accent)] rounded-full" style={{ width: '30%' }}></div>
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow border border-gray-300 cursor-pointer" style={{ left: '30%', transform: 'translate(-50%, -50%)' }}></div>
                </div>
                <div className="flex justify-between text-[10px] font-medium text-[var(--bs-text-muted)] uppercase tracking-wider">
                  <span>Precise (0.0)</span>
                  <span>Creative (1.0)</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--bs-border)] bg-[var(--bs-bg)]">
          <button className="text-[var(--bs-text-muted)] hover:text-[var(--bs-text-bright)] text-sm font-medium transition-colors">
            Reset to Defaults
          </button>
          <div className="flex items-center gap-3">
            <button className="px-5 py-2 rounded-md border border-[var(--bs-border-strong)] text-[var(--bs-text-bright)] bg-[var(--bs-surface)] hover:bg-[var(--bs-surface-hover)] text-sm font-medium transition-colors">
              Cancel
            </button>
            <button className="px-5 py-2 rounded-md bg-[var(--bs-accent)] hover:bg-[var(--bs-accent-hover)] text-white text-sm font-medium shadow-sm transition-colors border border-[var(--bs-accent-hover)]">
              Save Settings
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function Tab({ children, active }: { children: React.ReactNode, active?: boolean }) {
  return (
    <button className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${active ? 'border-[var(--bs-accent)] text-[var(--bs-accent)]' : 'border-transparent text-[var(--bs-text-muted)] hover:text-[var(--bs-text-bright)] hover:border-[var(--bs-border-strong)]'}`}>
      {children}
    </button>
  );
}
