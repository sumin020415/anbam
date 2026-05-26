import { createClient } from '@/lib/supabase/server';
import {
  getDistrictPinCounts,
  getDongPinCounts,
  getPostPins,
  type DistrictPinCount,
  type DongPinCount,
  type PostPin,
} from '@/lib/services/pins';
import MapHome from '@/components/map/MapHome';
import { isPinFilter, type PinFilter } from '@/lib/utils/pinFilter';

function parseLatLng(value: string | string[] | undefined): number | null {
  if (typeof value !== 'string') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; lat?: string; lng?: string }>;
}) {
  const sp = await searchParams;
  const filter: PinFilter = isPinFilter(sp.filter) ? sp.filter : 'all';
  const lat = parseLatLng(sp.lat);
  const lng = parseLatLng(sp.lng);
  const searchPosition = lat !== null && lng !== null ? { lat, lng } : null;

  const supabase = await createClient();
  const showCctv = filter === 'all' || filter === 'cctv';
  const showLamp = filter === 'all' || filter === 'lamp';
  const showPost = filter === 'all' || filter === 'post';

  // RPC 로 자치구 + 동 카운트만 fetch (~수 KB). 개별 핀은 MapHome 에서 lazy fetch.
  const [
    cctvDistrictCounts,
    lampDistrictCounts,
    cctvDongCounts,
    lampDongCounts,
    postPins,
  ] = await Promise.all<
    [
      Promise<DistrictPinCount[]>,
      Promise<DistrictPinCount[]>,
      Promise<DongPinCount[]>,
      Promise<DongPinCount[]>,
      Promise<PostPin[]>,
    ]
  >([
    showCctv ? getDistrictPinCounts(supabase, 'cctvs') : Promise.resolve([]),
    showLamp ? getDistrictPinCounts(supabase, 'lamps') : Promise.resolve([]),
    showCctv ? getDongPinCounts(supabase, 'cctvs') : Promise.resolve([]),
    showLamp ? getDongPinCounts(supabase, 'lamps') : Promise.resolve([]),
    showPost ? getPostPins(supabase) : Promise.resolve([] as PostPin[]),
  ]);

  return (
    <main className="flex-1">
      <MapHome
        cctvDistrictCounts={cctvDistrictCounts}
        lampDistrictCounts={lampDistrictCounts}
        cctvDongCounts={cctvDongCounts}
        lampDongCounts={lampDongCounts}
        postPins={postPins}
        searchPosition={searchPosition}
        showCctv={showCctv}
        showLamp={showLamp}
      />
    </main>
  );
}
