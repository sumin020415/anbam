'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import type { PostSort } from '@/lib/services/posts';

const TABS: { key: PostSort; label: string }[] = [
  { key: 'latest', label: '최신순' },
  { key: 'likes', label: '좋아요순' },
  { key: 'dislikes', label: '싫어요순' },
  { key: 'views', label: '조회순' },
  { key: 'comments', label: '댓글순' },
];

export default function PostTabs({ current }: { current: PostSort }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const handleClick = (sort: PostSort) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === 'latest') params.delete('sort');
    else params.set('sort', sort);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  return (
    <nav
      aria-label="게시글 정렬"
      className={`mb-6 border-b border-line-1 ${pending ? 'opacity-60' : ''}`}
    >
      <ul className="flex flex-wrap items-center gap-1">
        {TABS.map((tab) => {
          const active = current === tab.key;
          return (
            <li key={tab.key}>
              <button
                type="button"
                onClick={() => handleClick(tab.key)}
                className={`relative px-4 py-3 text-sm font-bold transition ${
                  active
                    ? 'text-ink-1'
                    : 'text-ink-2 hover:text-ink-1'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {tab.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 -bottom-px h-0.5 bg-ink-1"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
