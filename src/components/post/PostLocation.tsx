import KakaoMap from '@/components/map/KakaoMap';
import MapPin from '@/components/map/MapPin';

type Props = {
  lat: number | null;
  lng: number | null;
  address: string | null;
};

export default function PostLocation({ lat, lng, address }: Props) {
  if (lat == null || lng == null) return null;
  const position = { lat, lng };

  return (
    <section className="mt-6">
      <h2 className="text-sm font-bold text-ink-1">📍 제보 위치</h2>
      {address && (
        <p className="mt-1.5 text-sm text-ink-2 break-words">{address}</p>
      )}
      <div className="mt-3 h-56 w-full overflow-hidden rounded-anbam border border-line-1">
        <KakaoMap center={position} level={3}>
          <MapPin type="post" position={position} />
        </KakaoMap>
      </div>
    </section>
  );
}
