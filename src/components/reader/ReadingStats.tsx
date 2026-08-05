import { useState, useEffect } from 'react';
import { useBookStore } from '../../stores/bookStore';
import { BarChart2, X, Flame } from 'lucide-react';
import { usePDFContext } from '../../hooks/usePDF';

export function ReadingStats() {
  const [isOpen, setIsOpen] = useState(false);
  const { readingTimeSecs, pagesReadTotal, dailyPages, weeklyPages, currentStreak, fetchGlobalStats } = useBookStore();
  const pdfState = usePDFContext();

  useEffect(() => {
    if (isOpen) {
      fetchGlobalStats();
    }
  }, [isOpen, fetchGlobalStats]);

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
    
  const pagesRemaining = pdfState.totalPages - pdfState.currentPage;
  
  let estimatedTimeLeft = "Calculating...";
  if (pagesReadTotal > 3 && readingTimeSecs > 0) {
    const avgSecondsPerPage = readingTimeSecs / pagesReadTotal;
    const estSeconds = Math.ceil(avgSecondsPerPage * pagesRemaining);
    estimatedTimeLeft = formatTime(estSeconds);
  } else if (pagesRemaining === 0) {
    estimatedTimeLeft = "Done!";
  }

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
            width: '400px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--bs-heading)' }}>Reading Stats</h3>
              <button className="icon-btn" onClick={() => setIsOpen(false)}><X size={20} /></button>
            </div>
            
            {/* Gamification Header */}
            {currentStreak > 0 && (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                background: 'linear-gradient(90deg, rgba(255,165,0,0.2) 0%, rgba(255,69,0,0.2) 100%)',
                padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem',
                border: '1px solid rgba(255,165,0,0.3)'
              }}>
                <Flame size={24} color="#ff8c00" />
                <span style={{ fontWeight: 600, color: '#ff8c00', fontSize: '1.1rem' }}>
                  {currentStreak} Day Streak!
                </span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--bs-text-muted)' }}>Progress</span>
                <span style={{ fontWeight: 600 }}>{percentage}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--bs-text-muted)' }}>Pages Remaining</span>
                <span style={{ fontWeight: 600 }}>{pagesRemaining}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--bs-text-muted)' }}>Estimated Time Left</span>
                <span style={{ fontWeight: 600, color: 'var(--bs-primary)' }}>{estimatedTimeLeft}</span>
              </div>
              
              <hr style={{ border: 0, borderTop: '1px solid var(--bs-border)', margin: '0.5rem 0' }} />
              
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--bs-heading)' }}>Current Book</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--bs-text-muted)' }}>Time Spent Reading</span>
                <span style={{ fontWeight: 600 }}>{formatTime(readingTimeSecs)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--bs-text-muted)' }}>Total Pages Turned</span>
                <span style={{ fontWeight: 600 }}>{pagesReadTotal}</span>
              </div>

              <hr style={{ border: 0, borderTop: '1px solid var(--bs-border)', margin: '0.5rem 0' }} />
              
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--bs-heading)' }}>Global Stats</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--bs-text-muted)' }}>Pages Read Today</span>
                <span style={{ fontWeight: 600 }}>{dailyPages}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--bs-text-muted)' }}>Pages Read This Week</span>
                <span style={{ fontWeight: 600 }}>{weeklyPages}</span>
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
