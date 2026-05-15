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

function sizeOf(count: number): { px: number; fontPx: number } {
  if (count < 10) return { px: 36, fontPx: 12 };
  if (count < 100) return { px: 44, fontPx: 13 };
  if (count < 500) return { px: 52, fontPx: 14 };
  return { px: 60, fontPx: 16 };
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

  return (
    <CustomOverlayMap position={position} yAnchor={0.5} xAnchor={0.5}>
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
