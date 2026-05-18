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

type Props = { cctv: DistrictCount[]; lamp: DistrictCount[] };

export default function InfraStackedBar({ cctv, lamp }: Props) {
  const merged = cctv.map((c, i) => ({
    district: c.district,
    cctv: c.count,
    lamp: lamp[i]?.count ?? 0,
  }));
  merged.sort((a, b) => b.cctv + b.lamp - (a.cctv + a.lamp));

  const data = {
    labels: merged.map((d) => d.district),
    datasets: [
      {
        label: 'CCTV',
        data: merged.map((d) => d.cctv),
        backgroundColor: 'rgba(255, 214, 107, 1)',
      },
      {
        label: '보안등',
        data: merged.map((d) => d.lamp),
        backgroundColor: 'rgba(163, 230, 53, 1)',
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const } },
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true },
    },
  };
  return (
    <div className="relative w-full h-[360px]">
      <Bar data={data} options={options} />
    </div>
  );
}
