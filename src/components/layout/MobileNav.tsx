'use client';

import { useEffect } from 'react';
import Link from 'next/link';

type NavItem = { href: string; label: string; disabled?: boolean };

type Props = {
  open: boolean;
  onClose: () => void;
  navItems: NavItem[];
  isActive: (href: string) => boolean;
  isLoggedIn: boolean;
  nickname: string | null;
  loading: boolean;
  onLogout: () => void;
};

// 모바일 (< md) 우측 슬라이드 드로어 nav. Header 가 데이터 소유 → 표현만 담당.
export default function MobileNav({
  open,
  onClose,
  navItems,
  isActive,
  isLoggedIn,
  nickname,
  loading,
  onLogout,
}: Props) {
  // Escape 로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const linkClass = (active: boolean) =>
    `block rounded-anbam px-3 py-3 text-base ${
      active ? 'font-bold text-ink-1 bg-line-2' : 'text-ink-2 hover:bg-line-2'
    }`;

  return (
    <div className="md:hidden">
      {/* 백드롭 */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* 드로어 (우측 슬라이드) */}
      <aside
        id="mobile-nav"
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 flex h-full w-64 max-w-[80vw] flex-col bg-white shadow-nav transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-nav shrink-0 items-center justify-between border-b border-line-1 px-4">
          <span className="font-bold text-ink-1">메뉴</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="메뉴 닫기"
            className="flex h-9 w-9 items-center justify-center rounded text-ink-2 hover:bg-line-2"
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
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) =>
              item.disabled ? (
                <li key={item.href}>
                  <span
                    className="block rounded-anbam px-3 py-3 text-base text-line-1"
                    aria-disabled="true"
                    title="준비 중"
                  >
                    {item.label}
                  </span>
                </li>
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={linkClass(isActive(item.href))}
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
            <li className="my-1 border-t border-line-1" aria-hidden="true" />
            {loading ? null : isLoggedIn ? (
              <>
                <li>
                  <Link
                    href="/mypage"
                    onClick={onClose}
                    className={linkClass(isActive('/mypage'))}
                  >
                    {nickname ? `${nickname}님` : '마이페이지'}
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    className="block w-full rounded-anbam px-3 py-3 text-left text-base text-ink-2 hover:bg-line-2"
                  >
                    로그아웃
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link
                  href="/login"
                  onClick={onClose}
                  className={linkClass(isActive('/login'))}
                >
                  로그인
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </aside>
    </div>
  );
}
