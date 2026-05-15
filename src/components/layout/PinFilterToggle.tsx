'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  PIN_FILTER_OPTIONS,
  isPinFilter,
  type PinFilter,
} from '@/lib/utils/pinFilter';

export default function PinFilterToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const raw = searchParams.get('filter');
  const current: PinFilter = isPinFilter(raw) ? raw : 'all';

  const handleSelect = (value: PinFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div
      role="radiogroup"
      aria-label="핀 필터"
      className="flex items-center rounded-anbam border border-line-1 bg-white p-0.5 text-xs"
    >
      {PIN_FILTER_OPTIONS.map((opt) => {
        const active = current === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => handleSelect(opt.value)}
            className={
              active
                ? 'rounded-[10px] bg-ink-1 px-2.5 py-1 font-bold text-white'
                : 'rounded-[10px] px-2.5 py-1 text-ink-2 hover:text-ink-1'
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
