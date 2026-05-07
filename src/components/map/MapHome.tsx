'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapInfoWindow } from 'react-kakao-maps-sdk';
import KakaoMap from './KakaoMap';
import MapPin from './MapPin';
import type { CctvPin, LampPin, PostPin } from '@/lib/services/pins';

type ActivePin =
  | { kind: 'cctv'; data: CctvPin }
  | { kind: 'lamp'; data: LampPin }
  | { kind: 'post'; data: PostPin };

type Props = {
  cctvPins: CctvPin[];
  lampPins: LampPin[];
  postPins: PostPin[];
};

export default function MapHome({ cctvPins, lampPins, postPins }: Props) {
  const [active, setActive] = useState<ActivePin | null>(null);

  return (
    <KakaoMap>
      {cctvPins.map((p) => (
        <MapPin
          key={`cctv-${p.id}`}
          type="cctv"
          position={{ lat: p.lat, lng: p.lng }}
          onClick={() => setActive({ kind: 'cctv', data: p })}
        />
      ))}
      {lampPins.map((p) => (
        <MapPin
          key={`lamp-${p.id}`}
          type="lamp"
          position={{ lat: p.lat, lng: p.lng }}
          onClick={() => setActive({ kind: 'lamp', data: p })}
        />
      ))}
      {postPins.map((p) => (
        <MapPin
          key={`post-${p.id}`}
          type="post"
          position={{ lat: p.lat, lng: p.lng }}
          onClick={() => setActive({ kind: 'post', data: p })}
        />
      ))}

      {active && (
        <MapInfoWindow
          position={{ lat: active.data.lat, lng: active.data.lng }}
          removable
          onCloseClick={() => setActive(null)}
        >
          <PinInfoCard active={active} />
        </MapInfoWindow>
      )}
    </KakaoMap>
  );
}

function PinInfoCard({ active }: { active: ActivePin }) {
  if (active.kind === 'cctv') {
    const p = active.data;
    const place = [p.district, p.dong].filter(Boolean).join(' ');
    return (
      <div className="min-w-[140px] px-3 py-2 text-sm text-ink-1">
        <p className="font-bold">CCTV</p>
        {place && <p className="text-xs text-ink-2">{place}</p>}
        {p.purpose && <p className="text-xs">{p.purpose}</p>}
      </div>
    );
  }
  if (active.kind === 'lamp') {
    const p = active.data;
    const place = [p.district, p.dong].filter(Boolean).join(' ');
    return (
      <div className="min-w-[140px] px-3 py-2 text-sm text-ink-1">
        <p className="font-bold">보안등</p>
        {place && <p className="text-xs text-ink-2">{place}</p>}
      </div>
    );
  }
  const p = active.data;
  return (
    <div className="min-w-[160px] max-w-[220px] px-3 py-2 text-sm text-ink-1">
      <p className="line-clamp-2 font-bold">{p.title}</p>
      <Link
        href={`/posts/${p.id}`}
        className="mt-1 inline-block text-xs font-bold text-warn underline"
      >
        상세 보기 →
      </Link>
    </div>
  );
}
