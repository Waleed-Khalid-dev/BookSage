import { useEffect } from "react";
import { useUiStore } from "./stores/uiStore";
import { useBookStore } from "./stores/bookStore";
import { IconSidebar } from "./components/layout/IconSidebar";
import { LibraryView } from "./components/views/LibraryView";
import { BookReader } from "./components/views/BookReader";
import { NotesViewer } from "./components/views/NotesViewer";
import { SplitView } from "./components/layout/SplitView";
import { PipelineView } from "./components/views/PipelineView";
import { AIChatView } from "./components/views/AIChatView";
import { GlobalSearchModal } from "./components/shared/GlobalSearchModal";
import { SettingsDialog } from "./components/shared/SettingsDialog";
import { CopilotSidebar } from "./components/copilot/CopilotSidebar";
import { useShortcuts } from "./hooks/useShortcuts";
import "pdfjs-dist/web/pdf_viewer.css";
import "./App.css";

function App() {
  const { activeView, theme, isNotesSplitOpen, toggleNotesSplit } = useUiStore();
  const { readerTheme, textSelectionColor, bookId, currentBookTitle, chapters, lastPage } = useBookStore();
  
  // Initialize global keyboard shortcuts
  useShortcuts();

  useEffect(() => {
    const handleShortcut = (e: CustomEvent<{ action: string }>) => {
      if (e.detail.action === 'toggle-split-view') {
        toggleNotesSplit();
      }
    };
    window.addEventListener('shortcut-triggered', handleShortcut as EventListener);
    return () => window.removeEventListener('shortcut-triggered', handleShortcut as EventListener);
  }, [toggleNotesSplit]);

  const renderView = () => {
    if ((activeView === "reader" || activeView === "notes") && isNotesSplitOpen) {
      return (
        <SplitView 
          left={<BookReader />} 
          right={<NotesViewer />} 
        />
      );
    }
    
    switch (activeView) {
      case "library": return <LibraryView />;
      case "reader": return <BookReader />;
      case "notes": return <NotesViewer />;
      case "pipeline": return <PipelineView />;
      case "chat": return <AIChatView />;
      default: return <LibraryView />;
    }
  };

  // Determine current chapter based on lastPage
  // Search from end to start so that if pages overlap (e.g. 15-26 and 26-35), 
  // landing on page 26 matches the start of the new chapter rather than the end of the old one.
  const activeChapter = [...chapters].reverse().find(c => {
    if (!c.pp) return false;
    const [start, end] = c.pp.split('-').map(Number);
    return lastPage >= start && lastPage <= end;
  });

  return (
    <div 
      className={`booksage-theme ${theme === "light" ? "booksage-light" : ""} app-container`}
      data-reader-theme={readerTheme}
    >
      {textSelectionColor && (
        <style>
          {`
            ::selection {
              background-color: ${textSelectionColor}66 !important;
            }
          `}
        </style>
      )}
      <IconSidebar />
      <main className="main-content">
        {renderView()}
      </main>
      <GlobalSearchModal />
      <SettingsDialog />
      <CopilotSidebar
        bookId={bookId}
        bookTitle={currentBookTitle}
        chapterId={activeChapter?.id || activeChapter?.num.toString()}
        chapterTitle={activeChapter?.title}
        chapterPath={activeChapter?.path}
        allJsonPaths={chapters.map(c => c.json_path).filter(Boolean) as string[]}
        totalChapters={chapters.length}
      />
    </div>
  );
}

export default App;
