import type { SupabaseClient } from '@supabase/supabase-js';
import { BUSAN_DISTRICTS_KO } from '@/data/busanStatic';

export type DistrictCount = { district: string; count: number };
export type TrendPoint = { date: string; count: number };
export type HourCount = { hour: number; count: number };

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const BUSAN_SET = new Set(BUSAN_DISTRICTS_KO);

function logError(scope: string, error: unknown): void {
  console.error(`[analytics:${scope}] Supabase error:`, error);
}

async function countByDistrict(
  client: SupabaseClient,
  table: 'cctvs' | 'lamps',
  district: string,
): Promise<number> {
  const { count, error } = await client
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('district', district);
  if (error) {
    logError(`${table}:${district}`, error);
    return 0;
  }
  return count ?? 0;
}

export async function getDistrictPinCounts(client: SupabaseClient): Promise<{
  cctv: DistrictCount[];
  lamp: DistrictCount[];
}> {
  const [cctvCounts, lampCounts] = await Promise.all([
    Promise.all(BUSAN_DISTRICTS_KO.map((d) => countByDistrict(client, 'cctvs', d))),
    Promise.all(BUSAN_DISTRICTS_KO.map((d) => countByDistrict(client, 'lamps', d))),
  ]);
  return {
    cctv: BUSAN_DISTRICTS_KO.map((district, i) => ({ district, count: cctvCounts[i] ?? 0 })),
    lamp: BUSAN_DISTRICTS_KO.map((district, i) => ({ district, count: lampCounts[i] ?? 0 })),
  };
}

export async function getDistrictPostCounts(client: SupabaseClient): Promise<DistrictCount[]> {
  const { data, error } = await client
    .from('posts')
    .select('address')
    .not('address', 'is', null);
  if (error) {
    logError('posts:district', error);
    return BUSAN_DISTRICTS_KO.map((district) => ({ district, count: 0 }));
  }
  const counts = new Map<string, number>(BUSAN_DISTRICTS_KO.map((d) => [d, 0]));
  for (const row of (data ?? []) as Array<{ address: string | null }>) {
    if (!row.address) continue;
    const parts = row.address.split(/\s+/);
    const district = parts[1];
    if (district && BUSAN_SET.has(district)) {
      counts.set(district, (counts.get(district) ?? 0) + 1);
    }
  }
  return BUSAN_DISTRICTS_KO.map((district) => ({ district, count: counts.get(district) ?? 0 }));
}

function toKstDateKey(iso: string): string {
  return new Date(new Date(iso).getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

export async function getPostsTrend(client: SupabaseClient, days = 30): Promise<TrendPoint[]> {
  const kstNow = new Date(Date.now() + KST_OFFSET_MS);
  kstNow.setUTCHours(0, 0, 0, 0);
  const todayKstMidnightUtcMs = kstNow.getTime() - KST_OFFSET_MS;
  const fromUtcMs = todayKstMidnightUtcMs - (days - 1) * DAY_MS;

  const { data, error } = await client
    .from('posts')
    .select('created_at')
    .gte('created_at', new Date(fromUtcMs).toISOString());
  if (error) {
    logError('posts:trend', error);
    return [];
  }

  const counts = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const dayUtcMs = fromUtcMs + i * DAY_MS;
    const kstKey = new Date(dayUtcMs + KST_OFFSET_MS).toISOString().slice(0, 10);
    counts.set(kstKey, 0);
  }
  for (const row of (data ?? []) as Array<{ created_at: string }>) {
    const key = toKstDateKey(row.created_at);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

export async function getPostsHourlyDistribution(client: SupabaseClient): Promise<HourCount[]> {
  const { data, error } = await client
    .from('posts')
    .select('created_at');
  if (error) {
    logError('posts:hourly', error);
    return Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  }
  const counts = new Array<number>(24).fill(0);
  for (const row of (data ?? []) as Array<{ created_at: string }>) {
    const kst = new Date(new Date(row.created_at).getTime() + KST_OFFSET_MS);
    const hour = kst.getUTCHours();
    counts[hour] = (counts[hour] ?? 0) + 1;
  }
  return counts.map((count, hour) => ({ hour, count }));
}
