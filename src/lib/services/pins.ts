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

export const PINS_FETCH_LIMIT = 20000;

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
