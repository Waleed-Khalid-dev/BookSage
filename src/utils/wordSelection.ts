// src/utils/wordSelection.ts
// Robust DOM utilities to extract a word and its bounding rectangle from mouse click coordinates

export interface ClickedWordInfo {
  word: string;
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  surroundingText?: string;
}

/**
 * Extracts the single word under (clientX, clientY) along with its bounding rect and surrounding sentence.
 */
export function getWordAtPoint(clientX: number, clientY: number): ClickedWordInfo | null {
  // 1. Try document.caretRangeFromPoint (Standard in Chromium/Webkit/Tauri)
  let range: Range | null = null;

  if (typeof (document as any).caretRangeFromPoint === 'function') {
    range = (document as any).caretRangeFromPoint(clientX, clientY);
  } else if ((document as any).caretPositionFromPoint) {
    const pos = (document as any).caretPositionFromPoint(clientX, clientY);
    if (pos && pos.offsetNode) {
      range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.collapse(true);
    }
  }

  if (range && range.startContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
    const textNode = range.startContainer;
    const text = textNode.textContent || '';
    const offset = range.startOffset;

    if (text.length > 0 && offset <= text.length) {
      // Find start of word
      let start = Math.min(offset, text.length - 1);
      // If clicking right between or on boundary, adjust
      if (start > 0 && !/[\w'-]/.test(text[start]) && /[\w'-]/.test(text[start - 1])) {
        start--;
      }

      if (/[\w'-]/.test(text[start])) {
        let wordStart = start;
        while (wordStart > 0 && /[\w'-]/.test(text[wordStart - 1])) {
          wordStart--;
        }

        let wordEnd = start;
        while (wordEnd < text.length && /[\w'-]/.test(text[wordEnd])) {
          wordEnd++;
        }

        const rawWord = text.slice(wordStart, wordEnd);
        const cleanWord = rawWord.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');

        if (cleanWord.length >= 2) {
          const wordRange = document.createRange();
          wordRange.setStart(textNode, wordStart);
          wordRange.setEnd(textNode, wordEnd);

          const clientRect = wordRange.getBoundingClientRect();

          // Extract surrounding sentence (approx 80 chars before and after)
          const sentenceStart = Math.max(0, wordStart - 80);
          const sentenceEnd = Math.min(text.length, wordEnd + 80);
          const surrounding = text.slice(sentenceStart, sentenceEnd).replace(/\s+/g, ' ').trim();

          return {
            word: cleanWord,
            rect: {
              top: clientRect.top,
              left: clientRect.left,
              width: clientRect.width || 20,
              height: clientRect.height || 18,
            },
            surroundingText: surrounding
          };
        }
      }
    }
  }

  // 2. Fallback: check active selection if user had clicked/highlighted
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
    const selText = sel.toString().trim();
    if (selText.length >= 2 && selText.length <= 40 && !selText.includes('\n')) {
      const selRange = sel.getRangeAt(0);
      const r = selRange.getBoundingClientRect();
      return {
        word: selText.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ''),
        rect: {
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height
        }
      };
    }
  }

  // 3. Fallback: elementFromPoint textContent check
  const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
  if (el && el.innerText && el.innerText.length < 50) {
    const clean = el.innerText.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
    if (clean.length >= 2 && !clean.includes(' ')) {
      const r = el.getBoundingClientRect();
      return {
        word: clean,
        rect: {
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height
        }
      };
    }
  }

  return null;
}
