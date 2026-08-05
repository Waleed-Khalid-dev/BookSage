import { getHighlightsForBook, getDrawingsForBook, getDb, BookRecord } from './dbService';
import { save, message } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

export async function getBookDetails(bookId: string): Promise<BookRecord | null> {
  const db = await getDb();
  const result = await db.select<BookRecord[]>('SELECT * FROM books WHERE id = $1', [bookId]);
  return result.length > 0 ? result[0] : null;
}

export async function generateMarkdownExport(bookId: string): Promise<string> {
  const book = await getBookDetails(bookId);
  if (!book) {
    throw new Error('Book not found');
  }

  const highlights = await getHighlightsForBook(bookId);
  const drawings = await getDrawingsForBook(bookId);

  // Combine and sort by page number, then by creation time
  const allAnnotations = [
    ...highlights.map(h => ({ type: 'highlight' as const, page: h.page_num, data: h, created: h.created_at })),
    ...drawings.map(d => ({ type: 'drawing' as const, page: d.page_num, data: d, created: d.created_at }))
  ].sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    return a.created - b.created;
  });

  if (allAnnotations.length === 0) {
    return `# ${book.title}\n\nNo annotations found for this book.`;
  }

  let md = `# ${book.title}\n\n`;

  // Group by page
  const grouped = allAnnotations.reduce((acc, curr) => {
    if (!acc[curr.page]) acc[curr.page] = [];
    acc[curr.page].push(curr);
    return acc;
  }, {} as Record<number, typeof allAnnotations>);

  for (const pageString of Object.keys(grouped).sort((a, b) => Number(a) - Number(b))) {
    const pageNum = Number(pageString);
    md += `## Page ${pageNum}\n\n`;

    const items = grouped[pageNum];
    for (const item of items) {
      if (item.type === 'highlight') {
        const h = item.data as any;
        if (h.text && h.text.trim().length > 0) {
          md += `> ${h.text.trim()}\n\n`;
        }
        if (h.note && h.note.trim().length > 0) {
          md += `**Note:** ${h.note.trim()}\n\n`;
        }
      } else if (item.type === 'drawing') {
        // Just a placeholder reference
        md += `*[Drawing on Page ${pageNum}]*\n\n`;
      }
    }
  }

  return md;
}

export async function copyExportToClipboard(bookId: string): Promise<boolean> {
  try {
    const md = await generateMarkdownExport(bookId);
    await navigator.clipboard.writeText(md);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

export async function saveExportToFile(bookId: string): Promise<boolean> {
  try {
    const md = await generateMarkdownExport(bookId);
    const book = await getBookDetails(bookId);
    
    // Suggest a safe filename
    const safeTitle = book?.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'book_annotations';
    const suggestedFilename = `${safeTitle}_annotations.md`;

    // Open save dialog
    const filePath = await save({
      filters: [{
        name: 'Markdown',
        extensions: ['md']
      }],
      defaultPath: suggestedFilename
    });

    if (!filePath) {
      return false; // User cancelled
    }

    // Write file
    await writeTextFile(filePath, md);
    return true;
  } catch (error: any) {
    console.error('Failed to save file:', error);
    await message(`Failed to save export file: ${error.message || String(error)}`, { title: 'Export Error', kind: 'error' });
    return false;
  }
}
