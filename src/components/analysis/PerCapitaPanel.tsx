'use client';

import {
  TOTAL_POPULATION,
  getPopulation,
  getPopulationDensity,
} from '@/data/busanStatic';
import type { DistrictCount } from '@/lib/services/analytics';

type Props = {
  selectedDistrict: string | null;
  cctv: DistrictCount[];
  lamp: DistrictCount[];
};

export default function PerCapitaPanel({ selectedDistrict, cctv, lamp }: Props) {
  const isTotal = selectedDistrict === null;
  const name = isTotal ? '부산광역시 전체' : selectedDistrict;

  const totalCctv = cctv.reduce((s, c) => s + c.count, 0);
  const totalLamp = lamp.reduce((s, c) => s + c.count, 0);

  const population = isTotal ? TOTAL_POPULATION : getPopulation(selectedDistrict);
  const density = isTotal ? null : getPopulationDensity(selectedDistrict);
  const cctvCount = isTotal
    ? totalCctv
    : cctv.find((c) => c.district === selectedDistrict)?.count ?? 0;
  const lampCount = isTotal
    ? totalLamp
    : lamp.find((c) => c.district === selectedDistrict)?.count ?? 0;

  const perCapitaCctv = cctvCount > 0 ? population / cctvCount : 0;
  const perCapitaLamp = lampCount > 0 ? population / lampCount : 0;
  const safetyScore =
    population > 0 ? ((cctvCount + lampCount) / population) * 10000 : 0;

  return (
    <div className="flex flex-col gap-2">
      <strong className="text-lg text-ink-1">{name}</strong>
      <p className="text-sm">
        인구 수:{' '}
        <span className="font-medium text-ink-1">
          {population.toLocaleString()}명
        </span>
      </p>
      {density !== null && (
        <p className="text-sm">
          인구 밀도:{' '}
          <span className="font-medium text-ink-1">
            {density.toLocaleString()}명/km²
          </span>
        </p>
      )}
      <p className="text-sm">
        CCTV 1대당 인구:{' '}
        <span className="font-medium text-ink-1">
          {cctvCount > 0 ? `${perCapitaCctv.toFixed(1)}명` : '데이터 없음'}
        </span>
      </p>
      <p className="text-sm">
        보안등 1개당 인구:{' '}
        <span className="font-medium text-ink-1">
          {lampCount > 0 ? `${perCapitaLamp.toFixed(1)}명` : '데이터 없음'}
        </span>
      </p>
      <p className="text-sm">
        안전 점수:{' '}
        <span className="font-medium text-ink-1">{safetyScore.toFixed(2)}</span>{' '}
        <span className="text-xs text-ink-2">(인구 1만명당 인프라 수)</span>
      </p>
      <div className="mt-2 pt-2 border-t border-line-1 text-xs text-ink-2">
        CCTV {cctvCount.toLocaleString()}대 · 보안등 {lampCount.toLocaleString()}개
      </div>
    </div>
  );
}
