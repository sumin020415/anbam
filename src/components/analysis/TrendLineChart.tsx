'use client';

import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import type { HourCount, TrendPoint } from '@/lib/services/analytics';

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

type Mode = 'daily' | 'hourly';

type Props = { trend: TrendPoint[]; hourly: HourCount[] };

export default function TrendLineChart({ trend, hourly }: Props) {
  const [mode, setMode] = useState<Mode>('daily');

  const data =
    mode === 'daily'
      ? {
          labels: trend.map((p) => p.date.slice(5)),
          datasets: [
            {
              label: '일별 제보 수',
              data: trend.map((p) => p.count),
              borderColor: 'rgba(255, 214, 107, 1)',
              backgroundColor: 'rgba(255, 214, 107, 0.2)',
              fill: true,
              tension: 0.3,
            },
          ],
        }
      : {
          labels: hourly.map((h) => `${String(h.hour).padStart(2, '0')}시`),
          datasets: [
            {
              label: '시간대별 제보 수',
              data: hourly.map((h) => h.count),
              borderColor: 'rgba(163, 230, 53, 1)',
              backgroundColor: 'rgba(163, 230, 53, 0.2)',
              fill: true,
              tension: 0.3,
            },
          ],
        };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  const btn = (active: boolean) =>
    `px-3 py-1 rounded-anbam border text-sm transition-colors ${
      active
        ? 'bg-point text-ink-1 border-point font-medium'
        : 'border-line-1 text-ink-2 hover:text-ink-1'
    }`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode('daily')} className={btn(mode === 'daily')}>
          최근 30일
        </button>
        <button type="button" onClick={() => setMode('hourly')} className={btn(mode === 'hourly')}>
          시간대별 (KST)
        </button>
      </div>
      <div className="relative w-full h-[320px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
