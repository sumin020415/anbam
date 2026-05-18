'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import BusanMap from './BusanMap';
import DistrictBarChart from './DistrictBarChart';
import InfraStackedBar from './InfraStackedBar';
import PerCapitaPanel from './PerCapitaPanel';
import TrendLineChart from './TrendLineChart';
import { toKoreanDistrict } from '@/data/busanStatic';
import type {
  DistrictCount,
  HourCount,
  TrendPoint,
} from '@/lib/services/analytics';

type TabId = 1 | 2 | 3;
const TABS: { id: TabId; label: string }[] = [
  { id: 1, label: '실시간 제보 현황' },
  { id: 2, label: '안전 인프라 분포 (CCTV · 보안등)' },
  { id: 3, label: '시계열 제보 추이' },
];

type Props = {
  postCounts: DistrictCount[];
  cctvCounts: DistrictCount[];
  lampCounts: DistrictCount[];
  trend: TrendPoint[];
  hourly: HourCount[];
};

export default function AnalysisTabs({
  postCounts,
  cctvCounts,
  lampCounts,
  trend,
  hourly,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId | null>(1);

  const selectedKo = selectedId ? toKoreanDistrict(selectedId) : null;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="sr-only">부산시 안전 구역</h2>

      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
        <BusanMap
          selectedDistrictId={selectedId}
          onSelectDistrict={setSelectedId}
        />
        <div className="flex-1 w-full bg-white border border-line-1 rounded-anbam p-4">
          <PerCapitaPanel
            selectedDistrict={selectedKo}
            cctv={cctvCounts}
            lamp={lampCounts}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {TABS.map((tab) => {
          const isOpen = activeTab === tab.id;
          return (
            <div
              key={tab.id}
              className="border border-line-1 rounded-anbam overflow-hidden bg-white"
            >
              <button
                type="button"
                onClick={() => setActiveTab(isOpen ? null : tab.id)}
                className={`w-full text-left px-4 py-3 font-medium transition-colors ${
                  isOpen
                    ? 'bg-point text-ink-1'
                    : 'bg-white text-ink-2 hover:text-ink-1'
                }`}
                aria-expanded={isOpen}
              >
                {tab.label}
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key={`tab-content-${tab.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 border-t border-line-1">
                      {tab.id === 1 && (
                        <DistrictBarChart counts={postCounts} />
                      )}
                      {tab.id === 2 && (
                        <InfraStackedBar cctv={cctvCounts} lamp={lampCounts} />
                      )}
                      {tab.id === 3 && (
                        <TrendLineChart trend={trend} hourly={hourly} />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
