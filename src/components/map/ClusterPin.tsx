'use client';

import { CustomOverlayMap } from 'react-kakao-maps-sdk';

export type ClusterKind = 'cctv' | 'lamp';

const KIND_COLORS: Record<ClusterKind, { bg: string; text: string }> = {
  cctv: { bg: '#ffd75e', text: '#1f2937' },
  lamp: { bg: '#b6f500', text: '#1f2937' },
};

const KIND_LABEL: Record<ClusterKind, string> = {
  cctv: 'CCTV',
  lamp: '보안등',
};

// 크기 단계 축소 (이전 36/44/52/60 → 36/40/44/48).
// 부산 시내 인접 자치구 (중구 ↔ 서구 1.4km / 중구 ↔ 동구 2.7km) 의 중심 좌표 거리가
// 줌 6 기준 약 34~65px 라 60px 클러스터끼리 거의 완전 겹쳐 작은 카운트가 가려지는 함정 회피.
function sizeOf(count: number): { px: number; fontPx: number } {
  if (count < 10) return { px: 36, fontPx: 12 };
  if (count < 100) return { px: 40, fontPx: 13 };
  if (count < 500) return { px: 44, fontPx: 13 };
  return { px: 48, fontPx: 14 };
}

type Props = {
  kind: ClusterKind;
  position: { lat: number; lng: number };
  count: number;
  label?: string;
  onClick?: () => void;
};

export default function ClusterPin({ kind, position, count, label, onClick }: Props) {
  const { bg, text } = KIND_COLORS[kind];
  const { px, fontPx } = sizeOf(count);

  // CustomOverlayMap 은 카카오맵 내부에 마운트되어 React DOM 순서가 z-index 에 영향 X.
  // SDK 의 zIndex prop 명시 — count 작을수록 위로 (작은 자치구가 큰 자치구에 안 가림).
  // 부산 시내 자치구끼리 좌표 거리 < 클러스터 지름 한계의 보조 안전망.
  return (
    <CustomOverlayMap
      position={position}
      yAnchor={0.5}
      xAnchor={0.5}
      zIndex={10000 - count}
    >
      <button
        type="button"
        aria-label={`${KIND_LABEL[kind]} ${label ?? ''} ${count}개`}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        className="block cursor-pointer rounded-full border-2 border-white p-0 font-bold leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] focus:outline-none"
        style={{
          width: `${px}px`,
          height: `${px}px`,
          backgroundColor: bg,
          color: text,
          fontSize: `${fontPx}px`,
        }}
      >
        {count.toLocaleString('ko-KR')}
      </button>
    </CustomOverlayMap>
  );
}
