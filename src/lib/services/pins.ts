import type { SupabaseClient } from '@supabase/supabase-js';

export type CctvPin = {
  id: number;
  lat: number;
  lng: number;
  district: string | null;
  dong: string | null;
  purpose: string | null;
};

export type LampPin = {
  id: number;
  lat: number;
  lng: number;
  district: string | null;
  dong: string | null;
};

export type PostPin = {
  id: string;
  lat: number;
  lng: number;
  title: string;
};

// RPC 클러스터 카운트 결과 (docs/schema.sql §10).
// 자치구 모드는 좌표를 BUSAN_DISTRICT_CENTER 에서 lookup → RPC 는 district + count 만.
export type DistrictPinCount = {
  district: string;
  count: number;
};

// 동 모드는 RPC 가 GROUP BY 한 평균 좌표 그대로 사용 (normalizeDong fallback 합산은 클라).
export type DongPinCount = {
  district: string;
  dong: string | null;
  count: number;
  lat: number;
  lng: number;
};

// getPostPins 안전 ceiling (제보는 수십 row 라 실제 도달 X).
export const PINS_FETCH_LIMIT = 75000;

// 개별 핀 모드 (줌 <3) viewport fetch 의 안전 상한.
// 좁은 화면 영역이라 보통 수십~수백 row. 이 cap 은 OOM 방지용 (모바일 DOM 마커 한도).
const BOUNDS_FETCH_CAP = 2000;

// Supabase PostgREST 의 기본 max-rows 한도 (Dashboard 설정 무관 안전 가정).
// 단일 fetch 가 이 값 넘으면 잘림 → range() 로 페이지네이션.
const SUPABASE_MAX_ROWS = 1000;

// 카카오맵 getBounds() → SW/NE 좌표.
export type LatLngBounds = {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
};

function logPinError(scope: string, error: unknown): void {
  console.error(`[pins:${scope}] Supabase error:`, error);
}

// 개별 핀 모드: 현재 화면(bounds) 안의 CCTV 핀만 fetch.
// 풀 시드 ~84k row 를 한 번에 렌더하면 모바일 메모리 초과로 탭이 튕김 → viewport fetch.
// 좁은 영역이라 보통 수십~수백 row (BOUNDS_FETCH_CAP 도달 X).
export async function getCctvPinsInBounds(
  client: SupabaseClient,
  bounds: LatLngBounds,
): Promise<CctvPin[]> {
  const { data, error } = await client
    .from('cctvs')
    .select('id, lat, lng, district, dong, purpose')
    .gte('lat', bounds.swLat)
    .lte('lat', bounds.neLat)
    .gte('lng', bounds.swLng)
    .lte('lng', bounds.neLng)
    .limit(BOUNDS_FETCH_CAP);
  if (error) {
    logPinError('cctv:bounds', error);
    return [];
  }
  return (data ?? []) as unknown as CctvPin[];
}

// 개별 핀 모드: 현재 화면(bounds) 안의 보안등 핀만 fetch.
export async function getLampPinsInBounds(
  client: SupabaseClient,
  bounds: LatLngBounds,
): Promise<LampPin[]> {
  const { data, error } = await client
    .from('lamps')
    .select('id, lat, lng, district, dong')
    .gte('lat', bounds.swLat)
    .lte('lat', bounds.neLat)
    .gte('lng', bounds.swLng)
    .lte('lng', bounds.neLng)
    .limit(BOUNDS_FETCH_CAP);
  if (error) {
    logPinError('lamp:bounds', error);
    return [];
  }
  return (data ?? []) as unknown as LampPin[];
}

export async function getPostPins(
  client: SupabaseClient,
  opts: { limit?: number } = {},
): Promise<PostPin[]> {
  const { limit = PINS_FETCH_LIMIT } = opts;
  const all: PostPin[] = [];
  let from = 0;
  while (all.length < limit) {
    const to = Math.min(from + SUPABASE_MAX_ROWS - 1, limit - 1);
    const { data, error } = await client
      .from('posts')
      .select('id, lat, lng, title')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) {
      logPinError('post', error);
      return all;
    }
    if (!data || data.length === 0) break;
    all.push(...(data as unknown as PostPin[]));
    if (data.length < SUPABASE_MAX_ROWS) break;
    from += SUPABASE_MAX_ROWS;
  }
  return all;
}

// 자치구 단위 카운트 (RPC, docs/schema.sql §10).
// 결과 ~16 row × 2 byte ~ 수 KB. 매 요청 풀 fetch 대신 첫 페인트 ~1~2초 보장.
export async function getDistrictPinCounts(
  client: SupabaseClient,
  table: 'cctvs' | 'lamps',
): Promise<DistrictPinCount[]> {
  const { data, error } = await client.rpc('get_district_pin_counts', {
    target_table: table,
  });
  if (error) {
    logPinError(`district:${table}`, error);
    return [];
  }
  return ((data ?? []) as { district: string; pin_count: number }[]).map((r) => ({
    district: r.district,
    count: Number(r.pin_count),
  }));
}

// 동 단위 카운트 (RPC). 결과 ~150~200 row.
// district + dong 결합 키로 클러스터링 (클라이언트 normalizeDong + fallback 합산).
export async function getDongPinCounts(
  client: SupabaseClient,
  table: 'cctvs' | 'lamps',
): Promise<DongPinCount[]> {
  const { data, error } = await client.rpc('get_dong_pin_counts', {
    target_table: table,
  });
  if (error) {
    logPinError(`dong:${table}`, error);
    return [];
  }
  return ((data ?? []) as {
    district: string;
    dong: string | null;
    pin_count: number;
    avg_lat: number;
    avg_lng: number;
  }[]).map((r) => ({
    district: r.district,
    dong: r.dong,
    count: Number(r.pin_count),
    lat: r.avg_lat,
    lng: r.avg_lng,
  }));
}
