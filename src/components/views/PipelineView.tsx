import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import {
  FolderOpen, FileText, Scissors, Upload, Sparkles, Filter,
  Square, CheckSquare, Check, Loader2, AlertCircle,
  BookOpen, Minus, X, Sun, Moon, Settings, RotateCw
} from 'lucide-react';
import { invokePython } from '../../services/pythonService';
import { useBookStore, Chapter } from '../../stores/bookStore';
import { DonutChart } from './pipeline/DonutChart';
import { ActivityBarChart } from './pipeline/ActivityBarChart';
import './PipelineView.css';

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="toolbar-btn theme-toggle"
    >
      <Sun size={13} style={{ color: isDark ? 'var(--bs-text-muted)' : 'var(--bs-accent)' }} />
      <div className="bs-toggle-pill" style={{ backgroundColor: isDark ? 'var(--bs-surface-hover)' : 'var(--bs-accent)' }}>
        <div className="bs-toggle-thumb" style={{ transform: isDark ? 'translateX(2px)' : 'translateX(18px)' }} />
      </div>
      <Moon size={13} style={{ color: isDark ? 'var(--bs-accent)' : 'var(--bs-text-muted)' }} />
    </button>
  );
}

function ToolbarButton({ icon, label, primary = false, onClick, disabled = false }: { icon: React.ReactNode; label: string; primary?: boolean; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`toolbar-btn ${primary ? 'primary' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'done':
      return (
        <div className="status-badge"
          style={{ backgroundColor: 'color-mix(in srgb, var(--bs-done) 12%, transparent)', color: 'var(--bs-done)' }}>
          <Check size={10} strokeWidth={3} />
        </div>
      );
    case 'process':
      return (
        <div className="status-badge"
          style={{ backgroundColor: 'color-mix(in srgb, var(--bs-process) 12%, transparent)', color: 'var(--bs-process)' }}>
          <Loader2 size={10} className="animate-spin" strokeWidth={3} />
        </div>
      );
    case 'error':
      return (
        <div className="status-badge"
          style={{ backgroundColor: 'color-mix(in srgb, var(--bs-error) 12%, transparent)', color: 'var(--bs-error)' }}>
          <AlertCircle size={10} strokeWidth={3} />
        </div>
      );
    default:
      return (
        <div className="status-badge text-[var(--bs-border-strong)]">—</div>
      );
  }
}

export function PipelineView() {
  const { currentBookTitle, pdfPath, chapters, isExtracting, apiKey, aiModel, setApiKey, setAiModel, setPdfPath, splitBook, extractLessons, retryFailed, retrySpecificChapters } = useBookStore();
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([0]);
  const [activeTab, setActiveTab] = useState<'Raw Text' | 'AI Output' | 'Markdown Source'>('AI Output');
  const [previewContent, setPreviewContent] = useState<string>('Select a chapter to preview');
  const [isDark, setIsDark] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      const chapter = chapters[selectedChapterIndex];
      if (!chapter || !chapter.path) {
        setPreviewContent('No content available.');
        return;
      }
      
      setPreviewContent('Loading...');
      
      try {
        if (chapter.status === 'error' && chapter.error) {
           setPreviewContent(`Extraction failed:\n\n${chapter.error}`);
           return;
        }

        let pathToRead = chapter.path;
        if (activeTab === 'AI Output' || activeTab === 'Markdown Source') {
          pathToRead = chapter.path.replace('.txt', '.json');
        }
        
        const res = await invokePython({ command: 'read_file', path: pathToRead });
        if (res.status === 'success') {
          if (activeTab === 'Markdown Source') {
              try {
                const parsedData = JSON.parse(res.content);
                const data = Array.isArray(parsedData) ? parsedData[0] : parsedData;
                let md = `# ${data.chapter_title || chapter.title}\n\n`;
                if (data.summary) md += `## Summary\n${data.summary}\n\n`;
                if (data.core_lesson) md += `## Core Lesson\n> ${data.core_lesson}\n\n`;
                if (data.teachings) {
                   md += `## Teachings\n`;
                   data.teachings.forEach((t: any) => {
                      md += `### ${t.technique}\n${t.explanation}\n\n`;
                   });
                }
                if (data.implementation_steps) {
                   md += `## Implementation Steps\n`;
                   data.implementation_steps.forEach((s: any) => {
                      md += `- ${s}\n`;
                   });
                   md += `\n`;
                }
                if (data.supporting_quotes) {
                   md += `## Quotes\n`;
                   data.supporting_quotes.forEach((q: any) => {
                      md += `> "${q}"\n\n`;
                   });
                }
                if (data.difficulty_to_implement) {
                   md += `**Difficulty to Implement:** ${data.difficulty_to_implement}\n\n`;
                }
                if (data.obsidian_tags) {
                   md += `**Tags:** ${data.obsidian_tags.join(' ')}\n\n`;
                }
                setPreviewContent(md);
             } catch(e) {
                setPreviewContent("Invalid JSON data. Cannot render markdown.");
             }
          } else {
             setPreviewContent(res.content);
          }
        } else {
          setPreviewContent(`File not found. Generate lessons first.`);
        }
      } catch (err) {
        setPreviewContent(`Failed to load preview.`);
      }
    };
    fetchPreview();
  }, [selectedChapterIndex, activeTab, chapters]);

  // Stats
  const done = chapters.filter((c: Chapter) => c.status === 'done').length;
  const processing = chapters.filter((c: Chapter) => c.status === 'process').length;
  const error = chapters.filter((c: Chapter) => c.status === 'error').length;
  const pending = chapters.filter((c: Chapter) => c.status === 'none').length;
  const total = chapters.length;

  const handleOpenPdf = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'PDF',
          extensions: ['pdf']
        }]
      });
      if (selected && typeof selected === 'string') {
        setPdfPath(selected);
      }
    } catch (err) {
      console.error('Failed to open dialog:', err);
    }
  };

  const handleExtractLessons = () => {
    extractLessons('gemini');
  };

  const handleExportAll = async () => {
    try {
      const dir = await open({
        directory: true,
        multiple: false,
      });
      
      if (dir && typeof dir === 'string') {
        const res = await invokePython({
           command: 'export_chapters',
           chapters: chapters,
           output_dir: dir
        });
        
        if (res.status === 'success') {
           alert(`Successfully exported ${res.exported_count} chapters to Markdown!`);
        } else {
           alert(`Export failed: ${res.message}`);
        }
      }
    } catch (e) {
      console.error(e);
      alert('Export failed.');
    }
  };

  return (
    <div className={`pipeline-view booksage-theme${isDark ? '' : ' booksage-light'}`}>
      {/* ── Title Bar ── */}
      <div className="title-bar">
        <div className="title-bar-left">
          <div className="title-bar-icon">
            <BookOpen size={14} />
            <Sparkles size={10} className="title-sparkle" />
          </div>
          <span className="title-text-main">BookSage</span>
          <span className="title-text-sub">– PDF to Obsidian Lessons</span>
        </div>
        <div className="title-bar-controls">
          <Minus size={14} />
          <Square size={12} />
          <X size={14} />
        </div>
      </div>

      {/* ── Top Toolbar ── */}
      <div className="pipeline-toolbar">
        <div className="toolbar-group">
          <ToolbarButton icon={<FolderOpen size={16} />} label="Open PDF" onClick={handleOpenPdf} />
          <ToolbarButton icon={<FileText size={16} />} label="Extract Text" onClick={splitBook} disabled={!pdfPath || isExtracting} />
          <ToolbarButton icon={<Scissors size={16} />} label="Split Chapters" onClick={splitBook} disabled={!pdfPath || isExtracting} />
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <ToolbarButton icon={<Sparkles size={16} />} label="Generate Lessons" primary onClick={handleExtractLessons} disabled={chapters.length === 0 || isExtracting} />
          {error > 0 && (
            <ToolbarButton
              icon={<AlertCircle size={16} />}
              label={`Retry Failed (${error})`}
              onClick={() => retryFailed('gemini')}
              disabled={isExtracting}
            />
          )}
          <ToolbarButton 
             icon={<RotateCw size={16} />} 
             label={`Retry Selected (${selectedIndices.length})`} 
             onClick={() => retrySpecificChapters(selectedIndices, 'gemini')} 
             disabled={isExtracting || selectedIndices.length === 0} 
          />
          <ToolbarButton icon={<Upload size={16} />} label="Export All" onClick={handleExportAll} disabled={done === 0} />
        </div>

        <div style={{ flex: 1 }} />

        <div className="toolbar-group">
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark((d) => !d)} />
          <div className="toolbar-divider" />
          <ToolbarButton icon={<Settings size={16} />} label="Settings" onClick={() => setShowSettings(!showSettings)} />
        </div>
      </div>

      {/* Basic Settings Overlay (Temporary) */}
      {showSettings && (
        <div className="settings-overlay">
           <div className="settings-modal">
             <h3>Settings</h3>
             <label className="stats-label" style={{ marginTop: '16px', display: 'block' }}>Gemini API Key</label>
             <input
               type="password"
               value={apiKey}
               onChange={(e) => setApiKey(e.target.value)}
               placeholder="AIzaSy..."
               className="stats-input"
               style={{ marginTop: '8px' }}
             />
             
             <label className="stats-label" style={{ marginTop: '16px', display: 'block' }}>AI Model</label>
             <select
               value={aiModel}
               onChange={(e) => setAiModel(e.target.value)}
               className="stats-input"
               style={{ marginTop: '8px', padding: '8px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px', width: '100%' }}
             >
               {/* ─── Stable / GA ─── */}
               <optgroup label="── Stable (Free Tier Available) ──">
                 <option value="gemini-3.6-flash">Gemini 3.6 Flash ⚡ (Recommended)</option>
                 <option value="gemini-3.5-flash">Gemini 3.5 Flash ⚡</option>
                 <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite ⚡ (Fastest)</option>
                 <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite ⚡</option>
                 <option value="gemini-2.5-flash">Gemini 2.5 Flash ⚡</option>
                 <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite ⚡</option>
               </optgroup>
               {/* ─── Preview (Pro / Advanced) ─── */}
               <optgroup label="── Preview (Pro / Advanced) ──">
                 <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro 🔬 (Preview)</option>
                 <option value="gemini-3-flash-preview">Gemini 3 Flash 🔬 (Preview)</option>
                 <option value="gemini-2.5-pro">Gemini 2.5 Pro 👑</option>
               </optgroup>
             </select>
             
             <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
               <button onClick={() => setShowSettings(false)} className="btn-export" style={{ width: 'auto', padding: '6px 16px' }}>Save & Close</button>
             </div>
           </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="pipeline-main">
        {/* Left Panel – Chapter List */}
        <div className="pipeline-left">
          <div className="panel-header">
            <span className="panel-title">Chapters ({total})</span>
            <Filter size={14} className="text-[var(--bs-text-muted)] hover:text-[var(--bs-text-bright)] cursor-default" />
          </div>
          <div className="chapter-list">
            {chapters.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--bs-text-muted)', marginTop: '40px' }}>No chapters found. Please split a PDF.</div>
            ) : (
              chapters.map((c: Chapter, i: number) => (
                <div
                  key={i}
                  onClick={(e) => {
                     let newIndices = [...selectedIndices];
                     if (e.shiftKey && newIndices.length > 0) {
                        const lastIndex = newIndices[newIndices.length - 1];
                        const min = Math.min(lastIndex, i);
                        const max = Math.max(lastIndex, i);
                        for (let j = min; j <= max; j++) {
                           if (!newIndices.includes(j)) newIndices.push(j);
                        }
                     } else if (e.ctrlKey || e.metaKey) {
                        if (newIndices.includes(i)) {
                           newIndices = newIndices.filter(idx => idx !== i);
                        } else {
                           newIndices.push(i);
                        }
                     } else {
                        newIndices = [i];
                     }
                     setSelectedIndices(newIndices);
                     setSelectedChapterIndex(i);
                  }}
                  className={`chapter-item ${selectedIndices.includes(i) ? 'active' : ''}`}
                >
                  <div className="chapter-icon">
                    {c.status === 'done' ? <CheckSquare size={14} className="text-[var(--bs-accent)]" /> : <Square size={14} />}
                  </div>
                  <span className="chapter-num">{c.num}</span>
                  <span className="chapter-title">{c.title}</span>
                  <span className="chapter-pp">{c.pp}</span>
                  <StatusBadge status={c.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center Panel – Preview/Editor */}
        <div className="pipeline-center">
          <div className="preview-tabs">
            {(['Raw Text', 'AI Output', 'Markdown Source'] as const).map((tab) => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`preview-tab ${tab === activeTab ? 'active' : ''}`}
              >
                {tab}
              </div>
            ))}
          </div>

          <div className="preview-content">
            {chapters.length > 0 ? (
              <div className="preview-inner">
                <h1 className="preview-title">
                  {chapters[selectedChapterIndex]?.title}
                </h1>
                <div className="preview-box" style={{ whiteSpace: 'pre-wrap', fontFamily: activeTab === 'AI Output' ? 'monospace' : 'inherit' }}>
                  {previewContent}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--bs-text-muted)', marginTop: '80px' }}>Select a chapter to preview</div>
            )}
          </div>
        </div>

        {/* Right Panel – Export & Vault */}
        <div className="pipeline-right">
          <div className="stats-panel">
            {/* Project Name */}
            <div className="stats-group">
              <label className="stats-label">Project Name</label>
              <input
                type="text" value={currentBookTitle || 'No book loaded'} readOnly
                className="stats-input"
              />
            </div>

            {/* Output Folder */}
            <div className="stats-group">
              <label className="stats-label">Output Folder</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text" value="~/Documents/BookSage_Projects/" readOnly
                  className="stats-input" style={{ flex: 1, textOverflow: 'ellipsis' }}
                />
                <button className="stats-btn">Change...</button>
              </div>
            </div>

            {/* Vault Sync Ready */}
            <div className="vault-sync-box">
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="status-badge" style={{ backgroundColor: 'color-mix(in srgb, var(--bs-done) 15%, transparent)', color: 'var(--bs-done)' }}>
                     <Check size={12} strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--bs-text-bright)' }}>Vault Sync Ready</span>
               </div>
               <p style={{ fontSize: '12px', color: 'var(--bs-text-muted)', margin: '4px 0 0 26px' }}>Will save to selected folder</p>
            </div>

            {/* Export button */}
            <button className="btn-export" onClick={handleExportAll} disabled={done === 0}>
              <Upload size={16} />
              Export All to Obsidian
            </button>

            {/* Progress bar */}
            <div className="stats-group" style={{ paddingTop: '4px' }}>
              <div className="progress-header">
                <span>Extraction Progress</span>
                <span className="booksage-mono">{done} / {total || 1}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
              </div>
            </div>

            {/* Charts section */}
            <div className="stats-group" style={{ paddingTop: '4px' }}>
              <div className="progress-header">
                <span className="stats-label">Chapter Status</span>
                <span className="booksage-mono" style={{ fontSize: '10px' }}>{total} total</span>
              </div>
              <DonutChart done={done} processing={processing} error={error} pending={pending} />
            </div>

            <div className="stats-group" style={{ paddingTop: '4px' }}>
              <div className="progress-header">
                <span className="stats-label">Processing Activity</span>
                <span style={{ fontSize: '10px' }}>last 7 days</span>
              </div>
              <ActivityBarChart />
            </div>

            {/* Export Log */}
            <div className="stats-group" style={{ paddingTop: '4px' }}>
              <label className="stats-label">Export Log</label>
              <div className="export-log">
                {chapters.filter((c: Chapter) => c.status !== 'none').map((c: Chapter, i: number) => (
                   <div key={i} className="export-log-entry">
                     <span className="log-time">[sys]</span>
                     {c.status === 'done' && <><span className="log-success">✓</span> Ch {c.num} processed successfully</>}
                     {c.status === 'error' && <><span className="log-error">✗</span> Ch {c.num} failed: {c.error || 'Unknown error'}</>}
                     {c.status === 'process' && <><span className="log-process">⟳</span> Ch {c.num} processing...</>}
                   </div>
                ))}
                {chapters.filter((c: Chapter) => c.status !== 'none').length === 0 && (
                   <div style={{ color: 'var(--bs-text-muted)', fontStyle: 'italic', padding: '4px' }}>Awaiting pipeline execution...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div className="status-bar">
        <span>PDF loaded: <strong className="status-value">{currentBookTitle || 'No book loaded'}</strong></span>
        <span className="status-divider" />
        <span>{total} chapters detected</span>
        <span className="status-divider" />
        <span>{done} chapters processed</span>
        <div style={{ flex: 1 }} />
        <span>Model: <span className="status-value">{aiModel}</span></span>
      </div>
    </div>
  );
}
