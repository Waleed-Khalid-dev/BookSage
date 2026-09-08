import React from 'react';
import { useBookStore, Chapter } from '../../stores/bookStore';
import { useUiStore } from '../../stores/uiStore';
import './CitationChip.css';

interface CitationChipProps {
  chapterNum: number;
  label?: string;
}

/**
 * Normalizes all AI chapter references into standardized markdown link citations: [Label](cite:N)
 * Handles:
 * - [Ch. 1: Law 1: Never Outshine the Master] -> [Ch. 1: Law 1: Never Outshine the Master](cite:1)
 * - [Ch. 7] or [Chapter 7] or [Law 7] -> [Ch. 7](cite:7)
 * - [Ch. 7](Ch. 7) or [Ch. 7](#) or [Ch. 7](7) -> [Ch. 7](cite:7)
 * - [Ch. None: Dedication] -> resolved to actual chapter number from chapters store
 */
export function normalizeCitations(text: string, chapters: Chapter[] = []): string {
  if (!text) return '';
  let result = text;

  // 1. Fix [Ch. N](non-cite-link) -> [Ch. N](cite:N)
  result = result.replace(/\[([^\]]+)\]\((?!cite:)(?:chapter[:\s-]*)?(\d+)[^)]*\)/gi, '[$1](cite:$2)');
  result = result.replace(/\[([^\]]+)\]\(#[^)]*\)/gi, (match, p1) => {
    const numMatch = p1.match(/(?:ch(?:apter)?\.?|law)\s*(\d+)/i);
    return numMatch ? `[${p1}](cite:${numMatch[1]})` : match;
  });

  // 2. Fix [Ch. N: Title] or [Law N: Title] or [Ch. N] without any link parenthesis
  result = result.replace(/\[((?:ch(?:apter)?\.?|law)\s*(\d+)[^\]]*)\](?!\()/gi, (_, fullLabel, num) => {
    return `[${fullLabel}](cite:${num})`;
  });

  // 3. Fix [Ch. None: Title] or [Chapter None: Title] by fuzzy matching against known chapters
  result = result.replace(/\[(?:ch(?:apter)?\.?\s*(?:none|null|n\/a))[:\s]*([^\]]+)\](?!\()/gi, (match, title) => {
    const cleanTitle = title.trim().toLowerCase();
    const found = chapters.find(c => {
      const cTitle = (c.title || '').toLowerCase();
      return cTitle.includes(cleanTitle) || cleanTitle.includes(cTitle);
    });
    if (found && found.num) {
      return `[Ch. ${found.num}: ${found.title}](cite:${found.num})`;
    }
    return match;
  });

  return result;
}

/**
 * Extracts all cited chapter numbers from text, supporting cite:N, [Ch. N], and [Law N].
 */
export function extractCitations(text: string, chapters: Chapter[] = []): number[] {
  if (!text) return [];
  const matches: number[] = [];
  
  // 1. Match [label](cite:N)
  const citeRegex = /\[([^\]]+)\]\(cite:(\d+)\)/g;
  let m;
  while ((m = citeRegex.exec(text)) !== null) {
    const num = parseInt(m[2], 10);
    if (!isNaN(num) && !matches.includes(num)) {
      matches.push(num);
    }
  }

  // 2. Match [Ch. N...] or [Law N...]
  const bracketRegex = /\[(?:ch(?:apter)?\.?|law)\s*(\d+)[^\]]*\]/gi;
  while ((m = bracketRegex.exec(text)) !== null) {
    const num = parseInt(m[1], 10);
    if (!isNaN(num) && !matches.includes(num)) {
      matches.push(num);
    }
  }

  // 3. Match [Ch. None: Title] against known chapters
  if (chapters && chapters.length > 0) {
    const noneRegex = /\[(?:ch(?:apter)?\.?\s*(?:none|null))[:\s]*([^\]]+)\]/gi;
    while ((m = noneRegex.exec(text)) !== null) {
      const titleQuery = m[1].trim().toLowerCase();
      const found = chapters.find(c => {
        const cTitle = (c.title || '').toLowerCase();
        return cTitle.includes(titleQuery) || titleQuery.includes(cTitle);
      });
      if (found && !matches.includes(found.num)) {
        matches.push(found.num);
      }
    }
  }

  return matches;
}

export function CitationChip({ chapterNum, label }: CitationChipProps) {
  const { chapters, setLastPage } = useBookStore();
  const { activeView, setActiveView } = useUiStore();

  const num = Number(chapterNum);
  const chapter = chapters.find(c => c.num === num) ||
                  chapters.find(c => {
                    const title = (c.title || '').toLowerCase();
                    return title.includes(`chapter ${num}`) || title.includes(`law ${num}`);
                  });
  
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
      const idx = chapters.filter(c => c.status === 'done').findIndex(c => c.num === num);
      if (idx !== -1) {
        window.dispatchEvent(new CustomEvent('booksage-select-chapter', { detail: { chapterIdx: idx } }));
      } else if (startPage) {
        // If notes aren't ready for this chapter, switch to reader page
        setActiveView('reader');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('booksage-jump-page', { detail: { pageNum: startPage } }));
        }, 60);
      }
    } else {
      // In AIChatView or others: switch to reader at that page
      if (startPage) {
        setLastPage(startPage);
      }
      setActiveView('reader');
      setTimeout(() => {
        if (startPage) {
          window.dispatchEvent(new CustomEvent('booksage-jump-page', { detail: { pageNum: startPage } }));
        }
      }, 60);
    }
  };

  const cleanLabel = label && label !== `cite:${chapterNum}` 
    ? label 
    : (chapter ? `Ch. ${chapter.num}: ${chapter.title}` : `Ch. ${chapterNum}`);

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
