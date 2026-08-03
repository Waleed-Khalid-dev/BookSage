import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invokePython } from '../services/pythonService';
import { upsertBook, upsertChapter, getBook, getChaptersForBook, deleteHighlight } from '../services/dbService';

export interface Chapter {
  id?: string;
  num: number;
  title: string;
  pp: string;
  status: 'none' | 'process' | 'done' | 'error';
  path?: string; // Path to the split txt file
  error?: string; // Bubbled up error message from Python
  json_path?: string;
}

interface BookState {
  bookId: string | null;
  currentBookTitle: string;
  pdfPath: string | null;
  chapters: Chapter[];
  isExtracting: boolean;
  apiKey: string;
  aiModel: string;
  highlightsRefreshCounter: number;
  
  // Actions
  setApiKey: (key: string) => void;
  setAiModel: (model: string) => void;
  setPdfPath: (path: string) => Promise<void>;
  loadBook: (id: string) => Promise<void>;
  splitBook: () => Promise<void>;
  extractLessons: (provider?: string) => Promise<void>;
  retryFailed: (provider?: string) => Promise<void>;
  retrySpecificChapters: (indices: number[], provider?: string) => Promise<void>;
  setChapterStatus: (index: number, status: Chapter['status']) => void;
  triggerHighlightsRefresh: () => void;
  deleteHighlightAction: (id: string) => Promise<void>;
}

export const useBookStore = create<BookState>()(
  persist(
    (set, get) => ({
      bookId: null,
      currentBookTitle: 'No book loaded',
      pdfPath: null,
      chapters: [],
      isExtracting: false,
      apiKey: '',
      aiModel: 'gemini-3.6-flash',
      highlightsRefreshCounter: 0,

      triggerHighlightsRefresh: () => set(state => ({ highlightsRefreshCounter: state.highlightsRefreshCounter + 1 })),
      
      deleteHighlightAction: async (id: string) => {
        try {
          await deleteHighlight(id);
          get().triggerHighlightsRefresh();
        } catch (e) {
          console.error("Failed to delete highlight:", e);
        }
      },

      setApiKey: (key: string) => set({ apiKey: key }),
      setAiModel: (model: string) => set({ aiModel: model }),

      setPdfPath: async (path: string) => {
        const filename = path.split(/[/\\]/).pop() || 'Unknown Book';
        const newBookId = crypto.randomUUID();
        
        try {
          await upsertBook({
            id: newBookId,
            title: filename,
            pdf_path: path,
            data_dir: '', // Empty initially, updated by splitBook later
            cover_path: null,
            total_chapters: 0,
            created_at: Date.now(),
            last_opened: Date.now()
          });
          set({ pdfPath: path, currentBookTitle: filename, chapters: [], bookId: newBookId });
        } catch (e) {
          console.error("Failed to insert initial book record:", e);
          set({ pdfPath: path, currentBookTitle: filename, chapters: [], bookId: null });
        }
      },

      loadBook: async (id: string) => {
        try {
          const book = await getBook(id);
          if (!book) return;
          const dbChapters = await getChaptersForBook(id);
          
          const verifiedChapters = [];
          
          for (const c of dbChapters) {
            let status = c.status;
            // Phase 3.5 Validation: if it says done but json is missing, reset it
            if (status === 'done' && c.json_path) {
              const res = await invokePython({ command: 'check_exists', path: c.json_path });
              if (res.status === 'success' && !res.exists) {
                status = 'none';
                await upsertChapter({ ...c, status: 'none' });
              }
            }
            verifiedChapters.push({
              id: c.id,
              num: c.num,
              title: c.title,
              pp: c.pages,
              status: status,
              path: c.txt_path || undefined,
              json_path: c.json_path || undefined,
              error: c.error_msg || undefined
            });
          }
          
          set({
            bookId: book.id,
            currentBookTitle: book.title,
            pdfPath: book.pdf_path,
            chapters: verifiedChapters
          });
        } catch (e) {
          console.error('Failed to load book from DB', e);
        }
      },

      splitBook: async () => {
        const { pdfPath, currentBookTitle } = get();
        if (!pdfPath) return;

        set({ isExtracting: true });
        try {
          // Generate a UUID for the book if it doesn't have one
          const newBookId = crypto.randomUUID();
          
          const res = await invokePython({ command: 'split_book', path: pdfPath, book_id: newBookId });
          
          if (res.status === 'success' && res.metadata && res.metadata.chapters) {
            const parsedChapters: Chapter[] = res.metadata.chapters.map((c: any) => ({
              id: crypto.randomUUID(),
              num: c.chapter_num,
              title: c.title || `Chapter ${c.chapter_num}`,
              pp: `${c.start_page}-${c.end_page}`,
              status: 'none',
              path: c.file
            }));

            // Save to DB
            await upsertBook({
              id: newBookId,
              title: currentBookTitle,
              pdf_path: pdfPath,
              data_dir: res.book_dir,
              cover_path: null,
              total_chapters: parsedChapters.length,
              created_at: Date.now(),
              last_opened: Date.now()
            });

            for (const ch of parsedChapters) {
              await upsertChapter({
                id: ch.id!,
                book_id: newBookId,
                num: ch.num,
                title: ch.title,
                pages: ch.pp,
                status: ch.status,
                txt_path: ch.path || null,
                json_path: null,
                error_msg: null,
                updated_at: Date.now()
              });
            }

            set({ bookId: newBookId, chapters: parsedChapters });
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
        const { bookId, chapters, apiKey, aiModel } = get();
        
        if (!apiKey) {
          alert("Please enter a Gemini API Key first.");
          return;
        }
        
        for (let i = 0; i < chapters.length; i++) {
          const chap = chapters[i];
          if (chap.status === 'done' || !chap.path) continue;

          set((state) => {
            const newChapters = [...state.chapters];
            newChapters[i].status = 'process';
            return { chapters: newChapters };
          });
          
          if (chap.id && bookId) {
             await upsertChapter({
                id: chap.id, book_id: bookId, num: chap.num, title: chap.title, pages: chap.pp,
                status: 'process', txt_path: chap.path, json_path: chap.json_path || null, error_msg: null, updated_at: Date.now()
             });
          }

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
               newChapters[i].json_path = res.output_path;
            } else {
               newChapters[i].status = 'error';
               newChapters[i].error = res.message || 'Unknown error occurred.';
            }
            return { chapters: newChapters };
          });
          
          const updatedChap = get().chapters[i];
          if (updatedChap.id && bookId) {
             await upsertChapter({
                id: updatedChap.id, book_id: bookId, num: updatedChap.num, title: updatedChap.title, pages: updatedChap.pp,
                status: updatedChap.status, txt_path: updatedChap.path || null, json_path: updatedChap.json_path || null, 
                error_msg: updatedChap.error || null, updated_at: Date.now()
             });
          }
        }
      },

      retryFailed: async (provider: string = 'gemini') => {
        const { bookId, chapters, apiKey, aiModel } = get();
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
          
          if (c.id && bookId) {
             await upsertChapter({
                id: c.id, book_id: bookId, num: c.num, title: c.title, pages: c.pp,
                status: 'process', txt_path: c.path || null, json_path: c.json_path || null, error_msg: null, updated_at: Date.now()
             });
          }

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
              ch[i].json_path = res.output_path;
            } else {
              ch[i].status = 'error';
              ch[i].error = res.message || 'Unknown error occurred.';
            }
            return { chapters: ch };
          });
          
          const updatedChap = get().chapters[i];
          if (updatedChap.id && bookId) {
             await upsertChapter({
                id: updatedChap.id, book_id: bookId, num: updatedChap.num, title: updatedChap.title, pages: updatedChap.pp,
                status: updatedChap.status, txt_path: updatedChap.path || null, json_path: updatedChap.json_path || null, 
                error_msg: updatedChap.error || null, updated_at: Date.now()
             });
          }
        }
        set({ isExtracting: false });
      },

      retrySpecificChapters: async (indices: number[], provider: string = 'gemini') => {
        const { bookId, chapters, apiKey, aiModel } = get();
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
           
           if (chap.id && bookId) {
             await upsertChapter({
                id: chap.id, book_id: bookId, num: chap.num, title: chap.title, pages: chap.pp,
                status: 'process', txt_path: chap.path || null, json_path: chap.json_path || null, error_msg: null, updated_at: Date.now()
             });
           }
           
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
                    newChapters[index].json_path = res.output_path;
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
           
           const updatedChap = get().chapters[index];
           if (updatedChap.id && bookId) {
             await upsertChapter({
                id: updatedChap.id, book_id: bookId, num: updatedChap.num, title: updatedChap.title, pages: updatedChap.pp,
                status: updatedChap.status, txt_path: updatedChap.path || null, json_path: updatedChap.json_path || null, 
                error_msg: updatedChap.error || null, updated_at: Date.now()
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
        
        // Save to DB
        const { bookId, chapters } = get();
        const ch = chapters[index];
        if (ch.id && bookId) {
           upsertChapter({
              id: ch.id, book_id: bookId, num: ch.num, title: ch.title, pages: ch.pp,
              status: ch.status, txt_path: ch.path || null, json_path: ch.json_path || null, 
              error_msg: ch.error || null, updated_at: Date.now()
           }).catch(console.error);
        }
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
