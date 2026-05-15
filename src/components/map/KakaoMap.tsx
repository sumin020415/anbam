'use client';

import type { ReactNode } from 'react';
import { Map, useKakaoLoader } from 'react-kakao-maps-sdk';

export const BUSAN_CENTER = { lat: 35.1796, lng: 129.0756 };
export const DEFAULT_MAP_LEVEL = 6;

type Props = {
  center?: { lat: number; lng: number };
  level?: number;
  className?: string;
  children?: ReactNode;
  onClick?: (latLng: { lat: number; lng: number }) => void;
  onZoomChanged?: (level: number) => void;
};

export default function KakaoMap({
  center = BUSAN_CENTER,
  level = DEFAULT_MAP_LEVEL,
  className = 'h-full w-full',
  children,
  onClick,
  onZoomChanged,
}: Props) {
  const appkey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  const [loading, error] = useKakaoLoader({
    appkey: appkey ?? '',
    libraries: ['services'],
  });

  if (!appkey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-line-2 text-sm text-warn">
        Kakao Map 키가 설정되지 않았습니다 (NEXT_PUBLIC_KAKAO_MAP_KEY).
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-line-2 text-sm text-warn">
        지도를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-line-2 text-sm text-ink-2">
        지도 불러오는 중…
      </div>
    );
  }

  return (
    <Map
      center={center}
      level={level}
      className={className}
      onClick={
        onClick
          ? (_, mouseEvent) => {
              const latLng = mouseEvent.latLng;
              onClick({ lat: latLng.getLat(), lng: latLng.getLng() });
            }
          : undefined
      }
      onZoomChanged={onZoomChanged ? (map) => onZoomChanged(map.getLevel()) : undefined}
    >
      {children}
    </Map>
  );
}
