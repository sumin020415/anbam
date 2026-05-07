'use client';

import { CustomOverlayMap } from 'react-kakao-maps-sdk';

export type PinType = 'cctv' | 'lamp' | 'post';

const COLORS: Record<PinType, string> = {
  cctv: '#ffd75e',
  lamp: '#b6f500',
  post: '#c5172e',
};

const LABELS: Record<PinType, string> = {
  cctv: 'CCTV',
  lamp: '보안등',
  post: '시민 제보',
};

type Props = {
  type: PinType;
  position: { lat: number; lng: number };
  onClick?: () => void;
};

export default function MapPin({ type, position, onClick }: Props) {
  const color = COLORS[type];
  return (
    <CustomOverlayMap position={position} yAnchor={1} xAnchor={0.5}>
      <button
        type="button"
        aria-label={LABELS[type]}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        className="block cursor-pointer border-0 bg-transparent p-0 leading-none focus:outline-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="34"
          height="44"
          viewBox="0 0 34 44"
          shapeRendering="geometricPrecision"
          className="drop-shadow-[0_2px_2px_rgba(0,0,0,0.28)]"
        >
          <defs>
            <radialGradient id={`pin-h-${type}`} cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path
            d="M17 2.5 C9.27 2.5 3 8.77 3 16.5 C3 24 17 39.5 17 39.5 S31 24 31 16.5 C31 8.77 24.73 2.5 17 2.5 Z"
            fill={color}
            stroke="rgba(51,61,75,0.6)"
            strokeWidth="0.8"
          />
          <path
            d="M17 2.5 C9.27 2.5 3 8.77 3 16.5 C3 24 17 39.5 17 39.5 S31 24 31 16.5 C31 8.77 24.73 2.5 17 2.5 Z"
            fill={`url(#pin-h-${type})`}
          />
          <circle cx="17" cy="16.5" r="5" fill="#fff" />
        </svg>
      </button>
    </CustomOverlayMap>
  );
}
