import { useState, useEffect } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { useShortcutStore, ShortcutAction, actionLabels, Shortcut } from '../../stores/shortcutStore';
import { X, RotateCcw } from 'lucide-react';
import './SettingsDialog.css';

export function SettingsDialog() {
  const { isSettingsOpen, setIsSettingsOpen } = useUiStore();
  const { shortcuts, updateShortcut, resetToDefaults } = useShortcutStore();
  
  const [listeningAction, setListeningAction] = useState<ShortcutAction | null>(null);

  useEffect(() => {
    if (!listeningAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Ignore if only a modifier key is pressed
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        return;
      }

      const newShortcut: Shortcut = {
        key: e.key,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey
      };

      updateShortcut(listeningAction, newShortcut);
      setListeningAction(null);
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [listeningAction, updateShortcut]);

  if (!isSettingsOpen) return null;

  const formatShortcut = (shortcut: Shortcut) => {
    const parts = [];
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.metaKey) parts.push('Meta');
    
    let keyName = shortcut.key.toUpperCase();
    if (keyName === ' ') keyName = 'SPACE';
    
    parts.push(keyName);
    return parts.join(' + ');
  };

  return (
    <div className="settings-overlay" onClick={() => setIsSettingsOpen(false)}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h3>Settings</h3>
          <button className="settings-close" onClick={() => setIsSettingsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-content">
          <h4>Keyboard Shortcuts</h4>
          <p className="settings-desc">Click any shortcut to record a new key combination.</p>
          
          <div className="shortcuts-list">
            {(Object.entries(shortcuts) as [ShortcutAction, Shortcut][]).map(([action, shortcut]) => (
              <div key={action} className="shortcut-item">
                <span>{actionLabels[action]}</span>
                <button 
                  className={`shortcut-btn ${listeningAction === action ? 'listening' : ''}`}
                  onClick={() => setListeningAction(action === listeningAction ? null : action)}
                >
                  {listeningAction === action ? 'Press any key...' : formatShortcut(shortcut)}
                </button>
              </div>
            ))}
          </div>
          
          <div className="settings-actions">
            <button className="btn-reset" onClick={resetToDefaults}>
              <RotateCcw size={14} style={{ marginRight: '6px' }} />
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
