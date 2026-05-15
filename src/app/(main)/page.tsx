import { createClient } from '@/lib/supabase/server';
import {
  getCctvPins,
  getLampPins,
  getPostPins,
  type CctvPin,
  type LampPin,
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

  const [cctvPins, lampPins, postPins] = await Promise.all<
    [Promise<CctvPin[]>, Promise<LampPin[]>, Promise<PostPin[]>]
  >([
    showCctv ? getCctvPins(supabase) : Promise.resolve([] as CctvPin[]),
    showLamp ? getLampPins(supabase) : Promise.resolve([] as LampPin[]),
    showPost ? getPostPins(supabase) : Promise.resolve([] as PostPin[]),
  ]);

  return (
    <main className="flex-1">
      <MapHome
        cctvPins={cctvPins}
        lampPins={lampPins}
        postPins={postPins}
        searchPosition={searchPosition}
      />
    </main>
  );
}
