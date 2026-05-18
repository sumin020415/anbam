'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { DistrictCount } from '@/lib/services/analytics';

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Props = { counts: DistrictCount[] };

export default function DistrictBarChart({ counts }: Props) {
  const sorted = [...counts].sort((a, b) => b.count - a.count);
  const data = {
    labels: sorted.map((d) => d.district),
    datasets: [
      {
        label: '제보 수',
        data: sorted.map((d) => d.count),
        backgroundColor: 'rgba(255, 214, 107, 1)',
        borderRadius: 4,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };
  return (
    <div className="relative w-full h-[320px]">
      <Bar data={data} options={options} />
    </div>
  );
}
