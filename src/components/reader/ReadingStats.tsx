import React, { useState } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { BarChart2, X } from 'lucide-react';
import { usePDFContext } from '../../hooks/usePDF';

export function ReadingStats() {
  const [isOpen, setIsOpen] = useState(false);
  const { readingTimeSecs, pagesReadTotal } = useBookStore();
  const pdfState = usePDFContext();

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  };

  const percentage = pdfState.totalPages > 0 
    ? ((pdfState.currentPage / pdfState.totalPages) * 100).toFixed(1)
    : '0';

  return (
    <>
      <button 
        className="icon-btn" 
        onClick={() => setIsOpen(true)}
        title="Reading Stats"
      >
        <BarChart2 size={20} />
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--bs-surface)',
            border: '1px solid var(--bs-border)',
            borderRadius: '8px',
            padding: '2rem',
            width: '350px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--bs-heading)' }}>Reading Stats</h3>
              <button className="icon-btn" onClick={() => setIsOpen(false)}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--bs-text-muted)' }}>Progress</span>
                <span style={{ fontWeight: 600 }}>{percentage}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--bs-text-muted)' }}>Time Spent Reading</span>
                <span style={{ fontWeight: 600 }}>{formatTime(readingTimeSecs)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--bs-text-muted)' }}>Total Pages Turned</span>
                <span style={{ fontWeight: 600 }}>{pagesReadTotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--bs-text-muted)' }}>Pages Remaining</span>
                <span style={{ fontWeight: 600 }}>{pdfState.totalPages - pdfState.currentPage}</span>
              </div>
            </div>
            
            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--bs-text-muted)' }}>
              Keep up the great work!
            </div>
          </div>
        </div>
      )}
    </>
  );
}
