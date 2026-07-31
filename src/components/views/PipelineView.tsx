import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import {
  FolderOpen, FileText, Scissors, Upload, Sparkles, Filter,
  Square, CheckSquare, Check, Loader2, AlertCircle
} from 'lucide-react';
import { invokePython } from '../../services/pythonService';
import { useBookStore, Chapter } from '../../stores/bookStore';
import { DonutChart } from './pipeline/DonutChart';
import { ActivityBarChart } from './pipeline/ActivityBarChart';
import './PipelineView.css';

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
  const { currentBookTitle, pdfPath, chapters, isExtracting, apiKey, setApiKey, setPdfPath, splitBook, extractLessons } = useBookStore();
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'Raw Text' | 'AI Output' | 'Markdown Source'>('AI Output');
  const [previewContent, setPreviewContent] = useState<string>('Select a chapter to preview');

  useEffect(() => {
    const fetchPreview = async () => {
      const chapter = chapters[selectedChapterIndex];
      if (!chapter || !chapter.path) {
        setPreviewContent('No content available.');
        return;
      }
      
      setPreviewContent('Loading...');
      
      try {
        let pathToRead = chapter.path;
        if (activeTab === 'AI Output' || activeTab === 'Markdown Source') {
          pathToRead = chapter.path.replace('.txt', '.json');
        }
        
        const res = await invokePython({ command: 'read_file', path: pathToRead });
        if (res.status === 'success') {
          if (activeTab === 'Markdown Source') {
             try {
                const data = JSON.parse(res.content);
                let md = `# ${data.chapter_title || chapter.title}\n\n`;
                if (data.summary) md += `## Summary\n${data.summary}\n\n`;
                if (data.core_lesson) md += `## Core Lesson\n> ${data.core_lesson}\n\n`;
                if (data.teachings) {
                   md += `## Teachings\n`;
                   data.teachings.forEach((t: any) => {
                      md += `### ${t.technique}\n${t.explanation}\n\n`;
                   });
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
    <div className="pipeline-view">
      {/* ── Top Toolbar ── */}
      <div className="pipeline-toolbar">
        <div className="toolbar-group">
          <ToolbarButton icon={<FolderOpen size={16} />} label="Open PDF" onClick={handleOpenPdf} />
          <ToolbarButton icon={<FileText size={16} />} label="Extract Text" onClick={splitBook} disabled={!pdfPath || isExtracting} />
          <ToolbarButton icon={<Scissors size={16} />} label="Split Chapters" onClick={splitBook} disabled={!pdfPath || isExtracting} />
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <ToolbarButton icon={<Sparkles size={16} />} label="Generate Lessons" primary onClick={handleExtractLessons} disabled={chapters.length === 0} />
          <ToolbarButton icon={<Upload size={16} />} label="Export All" onClick={handleExportAll} disabled={done === 0} />
        </div>
      </div>

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
                  onClick={() => setSelectedChapterIndex(i)}
                  className={`chapter-item ${selectedChapterIndex === i ? 'active' : ''}`}
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

            {/* API Key */}
            <div className="stats-group">
              <label className="stats-label">Gemini API Key</label>
              <input
                type="password" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="stats-input"
              />
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
        <span>Model: <span style={{ color: 'var(--bs-text)' }}>gemini-1.5-pro</span></span>
      </div>
    </div>
  );
}
