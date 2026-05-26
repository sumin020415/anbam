'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { signOut } from '@/lib/services/auth';
import { getProfile } from '@/lib/services/profiles';
import { createClient } from '@/lib/supabase/client';
import HeaderSearchBox from './HeaderSearchBox';
import PinFilterToggle from './PinFilterToggle';
import MobileNav from './MobileNav';
import MobileMapBar from './MobileMapBar';

const NAV_ITEMS: { href: string; label: string; disabled?: boolean }[] = [
  { href: '/', label: '홈' },
  { href: '/posts', label: '제보' },
  { href: '/analysis', label: '분석' },
];

export default function Header() {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [nickname, setNickname] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // 라우트 변경 시 모바일 드로어 자동 닫기
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) {
      setNickname(null);
      return;
    }
    const client = createClient();
    let mounted = true;
    getProfile(client, user.id)
      .then((p) => {
        if (mounted) setNickname(p?.nickname ?? null);
      })
      .catch(() => {
        if (mounted) setNickname(null);
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleLogout = async () => {
    await signOut(createClient());
    router.push('/');
    router.refresh();
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const itemClass = (active: boolean) =>
    active ? 'font-bold text-ink-1' : 'hover:text-ink-1';

  const isMapPage = pathname === '/';

  return (
    <>
      <header className="sticky top-0 z-10 h-nav shrink-0 flex items-center gap-4 px-4 sm:px-6 lg:px-10 xl:px-20 bg-white shadow-nav border-b border-line-1">
      <Link href="/" className="flex items-center h-full shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="안밤" className="h-8 w-auto" />
      </Link>
      <div className="hidden flex-1 items-center justify-center gap-3 md:flex">
        {isMapPage && (
          <>
            <Suspense fallback={<div className="h-7 w-44 rounded-anbam border border-line-1 bg-white" />}>
              <PinFilterToggle />
            </Suspense>
            <HeaderSearchBox />
          </>
        )}
      </div>
      <nav className="hidden shrink-0 md:block">
        <ul className="flex items-center gap-10 text-ink-2 text-sm">
          {NAV_ITEMS.map((item) =>
            item.disabled ? (
              <li key={item.href}>
                <span
                  className="text-line-1 cursor-not-allowed"
                  title="준비 중"
                  aria-disabled="true"
                >
                  {item.label}
                </span>
              </li>
            ) : (
              <li key={item.href}>
                <Link href={item.href} className={itemClass(isActive(item.href))}>
                  {item.label}
                </Link>
              </li>
            ),
          )}
          {loading ? null : user ? (
            <>
              <li>
                <Link
                  href="/mypage"
                  className={itemClass(isActive('/mypage'))}
                >
                  {nickname ? `${nickname}님` : '마이페이지'}
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hover:text-ink-1"
                >
                  로그아웃
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link href="/login" className={itemClass(isActive('/login'))}>
                로그인
              </Link>
            </li>
          )}
        </ul>
      </nav>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="메뉴 열기"
        aria-expanded={mobileOpen}
        aria-controls="mobile-nav"
        className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded text-ink-2 hover:bg-line-2 md:hidden"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navItems={NAV_ITEMS}
        isActive={isActive}
        isLoggedIn={!!user}
        nickname={nickname}
        loading={loading}
        onLogout={handleLogout}
      />
      </header>
      {isMapPage && <MobileMapBar />}
    </>
  );
}
