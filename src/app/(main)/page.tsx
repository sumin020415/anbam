import { createClient } from '@/lib/supabase/server';
import {
  getCctvPins,
  getLampPins,
  getPostPins,
} from '@/lib/services/pins';
import MapHome from '@/components/map/MapHome';

export default async function HomePage() {
  const supabase = await createClient();
  const [cctvPins, lampPins, postPins] = await Promise.all([
    getCctvPins(supabase),
    getLampPins(supabase),
    getPostPins(supabase),
  ]);

  return (
    <main className="flex-1">
      <MapHome
        cctvPins={cctvPins}
        lampPins={lampPins}
        postPins={postPins}
      />
    </main>
  );
}
