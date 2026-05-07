'use client';

import { MapMarker } from 'react-kakao-maps-sdk';
import KakaoMap from './KakaoMap';
import type { CctvPin, LampPin, PostPin } from '@/lib/services/pins';

type Props = {
  cctvPins: CctvPin[];
  lampPins: LampPin[];
  postPins: PostPin[];
};

export default function MapHome({ cctvPins, lampPins, postPins }: Props) {
  return (
    <KakaoMap>
      {cctvPins.map((p) => (
        <MapMarker
          key={`cctv-${p.id}`}
          position={{ lat: p.lat, lng: p.lng }}
          title={p.purpose ?? 'CCTV'}
        />
      ))}
      {lampPins.map((p) => (
        <MapMarker
          key={`lamp-${p.id}`}
          position={{ lat: p.lat, lng: p.lng }}
          title="보안등"
        />
      ))}
      {postPins.map((p) => (
        <MapMarker
          key={`post-${p.id}`}
          position={{ lat: p.lat, lng: p.lng }}
          title={p.title}
        />
      ))}
    </KakaoMap>
  );
}
