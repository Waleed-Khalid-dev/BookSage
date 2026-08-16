import { useState, useEffect } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { useShortcutStore, ShortcutAction, actionLabels, Shortcut } from '../../stores/shortcutStore';
import { useApiKeys } from '../../stores/apiKeysStore';
import { useBookStore } from '../../stores/bookStore';
import { X, RotateCcw, Key, Keyboard, Eye, EyeOff, Palette } from 'lucide-react';
import './SettingsDialog.css';

const THEMES = [
  { id: 'dark', label: 'Dark (Default)', bg: '#1a1a1a', panel: '#242424', text: '#d4d4d4', accent: '#009688' },
  { id: 'light', label: 'Light', bg: '#f4f4f5', panel: '#e8e8ea', text: '#3a3a3a', accent: '#00796b' },
  { id: 'sepia', label: 'Sepia', bg: '#f4ecd8', panel: '#e6dfc9', text: '#4a3e2a', accent: '#8b5a2b' },
  { id: 'night', label: 'Night', bg: '#1e1e24', panel: '#26262e', text: '#c2c2c9', accent: '#5e81ac' },
  { id: 'oled', label: 'OLED', bg: '#000000', panel: '#0a0a0a', text: '#e0e0e0', accent: '#bb86fc' },
  { id: 'focus', label: 'Focus', bg: '#2a2a2a', panel: '#2a2a2a', text: '#d4d4d4', accent: '#009688' },
];

const PROVIDERS = [
  { id: 'gemini', label: 'Google Gemini' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'claude', label: 'Anthropic Claude' },
  { id: 'groq', label: 'Groq' },
  { id: 'deepseek', label: 'DeepSeek' },
];

export function SettingsDialog() {
  const { isSettingsOpen, setIsSettingsOpen } = useUiStore();
  const { readerTheme, setReaderTheme } = useBookStore();
  const { shortcuts, updateShortcut, resetToDefaults } = useShortcutStore();
  
  const { keys, loadKeys, saveKey, isInitialized } = useApiKeys();
  const [activeTab, setActiveTab] = useState<'theme' | 'shortcuts' | 'apikeys'>('theme');
  const [listeningAction, setListeningAction] = useState<ShortcutAction | null>(null);

  // Local state for API keys being edited
  const [localKeys, setLocalKeys] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isSettingsOpen) {
      loadKeys();
    }
  }, [isSettingsOpen, loadKeys]);

  useEffect(() => {
    if (isInitialized) {
      setLocalKeys(keys);
    }
  }, [isInitialized, keys]);

  useEffect(() => {
    if (!listeningAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

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

  const handleSaveKey = (provider: string) => {
    saveKey(provider, localKeys[provider] || '');
  };

  return (
    <div className="settings-overlay" onClick={() => setIsSettingsOpen(false)}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <div className="settings-tabs">
            <button 
              className={`tab-btn ${activeTab === 'theme' ? 'active' : ''}`}
              onClick={() => setActiveTab('theme')}
            >
              <Palette size={18} /> Theme
            </button>
            <button 
              className={`tab-btn ${activeTab === 'shortcuts' ? 'active' : ''}`}
              onClick={() => setActiveTab('shortcuts')}
            >
              <Keyboard size={18} /> Shortcuts
            </button>
            <button 
              className={`tab-btn ${activeTab === 'apikeys' ? 'active' : ''}`}
              onClick={() => setActiveTab('apikeys')}
            >
              <Key size={18} /> API Keys
            </button>
          </div>
          <button className="settings-close" onClick={() => setIsSettingsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'theme' && (
            <>
              <h4>Theme & Appearance</h4>
              <p className="settings-desc">Choose your preferred visual theme for reading, notes, and the studio interface.</p>
              
              <div className="themes-grid">
                {THEMES.map((t) => {
                  const isSelected = readerTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      className={`theme-option-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => setReaderTheme(t.id as any)}
                    >
                      <div className="theme-swatch" style={{ background: t.bg, borderColor: t.panel }}>
                        <div className="theme-swatch-header" style={{ background: t.panel }}>
                          <span className="theme-swatch-dot" style={{ background: t.accent }} />
                        </div>
                        <div className="theme-swatch-body">
                          <div className="theme-swatch-bar" style={{ background: t.text, opacity: 0.85 }} />
                          <div className="theme-swatch-bar short" style={{ background: t.text, opacity: 0.5 }} />
                        </div>
                      </div>
                      <div className="theme-info">
                        <span className="theme-label">{t.label}</span>
                        {isSelected && <span className="theme-active-tag">Active</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'shortcuts' && (
            <>
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
            </>
          )}

          {activeTab === 'apikeys' && (
            <>
              <h4>API Keys (Encrypted Locally)</h4>
              <p className="settings-desc">Your API keys are encrypted using an AES-GCM 256 hardware-bound key and stored locally.</p>
              
              <div className="api-keys-list">
                {PROVIDERS.map((provider) => (
                  <div key={provider.id} className="api-key-item">
                    <label>{provider.label}</label>
                    <div className="api-key-input-row">
                      <div className="api-key-input-wrapper">
                        <input 
                          type={showKey[provider.id] ? "text" : "password"}
                          placeholder={`Enter ${provider.label} API Key`}
                          value={localKeys[provider.id] || ''}
                          onChange={(e) => setLocalKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                          onBlur={() => handleSaveKey(provider.id)}
                        />
                        <button 
                          className="api-key-toggle-visible"
                          onClick={() => setShowKey(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                          title={showKey[provider.id] ? "Hide Key" : "Show Key"}
                        >
                          {showKey[provider.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {keys[provider.id] !== localKeys[provider.id] && (
                        <button className="api-key-save-btn" onClick={() => handleSaveKey(provider.id)}>Save</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
