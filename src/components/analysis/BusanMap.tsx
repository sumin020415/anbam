'use client';

import { useEffect, useRef, useState } from 'react';
import BusanSvg from './BusanSvg';
import { toKoreanDistrict } from '@/data/busanStatic';

const VIEWBOX = { x: -5.5, y: 4.5, w: 600, h: 450 };

type LabelCenter = { id: string; left: number; top: number };

type Props = {
  selectedDistrictId: string | null;
  onSelectDistrict: (id: string | null) => void;
};

export default function BusanMap({ selectedDistrictId, onSelectDistrict }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [centers, setCenters] = useState<LabelCenter[]>([]);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const svg = wrapperRef.current.querySelector('svg');
    if (!svg) return;
    const paths = Array.from(svg.querySelectorAll<SVGPathElement>('path'));
    const next = paths
      .map((p) => {
        const bbox = p.getBBox();
        const cx = bbox.x + bbox.width / 2;
        const cy = bbox.y + bbox.height / 2;
        return {
          id: p.id,
          left: ((cx - VIEWBOX.x) / VIEWBOX.w) * 100,
          top: ((cy - VIEWBOX.y) / VIEWBOX.h) * 100,
        };
      })
      .filter((c) => c.id);
    setCenters(next);
  }, []);

  return (
    <div className="relative w-full max-w-[600px] mx-auto lg:mx-0" ref={wrapperRef}>
      <BusanSvg
        selectedDistrictId={selectedDistrictId}
        onSelectDistrict={onSelectDistrict}
        className="w-full h-auto block"
      />
      {centers.map((c) => {
        const ko = toKoreanDistrict(c.id);
        if (!ko) return null;
        return (
          <div
            key={c.id}
            className="pointer-events-none absolute select-none text-[10px] sm:text-xs text-ink-1 font-medium"
            style={{ left: `${c.left}%`, top: `${c.top}%`, transform: 'translate(-50%, -50%)' }}
          >
            {ko}
          </div>
        );
      })}
      <div className="absolute bottom-2 left-2 flex flex-col gap-1 text-xs bg-white/80 rounded-anbam px-2 py-1 border border-line-1">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#F4A6A6' }} />
          <span>위험 지역</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#B6CDBD' }} />
          <span>안전 지역</span>
        </div>
      </div>
    </div>
  );
}
