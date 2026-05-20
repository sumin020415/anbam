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

// 줌 <3 (개별 핀 모드) 진입 시에만 호출. 풀 시드 ~84k row → 6MB JSON.
// LAMP 풀 시드 (68,168) + 여유. CCTV 15k / Post 는 영향 X.
export const PINS_FETCH_LIMIT = 75000;

// Supabase PostgREST 의 기본 max-rows 한도 (Dashboard 설정 무관 안전 가정).
// 단일 fetch 가 이 값 넘으면 잘림 → range() 로 페이지네이션.
const SUPABASE_MAX_ROWS = 1000;

function logPinError(scope: string, error: unknown): void {
  console.error(`[pins:${scope}] Supabase error:`, error);
}

export async function getCctvPins(
  client: SupabaseClient,
  opts: { limit?: number } = {},
): Promise<CctvPin[]> {
  const { limit = PINS_FETCH_LIMIT } = opts;
  const all: CctvPin[] = [];
  let from = 0;
  while (all.length < limit) {
    const to = Math.min(from + SUPABASE_MAX_ROWS - 1, limit - 1);
    const { data, error } = await client
      .from('cctvs')
      .select('id, lat, lng, district, dong, purpose')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .range(from, to);
    if (error) {
      logPinError('cctv', error);
      return all;
    }
    if (!data || data.length === 0) break;
    all.push(...(data as unknown as CctvPin[]));
    if (data.length < SUPABASE_MAX_ROWS) break;
    from += SUPABASE_MAX_ROWS;
  }
  return all;
}

export async function getLampPins(
  client: SupabaseClient,
  opts: { limit?: number } = {},
): Promise<LampPin[]> {
  const { limit = PINS_FETCH_LIMIT } = opts;
  const all: LampPin[] = [];
  let from = 0;
  while (all.length < limit) {
    const to = Math.min(from + SUPABASE_MAX_ROWS - 1, limit - 1);
    const { data, error } = await client
      .from('lamps')
      .select('id, lat, lng, district, dong')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .range(from, to);
    if (error) {
      logPinError('lamp', error);
      return all;
    }
    if (!data || data.length === 0) break;
    all.push(...(data as unknown as LampPin[]));
    if (data.length < SUPABASE_MAX_ROWS) break;
    from += SUPABASE_MAX_ROWS;
  }
  return all;
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
