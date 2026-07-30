import { useUiStore } from "./stores/uiStore";
import { IconSidebar } from "./components/layout/IconSidebar";
import { LibraryView } from "./components/views/LibraryView";
import { BookReader } from "./components/views/BookReader";
import { NotesViewer } from "./components/views/NotesViewer";
import { PipelineView } from "./components/views/PipelineView";
import { AIChatView } from "./components/views/AIChatView";
import "./App.css";

function App() {
  const { activeView, theme } = useUiStore();

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
    <div className={`booksage-theme ${theme === "light" ? "booksage-light" : ""} app-container`}>
      <IconSidebar />
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
