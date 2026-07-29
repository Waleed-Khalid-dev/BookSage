import React, { useState } from 'react';
import {
  BookOpen, Sparkles, FolderOpen, FileText, Scissors, Upload,
  Settings, Filter, Check, Loader2, AlertCircle, Minus, X, Square,
  CheckSquare, Sun, Moon,
} from 'lucide-react';
import './_group.css';

/* ─────────────────────────────────────────
   Donut chart — chapter status breakdown
───────────────────────────────────────── */
function DonutChart() {
  const R = 34;
  const CX = 50;
  const CY = 50;
  const CIRC = 2 * Math.PI * R; // ≈ 213.6

  // counts: done=15, processing=1, error=1, pending=31 (total 48)
  const segments = [
    { value: 15, color: 'var(--bs-done)',    label: 'Done' },
    { value: 1,  color: 'var(--bs-process)', label: 'Processing' },
    { value: 1,  color: 'var(--bs-error)',   label: 'Error' },
    { value: 31, color: 'var(--bs-chart-pending)', label: 'Pending' },
  ];
  const total = 48;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const dash = (seg.value / total) * CIRC;
    const gap  = CIRC - dash;
    const startOffset = CIRC - offset; // SVG stroke-dashoffset trick
    offset += dash;
    return { ...seg, dash, gap, startOffset };
  });

  return (
    <div className="flex items-center gap-3">
      {/* SVG donut */}
      <svg width="72" height="72" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={a.color}
            strokeWidth="14"
            strokeDasharray={`${a.dash} ${a.gap}`}
            strokeDashoffset={a.startOffset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      {/* Legend */}
      <div className="flex flex-col gap-1 text-[10px]">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-[var(--bs-text-muted)]">{s.label}</span>
            <span className="ml-auto pl-2 font-medium text-[var(--bs-text-bright)] booksage-mono">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Bar chart — chapters processed per day
───────────────────────────────────────── */
function ActivityBarChart() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const values = [3, 5, 2, 7, 8, 6, 0];
  const max = 8;
  const barW = 16;
  const gap = 8;
  const chartH = 44;
  const totalW = days.length * barW + (days.length - 1) * gap;

  return (
    <div>
      <svg width={totalW} height={chartH + 16} style={{ overflow: 'visible' }}>
        {values.map((v, i) => {
          const barH = v === 0 ? 2 : Math.max(3, (v / max) * chartH);
          const x = i * (barW + gap);
          const y = chartH - barH;
          const isCurrent = i === 6;
          return (
            <g key={i}>
              <rect
                x={x} y={y} width={barW} height={barH}
                rx={3} ry={3}
                fill={isCurrent ? 'var(--bs-chart-bar-dim)' : 'var(--bs-chart-bar)'}
              />
              <text
                x={x + barW / 2} y={chartH + 12}
                textAnchor="middle"
                fontSize="8"
                fill="var(--bs-text-muted)"
                fontFamily="Inter, sans-serif"
              >
                {days[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────
   Theme toggle pill
───────────────────────────────────────── */
function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors hover:bg-[var(--bs-surface-hover)]"
    >
      <Sun size={13} style={{ color: isDark ? 'var(--bs-text-muted)' : 'var(--bs-accent)' }} />
      {/* Pill */}
      <div
        className="bs-toggle-pill relative rounded-full shrink-0"
        style={{
          width: 32,
          height: 16,
          backgroundColor: isDark ? 'var(--bs-surface-hover)' : 'var(--bs-accent)',
        }}
      >
        <div
          className="bs-toggle-thumb absolute top-[2px] w-3 h-3 rounded-full bg-white shadow-sm"
          style={{ transform: isDark ? 'translateX(2px)' : 'translateX(18px)' }}
        />
      </div>
      <Moon size={13} style={{ color: isDark ? 'var(--bs-accent)' : 'var(--bs-text-muted)' }} />
    </button>
  );
}

/* ─────────────────────────────────────────
   Main export
───────────────────────────────────────── */
export function MainWindow() {
  const [isDark, setIsDark] = useState(true);

  const chapters = [
    { num: 1,  title: 'Never Outshine the Master',             pp: '1–14',    status: 'done' },
    { num: 2,  title: 'Never Put Too Much Trust in Friends',   pp: '15–26',   status: 'done' },
    { num: 3,  title: 'Conceal Your Intentions',               pp: '27–38',   status: 'done' },
    { num: 4,  title: 'Always Say Less Than Necessary',        pp: '39–48',   status: 'process' },
    { num: 5,  title: 'So Much Depends on Reputation',         pp: '49–62',   status: 'done' },
    { num: 6,  title: 'Court Attention at All Costs',          pp: '63–78',   status: 'none' },
    { num: 7,  title: 'Get Others to Do the Work…',           pp: '79–90',   status: 'error' },
    { num: 8,  title: 'Make Other People Come to You',         pp: '91–102',  status: 'none' },
    { num: 9,  title: 'Win Through Actions, Never Argument',   pp: '103–118', status: 'none' },
    { num: 10, title: 'Infection: Avoid the Unhappy',          pp: '119–130', status: 'none' },
  ];

  return (
    <div
      className={`booksage-theme${isDark ? '' : ' booksage-light'} flex flex-col w-full h-screen overflow-hidden text-[13px] select-none`}
      style={{ backgroundColor: 'var(--bs-bg)', color: 'var(--bs-text)' }}
    >
      {/* ── Title Bar ── */}
      <div
        className="flex items-center justify-between h-8 shrink-0 px-3 border-b border-[var(--bs-border)]"
        style={{ backgroundColor: 'var(--bs-bg)' }}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center text-[var(--bs-accent)]">
            <BookOpen size={14} />
            <Sparkles size={10} className="-ml-1 -mt-2" />
          </div>
          <span className="font-semibold text-[var(--bs-text-bright)] text-xs">BookSage</span>
          <span className="text-[var(--bs-text-muted)] text-xs">– PDF to Obsidian Lessons</span>
        </div>
        <div className="flex items-center gap-3 text-[var(--bs-text-muted)]">
          <Minus size={14} className="hover:text-[var(--bs-text-bright)] cursor-default" />
          <Square size={12} className="hover:text-[var(--bs-text-bright)] cursor-default" />
          <X size={14} className="hover:text-[var(--bs-text-bright)] cursor-default" />
        </div>
      </div>

      {/* ── Top Toolbar ── */}
      <div
        className="flex items-center h-12 shrink-0 px-2 border-b border-[var(--bs-border)]"
        style={{ backgroundColor: 'var(--bs-panel)' }}
      >
        <div className="flex items-center gap-1">
          <ToolbarButton icon={<FolderOpen size={16} />} label="Open PDF" />
          <ToolbarButton icon={<FileText size={16} />} label="Extract Text" />
          <ToolbarButton icon={<Scissors size={16} />} label="Split Chapters" />
        </div>

        <div className="w-px h-6 mx-2" style={{ backgroundColor: 'var(--bs-border-strong)' }} />

        <div className="flex items-center gap-1">
          <ToolbarButton icon={<Sparkles size={16} />} label="Generate Lessons" primary />
          <ToolbarButton icon={<Upload size={16} />} label="Export All" />
        </div>

        <div className="flex-1" />

        {/* Theme toggle lives right before Settings */}
        <div className="flex items-center gap-1">
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark((d) => !d)} />
          <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--bs-border-strong)' }} />
          <ToolbarButton icon={<Settings size={16} />} label="Settings" />
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Panel – Chapter List */}
        <div
          className="w-[22%] flex flex-col border-r border-[var(--bs-border)] min-w-[240px]"
          style={{ backgroundColor: 'var(--bs-panel)' }}
        >
          <div className="flex items-center justify-between h-8 px-3 border-b border-[var(--bs-border)] shrink-0">
            <span className="font-semibold text-xs text-[var(--bs-text-bright)]">Chapters (48)</span>
            <Filter size={14} className="text-[var(--bs-text-muted)] hover:text-[var(--bs-text-bright)] cursor-default" />
          </div>
          <div className="flex-1 overflow-y-auto relative">
            {chapters.map((c, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-1.5 border-b border-[var(--bs-border)] hover:bg-[var(--bs-surface)] cursor-default ${c.num === 3 ? 'bg-[var(--bs-surface)]' : ''}`}
              >
                <div className="text-[var(--bs-text-muted)] mt-0.5 shrink-0">
                  {c.num <= 5 && c.num !== 4
                    ? <CheckSquare size={14} className="text-[var(--bs-accent)]" />
                    : <Square size={14} />}
                </div>
                <span className="text-[10px] text-[var(--bs-text-muted)] w-4 text-right shrink-0">{c.num}</span>
                <span
                  className="flex-1 truncate text-xs"
                  style={{ color: c.num === 3 ? 'var(--bs-text-bright)' : 'inherit' }}
                >
                  {c.title}
                </span>
                <span className="text-[10px] text-[var(--bs-text-muted)] shrink-0">{c.pp}</span>
                <StatusBadge status={c.status} />
              </div>
            ))}

            {/* Context menu on Law 7 */}
            <div
              className="absolute top-[180px] left-10 w-40 rounded-md border border-[var(--bs-border-strong)] shadow-lg py-1 z-10 flex flex-col shadow-black/50"
              style={{ backgroundColor: 'var(--bs-surface)' }}
            >
              {['Preview raw text', 'Re-extract', 'Edit markdown'].map((item) => (
                <div
                  key={item}
                  className="px-3 py-1.5 cursor-default text-xs text-[var(--bs-text-bright)] hover:bg-[var(--bs-accent)] hover:text-white"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Panel – Preview/Editor */}
        <div
          className="w-[52%] flex flex-col border-r border-[var(--bs-border)] relative min-w-[400px]"
          style={{ backgroundColor: 'var(--bs-bg)' }}
        >
          {/* Tabs */}
          <div
            className="flex h-9 border-b border-[var(--bs-border)] px-2 shrink-0"
            style={{ backgroundColor: 'var(--bs-panel)' }}
          >
            {['Raw Text', 'AI Output', 'Markdown Source'].map((tab) => (
              <div
                key={tab}
                className={`px-4 py-2 text-xs cursor-default ${tab === 'AI Output'
                  ? 'text-[var(--bs-accent)] border-b-2 border-[var(--bs-accent)] font-medium'
                  : 'text-[var(--bs-text-muted)] hover:text-[var(--bs-text-bright)]'}`}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 pb-16">
            <div className="max-w-2xl mx-auto space-y-6 text-[14px] leading-relaxed text-[var(--bs-text)]">
              <h1 className="text-2xl font-bold text-[var(--bs-text-bright)] mb-6 tracking-tight">
                Law 3: Conceal Your Intentions
              </h1>

              <div className="border-l-4 border-[var(--bs-accent)] pl-4 py-3 rounded-r-md" style={{ backgroundColor: 'var(--bs-surface)' }}>
                <p className="font-medium text-[var(--bs-text-bright)] mb-1 uppercase tracking-wider text-xs">Core Principle</p>
                <p className="text-sm">Keep people off-balance and in the dark by never revealing the purpose behind your actions. If they have no clue what you are up to, they cannot prepare a defense.</p>
              </div>

              <p>Guide them far enough down the wrong path, envelop them in enough smoke, and by the time they realize your intentions, it will be too late. The best deceivers do not rely on elaborate lies, but on plausible fronts that mask their true goals.</p>

              <h2 className="text-lg font-semibold text-[var(--bs-text-bright)] mt-8 border-b border-[var(--bs-border)] pb-2">Key Tactics</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong className="text-[var(--bs-text-bright)] font-semibold">Use Decoys:</strong> Feign interest in something you do not actually want to distract from your true target.</li>
                <li><strong className="text-[var(--bs-text-bright)] font-semibold">Maintain a Bland Exterior:</strong> Hide your brilliant ideas behind a facade of normalcy and predictable behavior.</li>
                <li><strong className="text-[var(--bs-text-bright)] font-semibold">The Smoke Screen:</strong> Create a pattern of actions that obscures your ultimate objective.</li>
              </ol>

              <h2 className="text-lg font-semibold text-[var(--bs-text-bright)] mt-8 border-b border-[var(--bs-border)] pb-2">Historical Example</h2>
              <p>In 1850, Otto von Bismarck delivered a passionate speech ostensibly defending conservative policies. His true intention was to gain favor and secure a cabinet position — from which he later orchestrated the very war against Austria he had previously condemned.</p>

              <h2 className="text-lg font-semibold text-[var(--bs-text-bright)] mt-8 border-b border-[var(--bs-border)] pb-2">Modern Application</h2>
              <p>In negotiations, revealing your bottom line too early gives the counterparty leverage. Display equal interest in secondary terms — then concede them in exchange for your true objective, making it appear as a compromise.</p>

              <div className="flex gap-2 mt-8 pt-4">
                {['#power', '#strategy', '#deception'].map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded text-xs border border-[var(--bs-border-strong)]"
                    style={{ backgroundColor: 'var(--bs-surface)', color: 'var(--bs-accent)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Word count bar */}
          <div
            className="absolute bottom-0 right-0 left-0 h-7 border-t border-[var(--bs-border)] flex items-center justify-end px-4 z-10"
            style={{ backgroundColor: 'var(--bs-panel)' }}
          >
            <span className="text-[10px] text-[var(--bs-text-muted)]">847 words · 4,231 chars</span>
          </div>
        </div>

        {/* Right Panel – Export & Vault */}
        <div
          className="w-[26%] flex flex-col min-w-[280px]"
          style={{ backgroundColor: 'var(--bs-panel)' }}
        >
          <div className="p-4 space-y-5 flex-1 overflow-y-auto">

            {/* Project Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-[var(--bs-text-muted)] uppercase tracking-wider">Project Name</label>
              <input
                type="text" defaultValue="48 Laws of Power" readOnly
                className="w-full border rounded px-3 py-1.5 text-sm text-[var(--bs-text-bright)] outline-none"
                style={{ backgroundColor: 'var(--bs-surface)', borderColor: 'var(--bs-border-strong)' }}
              />
            </div>

            {/* Output Folder */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-[var(--bs-text-muted)] uppercase tracking-wider">Output Folder</label>
              <div className="flex gap-2">
                <input
                  type="text" defaultValue="~/Documents/Obsidian/BookNotes/" readOnly
                  className="flex-1 min-w-0 border rounded px-3 py-1.5 text-xs text-[var(--bs-text)] outline-none text-ellipsis"
                  style={{ backgroundColor: 'var(--bs-surface)', borderColor: 'var(--bs-border-strong)' }}
                />
                <button
                  className="border rounded px-3 py-1.5 text-xs hover:bg-[var(--bs-surface-hover)] transition-colors text-[var(--bs-text-bright)] shrink-0"
                  style={{ backgroundColor: 'var(--bs-surface)', borderColor: 'var(--bs-border-strong)' }}
                >
                  Change...
                </button>
              </div>
            </div>

            {/* Vault Sync */}
            <div className="p-3 rounded border border-[var(--bs-border-strong)]" style={{ backgroundColor: 'var(--bs-surface)' }}>
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--bs-done) 15%, transparent)' }}
                >
                  <Check size={12} style={{ color: 'var(--bs-done)' }} />
                </div>
                <span className="text-sm font-medium text-[var(--bs-text-bright)]">Vault Sync Ready</span>
              </div>
              <p className="text-xs text-[var(--bs-text-muted)] pl-7 mt-1">Will save to Vault/BookNotes/48Laws</p>
            </div>

            {/* Export button */}
            <button
              className="w-full font-medium py-2.5 rounded shadow-sm transition-colors flex items-center justify-center gap-2 text-sm text-white"
              style={{ backgroundColor: 'var(--bs-accent)' }}
            >
              <Upload size={16} />
              Export All to Obsidian
            </button>

            {/* ── Progress bar ── */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--bs-text-bright)]">Export Progress</span>
                <span className="text-[var(--bs-text-muted)] font-medium booksage-mono">15 / 48</span>
              </div>
              <div
                className="h-1.5 w-full rounded-full overflow-hidden border"
                style={{ backgroundColor: 'var(--bs-surface)', borderColor: 'var(--bs-border-strong)' }}
              >
                <div className="h-full rounded-full" style={{ width: '31%', backgroundColor: 'var(--bs-accent)' }} />
              </div>
            </div>

            {/* ── Charts section ── */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[var(--bs-text-muted)] uppercase tracking-wider">Chapter Status</span>
                <span className="text-[10px] text-[var(--bs-text-muted)] booksage-mono">48 total</span>
              </div>
              <DonutChart />
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[var(--bs-text-muted)] uppercase tracking-wider">Processing Activity</span>
                <span className="text-[10px] text-[var(--bs-text-muted)]">last 7 days</span>
              </div>
              <ActivityBarChart />
            </div>

            {/* ── Export log ── */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-[var(--bs-text-muted)] uppercase tracking-wider">Export Log</label>
              <div
                className="h-[130px] border rounded p-2.5 text-[10px] booksage-mono leading-[1.6] overflow-y-auto"
                style={{ backgroundColor: 'var(--bs-log-bg)', borderColor: 'var(--bs-border-strong)' }}
              >
                <div className="text-[var(--bs-text-muted)] whitespace-nowrap">
                  <span className="text-[var(--bs-text-muted)] opacity-50">[10:42:01]</span>{' '}
                  <span style={{ color: 'var(--bs-done)' }}>✓</span> Law 1 exported → 48Laws/law-01-never-outshine.md
                </div>
                <div className="text-[var(--bs-text-muted)] whitespace-nowrap">
                  <span className="text-[var(--bs-text-muted)] opacity-50">[10:42:03]</span>{' '}
                  <span style={{ color: 'var(--bs-done)' }}>✓</span> Law 2 exported → 48Laws/law-02-never-trust-friends.md
                </div>
                <div className="text-[var(--bs-text-muted)] whitespace-nowrap">
                  <span className="text-[var(--bs-text-muted)] opacity-50">[10:42:05]</span>{' '}
                  <span style={{ color: 'var(--bs-done)' }}>✓</span> Law 3 exported → 48Laws/law-03-conceal-intentions.md
                </div>
                <div className="whitespace-nowrap" style={{ color: 'var(--bs-process)' }}>
                  <span className="text-[var(--bs-text-muted)] opacity-50">[10:42:07]</span>{' '}
                  ⟳ Law 4 processing... (AI generation)
                </div>
                <div className="whitespace-nowrap" style={{ color: 'var(--bs-error)' }}>
                  <span className="text-[var(--bs-text-muted)] opacity-50">[10:42:08]</span>{' '}
                  ✗ Law 7 failed: API timeout — will retry
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div
        className="flex items-center h-6 shrink-0 px-3 border-t border-[var(--bs-border)] text-[10px] text-[var(--bs-text-muted)] gap-4"
        style={{ backgroundColor: 'var(--bs-bg)' }}
      >
        <span>PDF loaded: <strong className="font-medium text-[var(--bs-text-bright)]">48_laws.pdf</strong></span>
        <span className="w-px h-3 bg-[var(--bs-border-strong)]" />
        <span>48 chapters detected</span>
        <span className="w-px h-3 bg-[var(--bs-border-strong)]" />
        <span>15 chapters processed</span>
        <div className="flex-1" />
        <span>Model: <span className="text-[var(--bs-text)]">gemini-1.5-pro</span></span>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function ToolbarButton({ icon, label, primary = false }: { icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <button
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors border ${
        primary
          ? 'border-[var(--bs-accent)]/30 text-[var(--bs-accent)]'
          : 'border-transparent text-[var(--bs-text)] hover:bg-[var(--bs-surface-hover)]'
      }`}
      style={primary ? { backgroundColor: 'color-mix(in srgb, var(--bs-accent) 10%, transparent)' } : {}}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'done':
      return (
        <div className="flex items-center justify-center w-[18px] h-[18px] rounded-full shrink-0"
          style={{ backgroundColor: 'color-mix(in srgb, var(--bs-done) 12%, transparent)', color: 'var(--bs-done)' }}>
          <Check size={10} strokeWidth={3} />
        </div>
      );
    case 'process':
      return (
        <div className="flex items-center justify-center w-[18px] h-[18px] rounded-full shrink-0"
          style={{ backgroundColor: 'color-mix(in srgb, var(--bs-process) 12%, transparent)', color: 'var(--bs-process)' }}>
          <Loader2 size={10} className="animate-spin" strokeWidth={3} />
        </div>
      );
    case 'error':
      return (
        <div className="flex items-center justify-center w-[18px] h-[18px] rounded-full shrink-0"
          style={{ backgroundColor: 'color-mix(in srgb, var(--bs-error) 12%, transparent)', color: 'var(--bs-error)' }}>
          <AlertCircle size={10} strokeWidth={3} />
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center w-[18px] h-[18px] shrink-0 text-[var(--bs-border-strong)]">—</div>
      );
  }
}
