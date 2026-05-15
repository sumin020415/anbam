'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type PlaceItem = {
  place_name: string;
  address_name: string;
  road_address_name?: string;
  x: string; // lng
  y: string; // lat
};

type AddressItem = {
  address_name: string;
  road_address?: { address_name: string };
  x: string; // lng
  y: string; // lat
};

type ResultItem = {
  key: string;
  source: 'place' | 'address';
  primary: string;
  secondary: string;
  lat: number;
  lng: number;
};

type KakaoServicesWindow = Window & {
  kakao?: {
    maps?: {
      services?: {
        Places: new () => {
          keywordSearch: (
            keyword: string,
            callback: (data: PlaceItem[], status: string) => void,
          ) => void;
        };
        Geocoder: new () => {
          addressSearch: (
            address: string,
            callback: (data: AddressItem[], status: string) => void,
          ) => void;
        };
        Status: { OK: string };
      };
    };
  };
};

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function mergeResults(
  places: ResultItem[],
  addresses: ResultItem[],
): ResultItem[] {
  // 주소 결과를 위로 (사용자가 주소 입력 시 정확한 좌표 우선),
  // 같은 좌표는 dedup (소수점 4자리)
  const seen = new Set<string>();
  const out: ResultItem[] = [];
  for (const item of [...addresses, ...places]) {
    const k = `${item.lat.toFixed(4)},${item.lng.toFixed(4)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
    if (out.length >= 10) break;
  }
  return out;
}

export default function HeaderSearchBox() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounced = useDebounced(keyword, 500);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = debounced.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    const w = window as KakaoServicesWindow;
    const services = w.kakao?.maps?.services;
    if (!services) return;

    let cancelled = false;
    let places: ResultItem[] = [];
    let addresses: ResultItem[] = [];
    let placesDone = false;
    let addressesDone = false;

    const finish = () => {
      if (cancelled || !placesDone || !addressesDone) return;
      setResults(mergeResults(places, addresses));
    };

    const ps = new services.Places();
    ps.keywordSearch(trimmed, (data, status) => {
      if (cancelled) return;
      if (status === services.Status.OK) {
        places = data.slice(0, 10).map((p, i) => ({
          key: `place-${i}-${p.x}-${p.y}`,
          source: 'place',
          primary: p.place_name,
          secondary: p.road_address_name || p.address_name,
          lat: Number(p.y),
          lng: Number(p.x),
        }));
      }
      placesDone = true;
      finish();
    });

    const geocoder = new services.Geocoder();
    geocoder.addressSearch(trimmed, (data, status) => {
      if (cancelled) return;
      if (status === services.Status.OK) {
        addresses = data.slice(0, 10).map((a, i) => ({
          key: `address-${i}-${a.x}-${a.y}`,
          source: 'address',
          primary: a.road_address?.address_name || a.address_name,
          secondary: a.road_address ? a.address_name : '지번 주소',
          lat: Number(a.y),
          lng: Number(a.x),
        }));
      }
      addressesDone = true;
      finish();
    });

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const handleSelect = (item: ResultItem) => {
    setOpen(false);
    setKeyword('');
    router.push(`/?lat=${item.lat}&lng=${item.lng}`);
  };

  return (
    <div ref={ref} className="relative w-full max-w-xs">
      <div className="flex items-center rounded-anbam border border-line-1 bg-white">
        <svg
          className="ml-2.5 shrink-0 text-ink-2"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="주소·장소 검색"
          aria-label="위치 검색"
          className="flex-1 bg-transparent px-2.5 py-1.5 text-sm text-ink-1 placeholder:text-ink-2 focus:outline-none"
        />
      </div>
      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-anbam border border-line-1 bg-white shadow-card">
          {results.map((r) => (
            <li key={r.key}>
              <button
                type="button"
                onMouseDown={() => handleSelect(r)}
                className="block w-full px-3 py-2 text-left hover:bg-line-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={
                      r.source === 'address'
                        ? 'rounded bg-line-2 px-1.5 py-0.5 text-[10px] font-bold text-ink-2'
                        : 'rounded bg-point/30 px-1.5 py-0.5 text-[10px] font-bold text-ink-1'
                    }
                  >
                    {r.source === 'address' ? '주소' : '장소'}
                  </span>
                  <p className="line-clamp-1 flex-1 text-sm font-bold text-ink-1">
                    {r.primary}
                  </p>
                </div>
                <p className="mt-0.5 line-clamp-1 pl-[34px] text-xs text-ink-2">
                  {r.secondary}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
