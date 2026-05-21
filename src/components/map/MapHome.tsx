'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CustomOverlayMap, MapInfoWindow, MapMarker } from 'react-kakao-maps-sdk';
import KakaoMap, { DEFAULT_MAP_LEVEL, type KakaoMapInstance } from './KakaoMap';
import MapPin from './MapPin';
import ClusterPin from './ClusterPin';
import {
  clusterDistrictCounts,
  clusterDongCounts,
  type ClusterGroup,
} from './clusterByDistrict';
import {
  getCctvPins,
  getLampPins,
  type CctvPin,
  type LampPin,
  type PostPin,
  type DistrictPinCount,
  type DongPinCount,
} from '@/lib/services/pins';
import { createClient } from '@/lib/supabase/client';

// 줌 레벨 정책 (카카오맵: 숫자 ↑ = 축소, 숫자 ↓ = 확대)
// 부산 도메인 기준:
//   줌 6+ = 부산 전체 보기 / 줌 4~5 = 자치구 확대 / 줌 3 = 동네 / 줌 1~2 = 도로·건물
//
//   줌 ≥ DISTRICT_THRESHOLD (6) : 자치구 단위 클러스터 (~16 개)
//   DONG_THRESHOLD ≤ 줌 < 6    : 동 단위 클러스터 (~150~200 개, 동마다 count)
//   줌 < DONG_THRESHOLD (3)    : 개별 핀 + InfoWindow
const DISTRICT_THRESHOLD = 6;
const DONG_THRESHOLD = 3;

type ActivePin =
  | { kind: 'cctv'; data: CctvPin }
  | { kind: 'lamp'; data: LampPin }
  | { kind: 'post'; data: PostPin }
  | { kind: 'cluster'; cluster: ClusterGroup; clusterKind: 'cctv' | 'lamp' };

type Props = {
  cctvDistrictCounts: DistrictPinCount[];
  lampDistrictCounts: DistrictPinCount[];
  cctvDongCounts: DongPinCount[];
  lampDongCounts: DongPinCount[];
  postPins: PostPin[];
  searchPosition?: { lat: number; lng: number } | null;
};

export default function MapHome({
  cctvDistrictCounts,
  lampDistrictCounts,
  cctvDongCounts,
  lampDongCounts,
  postPins,
  searchPosition,
}: Props) {
  const [active, setActive] = useState<ActivePin | null>(null);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_MAP_LEVEL);
  const [activeMarker, setActiveMarker] = useState<{
    lat: number;
    lng: number;
  } | null>(searchPosition ?? null);
  const [activeMarkerAddress, setActiveMarkerAddress] = useState<string | null>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);

  // 개별 핀 모드 진입 시 lazy fetch - 풀 row (~84k) 첫 로드 회피.
  // 한 번 fetch 후 캐싱 (이후 줌 인은 즉시 표시).
  const [cctvIndividual, setCctvIndividual] = useState<CctvPin[] | null>(null);
  const [lampIndividual, setLampIndividual] = useState<LampPin[] | null>(null);
  const [individualLoading, setIndividualLoading] = useState(false);

  const cctvDistrictClusters = useMemo(
    () => clusterDistrictCounts(cctvDistrictCounts),
    [cctvDistrictCounts],
  );
  const lampDistrictClusters = useMemo(
    () => clusterDistrictCounts(lampDistrictCounts),
    [lampDistrictCounts],
  );
  const cctvDongClusters = useMemo(
    () => clusterDongCounts(cctvDongCounts),
    [cctvDongCounts],
  );
  const lampDongClusters = useMemo(
    () => clusterDongCounts(lampDongCounts),
    [lampDongCounts],
  );

  const showDistrict = zoomLevel >= DISTRICT_THRESHOLD;
  const showDong = !showDistrict && zoomLevel >= DONG_THRESHOLD;
  const showIndividual = !showDistrict && !showDong;
  // 개별 핀 모드 진입 + fetch 미완료 → 동 클러스터 transparent fallback (시각 컨텍스트 유지)
  const showIndividualReady =
    showIndividual && cctvIndividual !== null && lampIndividual !== null;
  const showDongFallback = showIndividual && !showIndividualReady;

  // 줌 <3 처음 진입 시 개별 핀 풀 fetch (한 번만)
  useEffect(() => {
    if (!showIndividual) return;
    if (cctvIndividual !== null && lampIndividual !== null) return;
    if (individualLoading) return;
    setIndividualLoading(true);
    const client = createClient();
    Promise.all([getCctvPins(client), getLampPins(client)])
      .then(([cctv, lamp]) => {
        setCctvIndividual(cctv);
        setLampIndividual(lamp);
      })
      .catch((e) => {
        console.error('[MapHome] individual fetch error:', e);
      })
      .finally(() => {
        setIndividualLoading(false);
      });
  }, [showIndividual, cctvIndividual, lampIndividual, individualLoading]);

  // 헤더 검색에서 좌표 query 로 진입 시 자동으로 그 위치로 이동 + 줌인 (개별 핀 모드)
  // + activeMarker 동기화
  useEffect(() => {
    if (!searchPosition) return;
    setActiveMarker(searchPosition);
    const map = mapRef.current;
    if (!map) return;
    const w = window as unknown as {
      kakao?: { maps?: { LatLng: new (lat: number, lng: number) => unknown } };
    };
    const LatLng = w.kakao?.maps?.LatLng;
    if (!LatLng) return;
    map.setLevel(2);
    map.panTo(new LatLng(searchPosition.lat, searchPosition.lng));
    setZoomLevel(2);
  }, [searchPosition]);

  // 지도 빈 영역 클릭 시 그 좌표에 파란 마커 (기존 핀 클릭은 stopPropagation 으로 분리됨)
  const handleMapClick = (latLng: { lat: number; lng: number }) => {
    setActiveMarker(latLng);
    setActive(null);
  };

  // 파란 마커 좌표 → 주소 (도로명 우선, 없으면 지번) - Phase 5 위치 picker 와 동일 패턴
  useEffect(() => {
    if (!activeMarker) {
      setActiveMarkerAddress(null);
      return;
    }
    const w = window as unknown as {
      kakao?: {
        maps?: {
          services?: {
            Geocoder: new () => {
              coord2Address: (
                lng: number,
                lat: number,
                callback: (
                  result: Array<{
                    road_address?: { address_name: string } | null;
                    address?: { address_name: string } | null;
                  }>,
                  status: string,
                ) => void,
              ) => void;
            };
            Status: { OK: string };
          };
        };
      };
    };
    const services = w.kakao?.maps?.services;
    if (!services) return;
    let cancelled = false;
    const geocoder = new services.Geocoder();
    geocoder.coord2Address(activeMarker.lng, activeMarker.lat, (result, status) => {
      if (cancelled) return;
      if (status === services.Status.OK && result[0]) {
        const road = result[0].road_address?.address_name;
        const jibun = result[0].address?.address_name;
        setActiveMarkerAddress(road || jibun || null);
      } else {
        setActiveMarkerAddress(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeMarker]);

  return (
    <>
      {individualLoading && (
        <div className="fixed right-4 top-20 z-20 rounded-anbam border border-line-1 bg-white px-3 py-2 text-xs font-bold text-ink-1 shadow-card">
          개별 핀 불러오는 중…
        </div>
      )}
      <KakaoMap
        onClick={handleMapClick}
        onZoomChanged={setZoomLevel}
        onMapCreate={(m) => {
          mapRef.current = m;
        }}
      >
      {showDistrict &&
        cctvDistrictClusters.map((c) => (
          <ClusterPin
            key={`cctv-district-${c.key}`}
            kind="cctv"
            position={{ lat: c.lat, lng: c.lng }}
            count={c.count}
            label={c.key}
            onClick={() => setActive({ kind: 'cluster', cluster: c, clusterKind: 'cctv' })}
          />
        ))}
      {(showDong || showDongFallback) &&
        cctvDongClusters.map((c) => (
          <ClusterPin
            key={`cctv-dong-${c.key}`}
            kind="cctv"
            position={{ lat: c.lat, lng: c.lng }}
            count={c.count}
            label={c.key}
            onClick={() => setActive({ kind: 'cluster', cluster: c, clusterKind: 'cctv' })}
          />
        ))}
      {showIndividualReady &&
        cctvIndividual!.map((p) => (
          <MapPin
            key={`cctv-${p.id}`}
            type="cctv"
            position={{ lat: p.lat, lng: p.lng }}
            onClick={() => setActive({ kind: 'cctv', data: p })}
          />
        ))}

      {showDistrict &&
        lampDistrictClusters.map((c) => (
          <ClusterPin
            key={`lamp-district-${c.key}`}
            kind="lamp"
            position={{ lat: c.lat, lng: c.lng }}
            count={c.count}
            label={c.key}
            onClick={() => setActive({ kind: 'cluster', cluster: c, clusterKind: 'lamp' })}
          />
        ))}
      {(showDong || showDongFallback) &&
        lampDongClusters.map((c) => (
          <ClusterPin
            key={`lamp-dong-${c.key}`}
            kind="lamp"
            position={{ lat: c.lat, lng: c.lng }}
            count={c.count}
            label={c.key}
            onClick={() => setActive({ kind: 'cluster', cluster: c, clusterKind: 'lamp' })}
          />
        ))}
      {showIndividualReady &&
        lampIndividual!.map((p) => (
          <MapPin
            key={`lamp-${p.id}`}
            type="lamp"
            position={{ lat: p.lat, lng: p.lng }}
            onClick={() => setActive({ kind: 'lamp', data: p })}
          />
        ))}

      {/* 제보는 줌 레벨 무관 항상 개별 - 수가 적고 InfoWindow 가 핵심 UX */}
      {postPins.map((p) => (
        <MapPin
          key={`post-${p.id}`}
          type="post"
          position={{ lat: p.lat, lng: p.lng }}
          onClick={() => setActive({ kind: 'post', data: p })}
        />
      ))}

      {/* 검색 결과 + 지도 클릭 위치 - Kakao SDK 기본 파란 마커 + 주소 카드 (CustomOverlayMap, zIndex 로 핀 위) */}
      {activeMarker && (
        <>
          <MapMarker position={activeMarker} />
          {activeMarkerAddress && !active && (
            <CustomOverlayMap
              position={activeMarker}
              yAnchor={1.5}
              xAnchor={0.5}
              zIndex={100}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="whitespace-nowrap rounded-anbam border border-line-1 bg-white px-3 py-2 shadow-card"
              >
                <p className="text-xs font-bold text-ink-1">{activeMarkerAddress}</p>
                <Link
                  href={`/posts/new?lat=${activeMarker.lat}&lng=${activeMarker.lng}`}
                  className="mt-1.5 inline-block text-xs font-bold text-warn underline"
                >
                  여기에 제보 작성 →
                </Link>
              </div>
            </CustomOverlayMap>
          )}
        </>
      )}

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
    </>
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
