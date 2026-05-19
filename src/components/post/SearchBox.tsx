'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function SearchBox({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const [pending, startTransition] = useTransition();

  const navigate = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = next.trim();
    if (trimmed) params.set('q', trimmed);
    else params.delete('q');
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate(value);
  };

  const handleClear = () => {
    setValue('');
    navigate('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4" role="search">
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base"
        >
          🔍
        </span>
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="제목·본문 검색"
          aria-label="제보 검색"
          className={`w-full rounded-anbam border border-line-1 bg-white py-2.5 pl-10 pr-20 text-sm shadow-card placeholder:text-ink-2 focus:border-point focus:outline-none [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none ${
            pending ? 'opacity-60' : ''
          }`}
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="검색어 지우기"
              className="rounded-full px-2 py-1 text-xs text-ink-2 hover:bg-line-2"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="rounded-anbam bg-point px-3 py-1.5 text-xs font-bold text-ink-1 hover:opacity-90"
          >
            검색
          </button>
        </div>
      </div>
    </form>
  );
}
