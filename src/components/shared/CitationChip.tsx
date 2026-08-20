import React from 'react';
import { useBookStore } from '../../stores/bookStore';
import { useUiStore } from '../../stores/uiStore';
import './CitationChip.css';

interface CitationChipProps {
  chapterNum: number;
  label?: string;
}

export function extractCitations(text: string): number[] {
  if (!text) return [];
  const regex = /\[([^\]]+)\]\(cite:(\d+)\)/g;
  const matches: number[] = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    const num = parseInt(m[2], 10);
    if (!isNaN(num) && !matches.includes(num)) {
      matches.push(num);
    }
  }
  return matches;
}

export function CitationChip({ chapterNum, label }: CitationChipProps) {
  const { chapters, setLastPage } = useBookStore();
  const { activeView, setActiveView } = useUiStore();

  const chapter = chapters.find(c => c.num === chapterNum);
  
  // Extract starting page
  let startPage: number | null = null;
  if (chapter?.pp) {
    const p = parseInt(chapter.pp.split('-')[0].trim(), 10);
    if (!isNaN(p) && p > 0) startPage = p;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (startPage) {
      setLastPage(startPage);
    }

    if (activeView === 'reader') {
      if (startPage) {
        window.dispatchEvent(new CustomEvent('booksage-jump-page', { detail: { pageNum: startPage } }));
      }
    } else if (activeView === 'notes') {
      const idx = chapters.filter(c => c.status === 'done').findIndex(c => c.num === chapterNum);
      if (idx !== -1) {
        window.dispatchEvent(new CustomEvent('booksage-select-chapter', { detail: { chapterIdx: idx } }));
      }
    } else {
      // In AIChatView or others: switch to reader at that page
      if (startPage) {
        setLastPage(startPage);
        window.dispatchEvent(new CustomEvent('booksage-jump-page', { detail: { pageNum: startPage } }));
      }
      setActiveView('reader');
    }
  };

  const cleanLabel = label && label !== `cite:${chapterNum}` ? label : (chapter ? `Ch. ${chapter.num}: ${chapter.title}` : `Ch. ${chapterNum}`);
  const tooltipText = chapter 
    ? `Chapter ${chapter.num}: ${chapter.title}${chapter.pp ? ` (Pages ${chapter.pp})` : ''} • Click to jump to source`
    : `Chapter ${chapterNum} • Click to jump to source`;

  return (
    <span 
      className="bs-citation-chip" 
      onClick={handleClick}
      title={tooltipText}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(e as any); }}
    >
      <span className="bs-citation-icon">📑</span>
      <span className="bs-citation-text">{cleanLabel}</span>
      <span className="bs-citation-arrow">↗</span>
    </span>
  );
}
