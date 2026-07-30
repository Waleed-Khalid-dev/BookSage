export function ActivityBarChart() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const values = [3, 5, 2, 7, 8, 6, 0];
  const max = 8;
  const barW = 16;
  const gap = 8;
  const chartH = 44;
  const totalW = days.length * barW + (days.length - 1) * gap;

  return (
    <div>
      <svg width={totalW} height={chartH + 16} style={{ overflow: 'visible' }}>
        {values.map((v, i) => {
          const barH = v === 0 ? 2 : Math.max(3, (v / max) * chartH);
          const x = i * (barW + gap);
          const y = chartH - barH;
          const isCurrent = i === 6;
          return (
            <g key={i}>
              <rect
                x={x} y={y} width={barW} height={barH}
                rx={3} ry={3}
                fill={isCurrent ? 'var(--bs-chart-bar-dim)' : 'var(--bs-chart-bar)'}
              />
              <text
                x={x + barW / 2} y={chartH + 12}
                textAnchor="middle"
                fontSize="8"
                fill="var(--bs-text-muted)"
                fontFamily="Inter, sans-serif"
              >
                {days[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
