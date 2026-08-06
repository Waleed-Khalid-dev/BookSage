import { useUiStore } from '../../stores/uiStore';
import { Home, BookOpen, FileText, Settings, Activity, MessageSquare } from 'lucide-react';
import './IconSidebar.css';

export function IconSidebar() {
  const { activeView, setActiveView } = useUiStore();

  const navItems = [
    { id: 'library', icon: Home, label: 'Library' },
    { id: 'reader', icon: BookOpen, label: 'Reader' },
    { id: 'notes', icon: FileText, label: 'Notes' },
    { id: 'pipeline', icon: Activity, label: 'Pipeline' },
    { id: 'chat', icon: MessageSquare, label: 'AI Chat' }
  ] as const;

  return (
    <div className="icon-sidebar">
      <div className="icon-sidebar-top">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              className={`nav-button ${isActive ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
              title={item.label}
            >
              <Icon size={24} />
            </button>
          );
        })}
      </div>
      <div className="icon-sidebar-bottom">
        <button className="nav-button" title="Settings" onClick={() => useUiStore.getState().setIsSettingsOpen(true)}>
          <Settings size={24} />
        </button>
      </div>
    </div>
  );
}
