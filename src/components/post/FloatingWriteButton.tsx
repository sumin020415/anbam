'use client';

import Link from 'next/link';
import { useUser } from '@/hooks/useUser';

export default function FloatingWriteButton() {
  const { user, loading } = useUser();
  if (loading) return null;

  const href = user ? '/posts/new' : '/login';

  return (
    <Link
      href={href}
      aria-label="새 제보 작성"
      className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-point text-ink-1 shadow-card transition hover:brightness-95 active:scale-95"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    </Link>
  );
}
