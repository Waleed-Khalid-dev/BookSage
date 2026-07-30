import React, { useState } from 'react';
import { BookOpen, FileText, RefreshCw, Plus, Search, ChevronDown } from 'lucide-react';
import './_group.css';

/* ── Book data ── */
type BookStatus = 'done' | 'partial' | 'processing' | 'new';

interface Book {
  title: string;
  author: string;
  done: number;
  total: number;
  status: BookStatus;
}

const BOOKS: Book[] = [
  { title: '48 Laws of Power',       author: 'Robert Greene',    done: 15, total: 48, status: 'partial'    },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', done: 48, total: 48, status: 'done'       },
  { title: 'Atomic Habits',           author: 'James Clear',      done: 8,  total: 52, status: 'partial'    },
  { title: 'The Art of War',          author: 'Sun Tzu',          done: 13, total: 13, status: 'done'       },
  { title: 'Deep Work',               author: 'Cal Newport',      done: 0,  total: 42, status: 'new'        },
  { title: 'Sapiens',                 author: 'Yuval Harari',     done: 3,  total: 20, status: 'partial'    },
];

/* ── Status badge helper ── */
function StatusBadge({ status }: { status: BookStatus }) {
  const map: Record<BookStatus, { label: string; color: string; bg: string }> = {
    done:       { label: '✓ Done',      color: 'var(--bs-done)',    bg: 'color-mix(in srgb,var(--bs-done) 14%,transparent)' },
    partial:    { label: 'Partial',     color: 'var(--bs-accent)',  bg: 'color-mix(in srgb,var(--bs-accent) 14%,transparent)' },
    processing: { label: 'Processing',  color: 'var(--bs-process)', bg: 'color-mix(in srgb,var(--bs-process) 14%,transparent)' },
    new:        { label: 'New',         color: 'var(--bs-text-muted)', bg: 'var(--bs-surface-hover)' },
  };
  const { label, color, bg } = map[status];
  return (
    <span
      className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-semibold"
      style={{ color, backgroundColor: bg }}
    >
      {label}
    </span>
  );
}

/* ── Single book card ── */
function BookCard({ book }: { book: Book }) {
  const [hovered, setHovered] = useState(false);
  const pct = book.total === 0 ? 0 : Math.round((book.done / book.total) * 100);

  return (
    <div
      className="relative overflow-hidden rounded-lg border flex flex-col cursor-default select-none"
      style={{
        borderColor: 'var(--bs-border)',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.4)' : 'none',
        transition: 'box-shadow 0.18s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Cover area */}
      <div
        className="relative flex flex-col items-center justify-center h-[160px] px-4 py-3 transition-colors"
        style={{ backgroundColor: hovered ? 'var(--bs-surface-hover)' : 'var(--bs-surface)' }}
      >
        <StatusBadge status={book.status} />
        <p
          className="text-center font-bold leading-snug"
          style={{ fontSize: 15, color: 'var(--bs-heading)' }}
        >
          {book.title}
        </p>
        <p className="mt-1.5 text-center" style={{ fontSize: 11, color: 'var(--bs-text-muted)' }}>
          {book.author}
        </p>
      </div>

      {/* Bottom info area */}
      <div className="flex flex-col gap-1.5 px-3 py-3" style={{ backgroundColor: 'var(--bs-panel)' }}>
        <p className="truncate font-semibold" style={{ fontSize: 12, color: 'var(--bs-text-bright)' }}>
          {book.title}
        </p>

        <div className="flex items-center justify-between">
          <span style={{ fontSize: 11, color: 'var(--bs-text-muted)' }}>{book.total} chapters</span>
          <span className="booksage-mono" style={{ fontSize: 11, color: 'var(--bs-accent)' }}>
            {pct}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-[4px] w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bs-surface)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: 'var(--bs-accent)' }}
          />
        </div>

        {/* Hover action buttons */}
        <div
          className="flex gap-1 pt-0.5 transition-all duration-150"
          style={{ opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0)' : 'translateY(4px)' }}
        >
          <ActionBtn icon={<BookOpen size={12} />} label="Read" />
          <ActionBtn icon={<FileText size={12} />} label="Notes" />
          <ActionBtn icon={<RefreshCw size={12} />} label="Reprocess" danger />
        </div>
      </div>
    </div>
  );
}

/* ── Small ghost action button ── */
function ActionBtn({ icon, label, danger = false }: { icon: React.ReactNode; label: string; danger?: boolean }) {
  return (
    <button
      className="flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-medium transition-colors hover:bg-[var(--bs-surface-hover)]"
      style={{
        borderColor: 'var(--bs-border-strong)',
        backgroundColor: 'transparent',
        color: danger ? 'var(--bs-error)' : 'var(--bs-text-muted)',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/* ── Empty state ── */
function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <BookOpen size={64} style={{ color: 'var(--bs-text-muted)', opacity: 0.5 }} />
      <p className="text-base font-semibold" style={{ color: 'var(--bs-text-bright)' }}>No books yet</p>
      <p className="text-sm" style={{ color: 'var(--bs-text-muted)' }}>Import a PDF to get started</p>
      <button
        className="mt-2 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: 'var(--bs-accent)' }}
      >
        <Plus size={15} />
        Import Your First Book
      </button>
    </div>
  );
}

/* ── Main export ── */
export function LibraryView() {
  const [query, setQuery] = useState('');

  const totalChapters = BOOKS.reduce((s, b) => s + b.total, 0);
  const processedChapters = BOOKS.reduce((s, b) => s + b.done, 0);

  const filtered = query.trim()
    ? BOOKS.filter(
        (b) =>
          b.title.toLowerCase().includes(query.toLowerCase()) ||
          b.author.toLowerCase().includes(query.toLowerCase()),
      )
    : BOOKS;

  return (
    <div
      className="booksage-theme flex flex-col h-screen overflow-hidden text-[13px]"
      style={{ backgroundColor: 'var(--bs-bg)', color: 'var(--bs-text)' }}
    >
      {/* ── Header bar ── */}
      <header
        className="flex items-center h-[56px] shrink-0 px-4 gap-4 border-b"
        style={{ backgroundColor: 'var(--bs-panel)', borderColor: 'var(--bs-border)' }}
      >
        {/* Left: title */}
        <div className="flex items-center gap-2 shrink-0">
          <BookOpen size={16} style={{ color: 'var(--bs-accent)' }} />
          <span className="font-bold" style={{ fontSize: 16, color: 'var(--bs-text-bright)' }}>
            My Library
          </span>
        </div>

        {/* Center: search */}
        <div className="flex flex-1 justify-center">
          <div
            className="flex items-center gap-2 px-3 rounded-lg border"
            style={{
              width: 360,
              backgroundColor: 'var(--bs-surface)',
              borderColor: 'var(--bs-border-strong)',
            }}
          >
            <Search size={14} style={{ color: 'var(--bs-text-muted)', flexShrink: 0 }} />
            <input
              className="w-full bg-transparent py-1.5 outline-none"
              style={{ fontSize: 13, color: 'var(--bs-text)' }}
              placeholder="Search books by title or author..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Right: sort + import */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:bg-[var(--bs-surface-hover)]"
            style={{
              backgroundColor: 'var(--bs-surface)',
              borderColor: 'var(--bs-border-strong)',
              color: 'var(--bs-text)',
            }}
          >
            Sort by
            <ChevronDown size={13} />
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--bs-accent)' }}
          >
            <Plus size={13} />
            Import Book
          </button>
        </div>
      </header>

      {/* ── Stats bar ── */}
      <div
        className="flex items-center h-[32px] shrink-0 px-4 gap-3 text-xs"
        style={{ backgroundColor: 'var(--bs-bg)', color: 'var(--bs-text-muted)' }}
      >
        <span>{BOOKS.length} Books</span>
        <span style={{ color: 'var(--bs-border-strong)' }}>|</span>
        <span>{totalChapters} Chapters total</span>
        <span style={{ color: 'var(--bs-border-strong)' }}>|</span>
        <span>{processedChapters} Chapters processed</span>
      </div>

      {/* ── Book grid ── */}
      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          className="flex-1 overflow-y-auto p-6"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20, alignContent: 'start' } as React.CSSProperties}
        >
          {filtered.map((book) => (
            <BookCard key={book.title} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
