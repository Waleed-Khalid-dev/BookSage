import { create } from 'zustand';
import { invokePython } from '../services/pythonService';

export interface Chapter {
  num: number;
  title: string;
  pp: string;
  status: 'none' | 'process' | 'done' | 'error';
  path?: string; // Path to the split txt file
}

interface BookState {
  currentBookTitle: string;
  pdfPath: string | null;
  chapters: Chapter[];
  isExtracting: boolean;
  
  // Actions
  setPdfPath: (path: string) => void;
  splitBook: () => Promise<void>;
  extractLessons: (apiKey: string, provider?: string) => Promise<void>;
  setChapterStatus: (index: number, status: Chapter['status']) => void;
}

export const useBookStore = create<BookState>((set, get) => ({
  currentBookTitle: 'No book loaded',
  pdfPath: null,
  chapters: [],
  isExtracting: false,

  setPdfPath: (path: string) => {
    // Extract filename for title
    const filename = path.split(/[/\\]/).pop() || 'Unknown Book';
    set({ pdfPath: path, currentBookTitle: filename, chapters: [] });
  },

  splitBook: async () => {
    const { pdfPath } = get();
    if (!pdfPath) return;

    set({ isExtracting: true });
    try {
      const res = await invokePython({ command: 'split_book', path: pdfPath });
      
      if (res.status === 'success' && res.chapters) {
        // Assuming python returns { chapters: [{ number: 1, title: '...', file_path: '...', pages: '...' }] }
        const parsedChapters: Chapter[] = res.chapters.map((c: any) => ({
          num: c.number,
          title: c.title || `Chapter ${c.number}`,
          pp: c.pages || '',
          status: 'none',
          path: c.file_path
        }));
        set({ chapters: parsedChapters });
      } else {
        console.error('Failed to split book:', res.message);
      }
    } finally {
      set({ isExtracting: false });
    }
  },

  extractLessons: async (apiKey: string, provider: string = 'gemini') => {
    const { chapters } = get();
    
    // Process one by one or in small batches
    for (let i = 0; i < chapters.length; i++) {
      const chap = chapters[i];
      if (chap.status === 'done' || !chap.path) continue;

      set((state) => {
        const newChapters = [...state.chapters];
        newChapters[i].status = 'process';
        return { chapters: newChapters };
      });

      const res = await invokePython({
        command: 'extract_chapter',
        chapter_path: chap.path,
        provider,
        api_key: apiKey
      });

      set((state) => {
        const newChapters = [...state.chapters];
        newChapters[i].status = res.status === 'success' ? 'done' : 'error';
        return { chapters: newChapters };
      });
    }
  },

  setChapterStatus: (index: number, status: Chapter['status']) => {
    set((state) => {
      const newChapters = [...state.chapters];
      newChapters[index].status = status;
      return { chapters: newChapters };
    });
  }
}));
