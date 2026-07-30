export function DonutChart({ done = 0, processing = 0, error = 0, pending = 0 }) {
  const R = 34;
  const CX = 50;
  const CY = 50;
  const CIRC = 2 * Math.PI * R; // ≈ 213.6

  const total = done + processing + error + pending || 1;

  const segments = [
    { value: done,       color: 'var(--bs-done)',    label: 'Done' },
    { value: processing, color: 'var(--bs-process)', label: 'Processing' },
    { value: error,      color: 'var(--bs-error)',   label: 'Error' },
    { value: pending,    color: 'var(--bs-chart-pending)', label: 'Pending' },
  ];

  let offset = 0;
  const arcs = segments.map((seg) => {
    const dash = (seg.value / total) * CIRC;
    const gap  = CIRC - dash;
    const startOffset = CIRC - offset; // SVG stroke-dashoffset trick
    offset += dash;
    return { ...seg, dash, gap, startOffset };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {/* SVG donut */}
      <svg width="72" height="72" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={a.color}
            strokeWidth="14"
            strokeDasharray={`${a.dash} ${a.gap}`}
            strokeDashoffset={a.startOffset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10px' }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', flexShrink: 0, backgroundColor: s.color }} />
            <span style={{ color: 'var(--bs-text-muted)' }}>{s.label}</span>
            <span className="booksage-mono" style={{ marginLeft: 'auto', paddingLeft: '8px', fontWeight: 500, color: 'var(--bs-text-bright)' }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
