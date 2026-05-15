'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { MapInfoWindow, MapMarker } from 'react-kakao-maps-sdk';
import KakaoMap, { DEFAULT_MAP_LEVEL, type KakaoMapInstance } from './KakaoMap';
import MapPin from './MapPin';
import ClusterPin from './ClusterPin';
import { clusterByDistrict, type ClusterGroup } from './clusterByDistrict';
import type { CctvPin, LampPin, PostPin } from '@/lib/services/pins';

// 줌 레벨 정책 (카카오맵: 숫자 ↑ = 축소, 숫자 ↓ = 확대)
//   줌 ≥ CLUSTER_THRESHOLD : 자치구 단위 클러스터 (DOM 부담 ↓)
//   줌 < CLUSTER_THRESHOLD : 개별 핀 + InfoWindow
// 기본 부산 전체 보기(줌 6) 에선 클러스터, 줌인하면 개별로 전환.
const CLUSTER_THRESHOLD = 5;

type ActivePin =
  | { kind: 'cctv'; data: CctvPin }
  | { kind: 'lamp'; data: LampPin }
  | { kind: 'post'; data: PostPin }
  | { kind: 'cluster'; cluster: ClusterGroup; clusterKind: 'cctv' | 'lamp' };

type Props = {
  cctvPins: CctvPin[];
  lampPins: LampPin[];
  postPins: PostPin[];
  searchPosition?: { lat: number; lng: number } | null;
};

export default function MapHome({
  cctvPins,
  lampPins,
  postPins,
  searchPosition,
}: Props) {
  const [active, setActive] = useState<ActivePin | null>(null);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_MAP_LEVEL);
  const mapRef = useRef<KakaoMapInstance | null>(null);

  const cctvClusters = useMemo(() => clusterByDistrict(cctvPins), [cctvPins]);
  const lampClusters = useMemo(() => clusterByDistrict(lampPins), [lampPins]);

  const shouldCluster = zoomLevel >= CLUSTER_THRESHOLD;

  // 헤더 검색에서 좌표 query 로 진입 시 자동으로 그 위치로 이동 + 줌인 (개별 핀 모드)
  useEffect(() => {
    if (!searchPosition) return;
    const map = mapRef.current;
    if (!map) return;
    const w = window as unknown as {
      kakao?: { maps?: { LatLng: new (lat: number, lng: number) => unknown } };
    };
    const LatLng = w.kakao?.maps?.LatLng;
    if (!LatLng) return;
    map.setLevel(3);
    map.panTo(new LatLng(searchPosition.lat, searchPosition.lng));
    setZoomLevel(3);
  }, [searchPosition]);

  return (
    <KakaoMap
      onZoomChanged={setZoomLevel}
      onMapCreate={(m) => {
        mapRef.current = m;
      }}
    >
      {shouldCluster
        ? cctvClusters.map((c) => (
            <ClusterPin
              key={`cctv-cluster-${c.key}`}
              kind="cctv"
              position={{ lat: c.lat, lng: c.lng }}
              count={c.count}
              label={c.key}
              onClick={() => setActive({ kind: 'cluster', cluster: c, clusterKind: 'cctv' })}
            />
          ))
        : cctvPins.map((p) => (
            <MapPin
              key={`cctv-${p.id}`}
              type="cctv"
              position={{ lat: p.lat, lng: p.lng }}
              onClick={() => setActive({ kind: 'cctv', data: p })}
            />
          ))}

      {shouldCluster
        ? lampClusters.map((c) => (
            <ClusterPin
              key={`lamp-cluster-${c.key}`}
              kind="lamp"
              position={{ lat: c.lat, lng: c.lng }}
              count={c.count}
              label={c.key}
              onClick={() => setActive({ kind: 'cluster', cluster: c, clusterKind: 'lamp' })}
            />
          ))
        : lampPins.map((p) => (
            <MapPin
              key={`lamp-${p.id}`}
              type="lamp"
              position={{ lat: p.lat, lng: p.lng }}
              onClick={() => setActive({ kind: 'lamp', data: p })}
            />
          ))}

      {/* 제보는 줌 레벨 무관 항상 개별 — 수가 적고 InfoWindow 가 핵심 UX */}
      {postPins.map((p) => (
        <MapPin
          key={`post-${p.id}`}
          type="post"
          position={{ lat: p.lat, lng: p.lng }}
          onClick={() => setActive({ kind: 'post', data: p })}
        />
      ))}

      {/* 헤더 검색 결과 위치 — Kakao SDK 기본 파란 마커 (image 옵션 없이) */}
      {searchPosition && <MapMarker position={searchPosition} />}

      {active && (
        <MapInfoWindow
          position={
            active.kind === 'cluster'
              ? { lat: active.cluster.lat, lng: active.cluster.lng }
              : { lat: active.data.lat, lng: active.data.lng }
          }
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
  if (active.kind === 'cluster') {
    const label = active.clusterKind === 'cctv' ? 'CCTV' : '보안등';
    return (
      <>
        <p className="font-bold">
          {active.cluster.key} {label}
        </p>
        <p className="text-xs text-ink-2">총 {active.cluster.count.toLocaleString('ko-KR')}개</p>
        <p className="mt-1 text-xs text-ink-2">지도를 더 확대하면 개별 위치를 볼 수 있습니다.</p>
      </>
    );
  }
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
