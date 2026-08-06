import { useUiStore } from "./stores/uiStore";
import { useBookStore } from "./stores/bookStore";
import { IconSidebar } from "./components/layout/IconSidebar";
import { LibraryView } from "./components/views/LibraryView";
import { BookReader } from "./components/views/BookReader";
import { NotesViewer } from "./components/views/NotesViewer";
import { PipelineView } from "./components/views/PipelineView";
import { AIChatView } from "./components/views/AIChatView";
import { GlobalSearchModal } from "./components/shared/GlobalSearchModal";
import { SettingsDialog } from "./components/shared/SettingsDialog";
import { useShortcuts } from "./hooks/useShortcuts";
import "pdfjs-dist/web/pdf_viewer.css";
import "./App.css";

function App() {
  const { activeView, theme } = useUiStore();
  const { readerTheme, textSelectionColor } = useBookStore();
  
  // Initialize global keyboard shortcuts
  useShortcuts();

  const renderView = () => {
    switch (activeView) {
      case "library": return <LibraryView />;
      case "reader": return <BookReader />;
      case "notes": return <NotesViewer />;
      case "pipeline": return <PipelineView />;
      case "chat": return <AIChatView />;
      default: return <LibraryView />;
    }
  };

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
    </div>
  );
}

export default App;
