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
        >
          <PinInfoCard active={active} onClose={() => setActive(null)} />
        </MapInfoWindow>
      )}
    </KakaoMap>
  );
}

function PinInfoCard({
  active,
  onClose,
}: {
  active: ActivePin;
  onClose: () => void;
}) {
  return (
    <div className="relative min-w-[160px] max-w-[220px] px-3 py-2 pr-7 text-sm text-ink-1">
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded text-ink-2 hover:bg-line-2"
      >
        ×
      </button>
      <PinInfoBody active={active} />
    </div>
  );
}

function PinInfoBody({ active }: { active: ActivePin }) {
  if (active.kind === 'cctv') {
    const p = active.data;
    const place = [p.district, p.dong].filter(Boolean).join(' ');
    return (
      <>
        <p className="font-bold">CCTV</p>
        {place && <p className="text-xs text-ink-2">{place}</p>}
        {p.purpose && <p className="text-xs">{p.purpose}</p>}
      </>
    );
  }
  if (active.kind === 'lamp') {
    const p = active.data;
    const place = [p.district, p.dong].filter(Boolean).join(' ');
    return (
      <>
        <p className="font-bold">보안등</p>
        {place && <p className="text-xs text-ink-2">{place}</p>}
      </>
    );
  }
  const p = active.data;
  return (
    <>
      <p className="line-clamp-2 font-bold">{p.title}</p>
      <Link
        href={`/posts/${p.id}`}
        className="mt-1 inline-block text-xs font-bold text-warn underline"
      >
        상세 보기 →
      </Link>
    </>
  );
}
