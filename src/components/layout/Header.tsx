'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { signOut } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/client';

export default function Header() {
  const { user, loading } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(createClient());
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-10 h-nav flex items-center justify-between px-4 bg-white shadow-nav">
      <Link href="/" className="text-lg font-bold text-ink-1">
        안밤
      </Link>
      <nav className="flex items-center gap-3 text-sm">
        {loading ? null : user ? (
          <>
            <Link href="/mypage" className="text-ink-2 hover:text-ink-1">
              마이페이지
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-ink-2 hover:text-ink-1"
            >
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-ink-2 hover:text-ink-1">
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-anbam bg-point px-3 py-1.5 font-bold text-ink-1 shadow-card"
            >
              회원가입
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
