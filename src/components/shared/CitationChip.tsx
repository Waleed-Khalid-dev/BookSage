import React from 'react';
import { useBookStore, Chapter } from '../../stores/bookStore';
import { useUiStore } from '../../stores/uiStore';
import './CitationChip.css';

interface CitationChipProps {
  chapterNum: number;
  label?: string;
}

export interface CitationItem {
  key: string;
  displayLabel: string;
  chapterNum: number;
  startPage: number | null;
  targetChapter: Chapter | null;
}

/**
 * Robust multi-tier resolver that maps citations (e.g. "Law 1", "Ch. 1", "Never Outshine the Master")
 * to the correct TOC chapter and PDF page, taking into account books with front matter offsets.
 */
export function findTargetChapter(
  chapterNum: number,
  label?: string,
  chapters: Chapter[] = []
): { chapter: Chapter | null; startPage: number | null } {
  if (!chapters || chapters.length === 0) {
    return { chapter: null, startPage: null };
  }

  const num = Number(chapterNum);
  const cleanLabel = (label || '').trim();

  // Helper to extract start page from chapter.pp (e.g. "26-35" -> 26)
  const getPage = (c?: Chapter): number | null => {
    if (!c?.pp) return null;
    const p = parseInt(c.pp.split('-')[0].trim(), 10);
    return isNaN(p) || p <= 0 ? null : p;
  };

  // ── Strategy 1: Title keyword matching from label ──
  // E.g. label has "Never Outshine the Master" -> match chapter whose title contains this
  if (cleanLabel) {
    const coreText = cleanLabel
      .replace(/^\[?cite:\d+\]?/i, '')
      .replace(/^\[?(?:ch(?:apter)?\.?|law|rule|habit|principle|strategy|lesson|part)\s*\d+[:\s\-]*/i, '')
      .replace(/\]$/, '')
      .trim()
      .toLowerCase();

    if (coreText.length > 3) {
      const match = chapters.find(c => {
        const cTitle = (c.title || '').toLowerCase();
        return cTitle.includes(coreText) || coreText.includes(cTitle);
      });
      if (match) {
        return { chapter: match, startPage: getPage(match) };
      }
    }
  }

  // ── Strategy 2: Look for subdivision like "Law N", "Rule N", "Habit N", "Chapter N" in label ──
  const subInLabelMatch = cleanLabel.match(/\b(?:law|rule|habit|principle|strategy|lesson|part|chapter)\s*(\d+)\b/i);
  if (subInLabelMatch) {
    const targetSubNum = parseInt(subInLabelMatch[1], 10);
    const match = chapters.find(c => {
      const cTitle = (c.title || '').toLowerCase();
      return new RegExp(`\\b(?:law|rule|habit|principle|strategy|lesson|part|chapter)\\s*${targetSubNum}\\b`, 'i').test(cTitle);
    });
    if (match) {
      return { chapter: match, startPage: getPage(match) };
    }
  }

  // ── Strategy 3: Look for subdivision number in chapter titles matching chapterNum ──
  // If chapterNum is 1, see if a chapter title explicitly has "LAW 1", "RULE 1", "HABIT 1", etc.
  if (!isNaN(num) && num > 0) {
    const matchByTitleNum = chapters.find(c => {
      const cTitle = (c.title || '').toLowerCase();
      return new RegExp(`\\b(?:law|rule|habit|principle|strategy|lesson|part|chapter)\\s*${num}\\b`, 'i').test(cTitle);
    });
    if (matchByTitleNum) {
      return { chapter: matchByTitleNum, startPage: getPage(matchByTitleNum) };
    }
  }

  // ── Strategy 4: Exact TOC index matching (c.num === num) ──
  const exactMatch = chapters.find(c => c.num === num);
  if (exactMatch) {
    return { chapter: exactMatch, startPage: getPage(exactMatch) };
  }

  return { chapter: null, startPage: null };
}

/**
 * Normalizes all AI chapter references into standardized markdown link citations: [Label](cite:N)
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

  // 2. Fix [Ch. N: Title] or [Law N: Title] or [Ch. N] without link parentheses
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
 * Extracts all cited chapters and returns structured CitationItem objects with resolved start pages.
 */
export function extractCitations(text: string, chapters: Chapter[] = []): CitationItem[] {
  if (!text) return [];
  const items: CitationItem[] = [];
  const seenKeys = new Set<string>();

  const addMatch = (rawNum: number, rawLabel: string) => {
    const { chapter, startPage } = findTargetChapter(rawNum, rawLabel, chapters);
    const resolvedNum = chapter ? chapter.num : rawNum;
    const key = `${resolvedNum}_${startPage ?? 0}`;

    if (!seenKeys.has(key)) {
      seenKeys.add(key);

      // Format a clean label for the button (e.g. "Law 1 (p. 26)" or "Ch. 8 (p. 26)")
      let displayLabel = `Ch. ${resolvedNum}`;
      if (chapter?.title) {
        const subMatch = chapter.title.match(/^((?:law|rule|habit|principle|strategy|lesson|part|chapter)\s*\d+)/i);
        if (subMatch) {
          displayLabel = subMatch[1].toUpperCase();
        } else {
          const shortTitle = chapter.title.length > 22 ? chapter.title.slice(0, 20) + '…' : chapter.title;
          displayLabel = `Ch. ${resolvedNum}: ${shortTitle}`;
        }
      }
      if (startPage) {
        displayLabel += ` (p. ${startPage})`;
      }

      items.push({
        key,
        displayLabel,
        chapterNum: resolvedNum,
        startPage,
        targetChapter: chapter
      });
    }
  };

  // 1. Match [label](cite:N)
  const citeRegex = /\[([^\]]+)\]\(cite:(\d+)\)/g;
  let m;
  while ((m = citeRegex.exec(text)) !== null) {
    addMatch(parseInt(m[2], 10), m[1]);
  }

  // 2. Match [Ch. N...] or [Law N...]
  const bracketRegex = /\[((?:ch(?:apter)?\.?|law)\s*(\d+)[^\]]*)\]/gi;
  while ((m = bracketRegex.exec(text)) !== null) {
    addMatch(parseInt(m[2], 10), m[1]);
  }

  // 3. Match [Ch. None: Title]
  if (chapters && chapters.length > 0) {
    const noneRegex = /\[(?:ch(?:apter)?\.?\s*(?:none|null))[:\s]*([^\]]+)\]/gi;
    while ((m = noneRegex.exec(text)) !== null) {
      const titleQuery = m[1].trim().toLowerCase();
      const found = chapters.find(c => {
        const cTitle = (c.title || '').toLowerCase();
        return cTitle.includes(titleQuery) || titleQuery.includes(cTitle);
      });
      if (found) {
        addMatch(found.num, found.title);
      }
    }
  }

  return items;
}

export function CitationChip({ chapterNum, label }: CitationChipProps) {
  const { chapters, setLastPage } = useBookStore();
  const { activeView, setActiveView } = useUiStore();

  const { chapter, startPage } = findTargetChapter(chapterNum, label, chapters);

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
      const targetNum = chapter ? chapter.num : chapterNum;
      const idx = chapters.filter(c => c.status === 'done').findIndex(c => c.num === targetNum);
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

  // Build clean display label
  let cleanLabel = label && label !== `cite:${chapterNum}` ? label : '';
  if (!cleanLabel) {
    if (chapter?.title) {
      cleanLabel = `Ch. ${chapter.num}: ${chapter.title}`;
    } else {
      cleanLabel = `Ch. ${chapterNum}`;
    }
  }

  const tooltipText = chapter 
    ? `${chapter.title}${chapter.pp ? ` (Pages ${chapter.pp})` : ''} • Click to jump to source`
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
