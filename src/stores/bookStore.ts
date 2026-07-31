import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invokePython } from '../services/pythonService';

export interface Chapter {
  num: number;
  title: string;
  pp: string;
  status: 'none' | 'process' | 'done' | 'error';
  path?: string; // Path to the split txt file
  error?: string; // Bubbled up error message from Python
}

interface BookState {
  currentBookTitle: string;
  pdfPath: string | null;
  chapters: Chapter[];
  isExtracting: boolean;
  apiKey: string;
  aiModel: string;
  
  // Actions
  setApiKey: (key: string) => void;
  setAiModel: (model: string) => void;
  setPdfPath: (path: string) => void;
  splitBook: () => Promise<void>;
  extractLessons: (provider?: string) => Promise<void>;
  retryFailed: (provider?: string) => Promise<void>;
  retrySpecificChapters: (indices: number[], provider?: string) => Promise<void>;
  setChapterStatus: (index: number, status: Chapter['status']) => void;
}

export const useBookStore = create<BookState>()(
  persist(
    (set, get) => ({
      currentBookTitle: 'No book loaded',
      pdfPath: null,
      chapters: [],
      isExtracting: false,
      apiKey: '',
      aiModel: 'gemini-3.6-flash',

      setApiKey: (key: string) => set({ apiKey: key }),
      setAiModel: (model: string) => set({ aiModel: model }),

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
          
          if (res.status === 'success' && res.metadata && res.metadata.chapters) {
            const parsedChapters: Chapter[] = res.metadata.chapters.map((c: any) => ({
              num: c.chapter_num,
              title: c.title || `Chapter ${c.chapter_num}`,
              pp: `${c.start_page}-${c.end_page}`,
              status: 'none',
              path: c.file
            }));
            set({ chapters: parsedChapters });
          } else {
            console.error('Failed to split book:', res.message || res);
            alert(`Failed to split book:\n\n${res.message || JSON.stringify(res)}\n\nPlease check the terminal for Python errors.`);
          }
        } catch (e: any) {
          console.error('splitBook threw error:', e);
          alert(`Split Book Error: ${e.message || String(e)}`);
        } finally {
          set({ isExtracting: false });
        }
      },

      extractLessons: async (provider: string = 'gemini') => {
        const { chapters, apiKey, aiModel } = get();
        
        if (!apiKey) {
          alert("Please enter a Gemini API Key first.");
          return;
        }
        
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
            api_key: apiKey,
            model_name: aiModel
          });

          set((state) => {
            const newChapters = [...state.chapters];
            if (res.status === 'success') {
               newChapters[i].status = 'done';
               newChapters[i].error = undefined;
            } else {
               newChapters[i].status = 'error';
               newChapters[i].error = res.message || 'Unknown error occurred.';
            }
            return { chapters: newChapters };
          });
        }
      },

      retryFailed: async (provider: string = 'gemini') => {
        const { chapters, apiKey, aiModel } = get();
        if (!apiKey) {
          alert("Please enter a Gemini API Key first.");
          return;
        }
        const failedIndices = chapters
          .map((c, i) => ({ c, i }))
          .filter(({ c }) => c.status === 'error' && c.path);

        if (failedIndices.length === 0) {
          alert('No failed chapters to retry.');
          return;
        }

        set({ isExtracting: true });
        for (const { c, i } of failedIndices) {
          set((state) => {
            const ch = [...state.chapters];
            ch[i].status = 'process';
            ch[i].error = undefined;
            return { chapters: ch };
          });

          const res = await invokePython({
            command: 'extract_chapter',
            chapter_path: c.path,
            provider,
            api_key: apiKey,
            model_name: aiModel,
          });

          set((state) => {
            const ch = [...state.chapters];
            if (res.status === 'success') {
              ch[i].status = 'done';
              ch[i].error = undefined;
            } else {
              ch[i].status = 'error';
              ch[i].error = res.message || 'Unknown error occurred.';
            }
            return { chapters: ch };
          });
        }
        set({ isExtracting: false });
      },

      retrySpecificChapters: async (indices: number[], provider: string = 'gemini') => {
        const { chapters, apiKey, aiModel } = get();
        if (!apiKey) {
           alert("Please enter a Gemini API Key first.");
           return;
        }

        const validIndices = indices.filter(i => chapters[i] && chapters[i].path);
        if (validIndices.length === 0) return;
        
        set({ isExtracting: true });
        
        for (const index of validIndices) {
           const chap = chapters[index];
           
           set((state) => {
              const newChapters = [...state.chapters];
              newChapters[index].status = 'process';
              newChapters[index].error = undefined;
              return { chapters: newChapters };
           });
           
           try {
              const res = await invokePython({
                command: 'extract_chapter',
                chapter_path: chap.path,
                provider,
                api_key: apiKey,
                model_name: aiModel
              });
              
              set((state) => {
                 const newChapters = [...state.chapters];
                 if (res.status === 'success') {
                    newChapters[index].status = 'done';
                    newChapters[index].error = undefined;
                 } else {
                    newChapters[index].status = 'error';
                    newChapters[index].error = res.message || 'Unknown error occurred.';
                 }
                 return { chapters: newChapters };
              });
           } catch (e: any) {
              set((state) => {
                 const newChapters = [...state.chapters];
                 newChapters[index].status = 'error';
                 newChapters[index].error = e.message || String(e);
                 return { chapters: newChapters };
              });
           }
        }
        set({ isExtracting: false });
      },

      setChapterStatus: (index: number, status: Chapter['status']) => {
        set((state) => {
          const newChapters = [...state.chapters];
          newChapters[index].status = status;
          return { chapters: newChapters };
        });
      }
    }),
    {
      name: 'booksage-settings',   // localStorage key
      // Only persist user settings — NOT chapters/extraction progress
      partialize: (state) => ({
        apiKey: state.apiKey,
        aiModel: state.aiModel,
      }),
    }
  )
);

// Expose for debugging
if (typeof window !== 'undefined') {
  (window as any).bookStore = useBookStore;
}
