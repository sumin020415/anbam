'use client';

import { MapMarker } from 'react-kakao-maps-sdk';

export type PinType = 'cctv' | 'lamp' | 'post';

const COLORS: Record<PinType, string> = {
  cctv: '#ffd75e',
  lamp: '#b6f500',
  post: '#c5172e',
};

function makeMarkerImage(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44" shape-rendering="geometricPrecision"><defs><filter id="s" x="-30%" y="-20%" width="160%" height="140%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.4" flood-color="#000" flood-opacity="0.28"/></filter><radialGradient id="g" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#fff" stop-opacity="0.35"/><stop offset="60%" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><g filter="url(#s)"><path d="M17 2.5 C9.27 2.5 3 8.77 3 16.5 C3 24 17 39.5 17 39.5 S31 24 31 16.5 C31 8.77 24.73 2.5 17 2.5 Z" fill="${color}" stroke="rgba(51,61,75,0.6)" stroke-width="0.8"/><path d="M17 2.5 C9.27 2.5 3 8.77 3 16.5 C3 24 17 39.5 17 39.5 S31 24 31 16.5 C31 8.77 24.73 2.5 17 2.5 Z" fill="url(#g)"/><circle cx="17" cy="16.5" r="5" fill="#fff"/></g></svg>`;
  return {
    src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    size: { width: 34, height: 44 },
    options: { offset: { x: 17, y: 39 } },
  };
}

type Props = {
  type: PinType;
  position: { lat: number; lng: number };
  onClick?: () => void;
};

export default function MapPin({ type, position, onClick }: Props) {
  return (
    <MapMarker
      position={position}
      image={makeMarkerImage(COLORS[type])}
      onClick={onClick}
      clickable={Boolean(onClick)}
    />
  );
}
