import { useChatStore } from '../../stores/chatStore';
import './CopilotOrb.css';

export function CopilotOrb() {
  const { isSidebarOpen, toggleSidebar } = useChatStore();

  if (isSidebarOpen) return null;

  return (
    <button
      className="copilot-orb"
      onClick={toggleSidebar}
      title="Open Copilot (✦)"
    >
      <div className="copilot-orb-glow"></div>
      <span className="copilot-orb-icon">✦</span>
    </button>
  );
}
