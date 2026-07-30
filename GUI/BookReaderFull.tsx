import React, { useState } from 'react';
import {
  Filter, Sparkles, BookOpen, FileText, ArrowLeft, ArrowRight,
  ZoomIn, ZoomOut, MessageSquare, Download,
} from 'lucide-react';
import './_group.css';

/* ── Chapter data ── */
type ChapterStatus = 'done' | 'processing' | 'pending' | 'error';

interface Chapter {
  num: number;
  title: string;
  pages: string;
  status: ChapterStatus;
}

const CHAPTERS: Chapter[] = [
  { num: 1,  title: 'Never Outshine the Master',           pages: 'pp.1–14',    status: 'done'       },
  { num: 2,  title: 'Never Put Too Much Trust in Friends', pages: 'pp.15–26',   status: 'done'       },
  { num: 3,  title: 'Conceal Your Intentions',             pages: 'pp.27–38',   status: 'done'       },
  { num: 4,  title: 'Always Say Less Than Necessary',      pages: 'pp.39–48',   status: 'processing' },
  { num: 5,  title: 'So Much Depends on Reputation',       pages: 'pp.49–62',   status: 'done'       },
  { num: 6,  title: 'Court Attention at All Costs',        pages: 'pp.63–78',   status: 'pending'    },
  { num: 7,  title: 'Get Others to Do the Work…',         pages: 'pp.79–90',   status: 'error'      },
  { num: 8,  title: 'Make Other People Come to You',       pages: 'pp.91–102',  status: 'pending'    },
  { num: 9,  title: 'Win Through Actions, Not Argument',   pages: 'pp.103–118', status: 'pending'    },
  { num: 10, title: 'Infection: Avoid the Unhappy',        pages: 'pp.119–130', status: 'pending'    },
  { num: 11, title: 'Learn to Keep People Dependent',      pages: 'pp.131–142', status: 'pending'    },
  { num: 12, title: 'Use Selective Honesty',               pages: 'pp.143–152', status: 'pending'    },
];

/* ── Status dot ── */
function StatusDot({ status }: { status: ChapterStatus }) {
  const colorMap: Record<ChapterStatus, string> = {
    done:       'var(--bs-done)',
    processing: 'var(--bs-process)',
    pending:    'var(--bs-border-strong)',
    error:      'var(--bs-error)',
  };
  return (
    <span
      className="shrink-0 inline-block w-[7px] h-[7px] rounded-full"
      style={{ backgroundColor: colorMap[status] }}
    />
  );
}

/* ── Left panel — chapter list ── */
function ChapterList({ active }: { active: number }) {
  return (
    <aside
      className="w-[240px] shrink-0 flex flex-col border-r overflow-hidden"
      style={{ backgroundColor: 'var(--bs-panel)', borderColor: 'var(--bs-border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between h-9 px-3 border-b shrink-0"
        style={{ borderColor: 'var(--bs-border)' }}
      >
        <span className="font-bold text-xs" style={{ color: 'var(--bs-text-bright)' }}>
          Chapters (48)
        </span>
        <Filter size={13} style={{ color: 'var(--bs-text-muted)' }} className="cursor-default" />
      </div>

      {/* Chapter rows */}
      <div className="flex-1 overflow-y-auto">
        {CHAPTERS.map((ch) => {
          const isActive = ch.num === active;
          return (
            <div
              key={ch.num}
              className="flex items-center gap-2 px-3 border-b cursor-default hover:bg-[var(--bs-surface)] transition-colors"
              style={{
                height: 42,
                borderColor: 'var(--bs-border)',
                backgroundColor: isActive ? 'var(--bs-surface)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--bs-accent)' : '2px solid transparent',
              }}
            >
              {/* Chapter number badge */}
              <span
                className="booksage-mono flex items-center justify-center shrink-0 rounded-full text-[10px] font-medium"
                style={{
                  width: 22,
                  height: 22,
                  backgroundColor: 'var(--bs-surface)',
                  color: isActive ? 'var(--bs-accent)' : 'var(--bs-text-muted)',
                  border: '1px solid var(--bs-border-strong)',
                }}
              >
                {ch.num}
              </span>

              {/* Title */}
              <span
                className="flex-1 truncate text-[11px]"
                style={{ color: isActive ? 'var(--bs-text-bright)' : 'var(--bs-text)' }}
              >
                {ch.title}
              </span>

              {/* Page range */}
              <span className="booksage-mono shrink-0 text-[10px]" style={{ color: 'var(--bs-text-muted)' }}>
                {ch.pages}
              </span>

              {/* Status dot */}
              <StatusDot status={ch.status} />
            </div>
          );
        })}
      </div>

      {/* Jump to page */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-t shrink-0"
        style={{ borderColor: 'var(--bs-border)' }}
      >
        <span className="text-[10px]" style={{ color: 'var(--bs-text-muted)' }}>Jump to page</span>
        <input
          type="text"
          defaultValue="27"
          className="booksage-mono w-12 rounded border px-2 py-0.5 text-center text-[11px] outline-none"
          style={{
            backgroundColor: 'var(--bs-surface)',
            borderColor: 'var(--bs-border-strong)',
            color: 'var(--bs-text)',
          }}
        />
      </div>
    </aside>
  );
}

/* ── PDF page content ── */
function PageContent({ showCopilot }: { showCopilot: boolean }) {
  return (
    <div className="overflow-y-auto flex-1 flex justify-center p-8" style={{ backgroundColor: '#111111' }}>
      <article
        className="relative w-full font-serif text-[15px] leading-[1.9]"
        style={{
          maxWidth: 680,
          backgroundColor: '#f3efe5',
          padding: 48,
          boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
          color: '#333',
          fontFamily: 'Georgia, "Times New Roman", serif',
          alignSelf: 'start',
        }}
      >
        <h1
          className="mb-3 font-bold leading-tight"
          style={{ fontSize: 28, fontWeight: 800, color: '#252525', fontFamily: 'inherit' }}
        >
          Conceal Your Intentions
        </h1>
        <p className="mb-5 italic" style={{ color: '#555', fontFamily: 'inherit' }}>
          Keep people{' '}
          <span
            className="relative"
            style={{ backgroundColor: 'rgba(0,150,136,0.25)', borderRadius: 2, padding: '0 2px' }}
          >
            off-balance
            {/* Copilot floating pill */}
            {showCopilot && (
              <span
                className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 text-[11px] text-white font-medium whitespace-nowrap z-10"
                style={{
                  backgroundColor: '#009688',
                  borderRadius: 6,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <Sparkles size={10} />✦ Copilot
              </span>
            )}
          </span>{' '}
          and in the dark by never revealing the purpose behind your actions.
        </p>
        <p className="mb-4" style={{ fontFamily: 'inherit' }}>
          Most people are open books. Their desires, goals, and intentions are written plainly in
          every gesture and expression, making them easy to anticipate — and therefore control. The
          powerful understand that an ambiguous exterior creates room to move.
        </p>
        <p className="mb-4" style={{ fontFamily: 'inherit' }}>
          Guide them far enough down the wrong path, envelop them in enough smoke, and by the time
          they understand your true intention, it will be too late. The best deceivers do not rely on
          elaborate lies — they build plausible fronts that quietly mask their actual goals.
        </p>
        <p className="mb-4" style={{ fontFamily: 'inherit' }}>
          In 1850, Otto von Bismarck delivered a passionate speech defending conservative policies. His
          true intention was entirely different: to secure a cabinet position from which he later
          orchestrated the very policies he publicly denounced. No one saw it coming.
        </p>
        <blockquote
          className="border-l-4 pl-4 italic my-6"
          style={{ borderColor: '#009688', color: '#555' }}
        >
          "The most effective move is to make your intentions invisible — let others fill in the blank
          with their own assumptions."
        </blockquote>
        <p style={{ fontFamily: 'inherit' }}>
          In modern negotiations, revealing your bottom line too early gives the counterparty leverage.
          Display equal interest in secondary terms — then concede them in exchange for your true
          objective, making it appear as a fair compromise.
        </p>
      </article>
    </div>
  );
}

/* ── Right info panel ── */
function InfoPanel() {
  return (
    <aside
      className="w-[280px] shrink-0 flex flex-col border-l overflow-y-auto"
      style={{ backgroundColor: 'var(--bs-panel)', borderColor: 'var(--bs-border)' }}
    >
      <div className="flex flex-col gap-5 p-4">

        {/* Current chapter */}
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-wider" style={{ color: 'var(--bs-text-muted)' }}>
            Current Chapter
          </p>
          <div
            className="rounded-lg border p-3 space-y-1"
            style={{ backgroundColor: 'var(--bs-surface)', borderColor: 'var(--bs-border-strong)' }}
          >
            <p className="font-semibold text-[13px]" style={{ color: 'var(--bs-text-bright)' }}>
              Law 3: Conceal Your Intentions
            </p>
            <p className="text-[11px]" style={{ color: 'var(--bs-text-muted)' }}>Pages 27–38</p>
            <div className="flex items-center gap-1.5 pt-1">
              <span
                className="inline-block w-[7px] h-[7px] rounded-full"
                style={{ backgroundColor: 'var(--bs-done)' }}
              />
              <span className="text-[11px]" style={{ color: 'var(--bs-done)' }}>AI Notes Ready</span>
            </div>
          </div>
        </div>

        {/* AI core lesson */}
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-wider" style={{ color: 'var(--bs-text-muted)' }}>
            AI Core Lesson
          </p>
          <div
            className="p-3 rounded-r-md"
            style={{
              borderLeft: '3px solid var(--bs-accent)',
              backgroundColor: 'var(--bs-surface)',
              borderRadius: '0 6px 6px 0',
            }}
          >
            <p
              className="italic text-[12px] leading-[1.6]"
              style={{ color: 'var(--bs-text)' }}
            >
              Keep people off-balance. Strategic ambiguity preserves room to move while others
              commit prematurely.
            </p>
          </div>
        </div>

        {/* Reading progress */}
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-wider" style={{ color: 'var(--bs-text-muted)' }}>
            Reading Progress
          </p>
          <div className="flex items-baseline gap-2 mb-2">
            <span
              className="booksage-mono font-bold"
              style={{ fontSize: 28, color: 'var(--bs-accent)' }}
            >
              15
            </span>
            <span className="text-xs" style={{ color: 'var(--bs-text-muted)' }}>/ 48 chapters</span>
          </div>
          <div className="h-[4px] w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bs-surface)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: '31%', backgroundColor: 'var(--bs-accent)' }}
            />
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-wider" style={{ color: 'var(--bs-text-muted)' }}>
            Quick Actions
          </p>
          <div className="flex flex-col gap-1.5">
            <QuickAction icon={<FileText size={13} />} label="View Notes" />
            <QuickAction icon={<MessageSquare size={13} />} label="Open AI Chat" />
            <QuickAction icon={<Download size={13} />} label="Export Chapter" danger />
          </div>
        </div>

      </div>
    </aside>
  );
}

function QuickAction({
  icon,
  label,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      className="flex items-center gap-2 w-full rounded-lg border px-3 py-2 text-xs font-medium text-left transition-colors hover:bg-[var(--bs-surface-hover)]"
      style={{
        borderColor: 'var(--bs-border-strong)',
        backgroundColor: 'transparent',
        color: danger ? 'var(--bs-error)' : 'var(--bs-text)',
      }}
    >
      <span style={{ color: danger ? 'var(--bs-error)' : 'var(--bs-accent)' }}>{icon}</span>
      {label}
    </button>
  );
}

/* ── Main export ── */
export function BookReaderFull() {
  const [page, setPage] = useState(3);
  const [zoom, setZoom] = useState(100);
  const [wordMode, setWordMode] = useState(false);
  const [copilotOn, setCopilotOn] = useState(true);
  const totalPages = 48;

  return (
    <div
      className="booksage-theme flex h-screen w-full overflow-hidden text-[13px]"
      style={{ backgroundColor: 'var(--bs-bg)', color: 'var(--bs-text)' }}
    >
      {/* Left: chapter list */}
      <ChapterList active={3} />

      {/* Center: reading area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Reading toolbar */}
        <div
          className="flex items-center h-[44px] shrink-0 px-3 gap-3 border-b"
          style={{ backgroundColor: 'var(--bs-panel)', borderColor: 'var(--bs-border)' }}
        >
          {/* Page navigation */}
          <div className="flex items-center gap-1">
            <ToolbarIconBtn
              icon={<ArrowLeft size={14} />}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            />
            <input
              type="text"
              value={page}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v) && v >= 1 && v <= totalPages) setPage(v);
              }}
              className="booksage-mono rounded border text-center text-xs outline-none"
              style={{
                width: 48,
                backgroundColor: 'var(--bs-surface)',
                borderColor: 'var(--bs-border-strong)',
                color: 'var(--bs-text-bright)',
                padding: '2px 4px',
              }}
            />
            <span className="booksage-mono text-xs" style={{ color: 'var(--bs-text-muted)' }}>
              / {totalPages}
            </span>
            <ToolbarIconBtn
              icon={<ArrowRight size={14} />}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </div>

          {/* Separator */}
          <div className="w-px h-5" style={{ backgroundColor: 'var(--bs-border-strong)' }} />

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <ToolbarIconBtn icon={<ZoomOut size={14} />} onClick={() => setZoom((z) => Math.max(50, z - 10))} />
            <span className="booksage-mono text-xs w-10 text-center" style={{ color: 'var(--bs-text)' }}>
              {zoom}%
            </span>
            <ToolbarIconBtn icon={<ZoomIn size={14} />} onClick={() => setZoom((z) => Math.min(200, z + 10))} />
          </div>

          <div className="flex-1" />

          {/* Word Mode toggle */}
          <button
            onClick={() => setWordMode((v) => !v)}
            className="flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-colors"
            style={{
              backgroundColor: wordMode ? 'color-mix(in srgb,var(--bs-accent) 12%,transparent)' : 'var(--bs-surface)',
              borderColor: wordMode ? 'var(--bs-accent)' : 'var(--bs-border-strong)',
              color: wordMode ? 'var(--bs-accent)' : 'var(--bs-text-muted)',
            }}
          >
            <BookOpen size={13} />
            Word Mode
          </button>

          {/* Copilot toggle */}
          <button
            onClick={() => setCopilotOn((v) => !v)}
            className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: copilotOn ? 'var(--bs-accent)' : 'var(--bs-surface-hover)' }}
          >
            <Sparkles size={13} />✦ Copilot
          </button>
        </div>

        {/* PDF page */}
        <PageContent showCopilot={copilotOn} />
      </main>

      {/* Right: info panel */}
      <InfoPanel />
    </div>
  );
}

/* ── Icon toolbar button helper ── */
function ToolbarIconBtn({ icon, onClick }: { icon: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--bs-surface-hover)] transition-colors"
      style={{ color: 'var(--bs-text-muted)' }}
    >
      {icon}
    </button>
  );
}
