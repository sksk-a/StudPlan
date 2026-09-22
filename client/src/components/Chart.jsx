import { useEffect, useRef } from 'react';
import ChartJS from 'chart.js/auto';
export default function Chart({ type, data, label }) {
  const canvas = useRef(null);
  useEffect(() => {
    const chart = new ChartJS(canvas.current, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } },
        ...(type === 'bar'
          ? { scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
          : { cutout: '68%' }),
      },
    });
    return () => chart.destroy();
  }, [type, data]);
  return (
    <div className="chart-container">
      <canvas ref={canvas} role="img" aria-label={label} />
    </div>
  );
}
