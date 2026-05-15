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

function logPinError(scope: string, error: unknown): void {
  console.error(`[pins:${scope}] Supabase error:`, error);
}

export async function getCctvPins(
  client: SupabaseClient,
  opts: { limit?: number } = {},
): Promise<CctvPin[]> {
  const { limit = PINS_FETCH_LIMIT } = opts;
  const { data, error } = await client
    .from('cctvs')
    .select('id, lat, lng, district, dong, purpose')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .limit(limit);
  if (error) {
    logPinError('cctv', error);
    return [];
  }
  return (data ?? []) as unknown as CctvPin[];
}

export async function getLampPins(
  client: SupabaseClient,
  opts: { limit?: number } = {},
): Promise<LampPin[]> {
  const { limit = PINS_FETCH_LIMIT } = opts;
  const { data, error } = await client
    .from('lamps')
    .select('id, lat, lng, district, dong')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .limit(limit);
  if (error) {
    logPinError('lamp', error);
    return [];
  }
  return (data ?? []) as unknown as LampPin[];
}

export async function getPostPins(
  client: SupabaseClient,
  opts: { limit?: number } = {},
): Promise<PostPin[]> {
  const { limit = PINS_FETCH_LIMIT } = opts;
  const { data, error } = await client
    .from('posts')
    .select('id, lat, lng, title')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    logPinError('post', error);
    return [];
  }
  return (data ?? []) as unknown as PostPin[];
}
