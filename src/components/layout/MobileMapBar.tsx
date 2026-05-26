'use client';

import { Suspense, useState } from 'react';
import PinFilterToggle from './PinFilterToggle';
import HeaderSearchBox from './HeaderSearchBox';

// 모바일 (< md) 지도 페이지 전용 서브바.
// 데스크탑은 Header 중앙에 검색·필터가 있지만 모바일은 헤더 폭 부족 → 헤더 아래 한 줄.
// 기본: 핀 필터 + 돋보기 아이콘 / 아이콘 탭 시: 검색 인풋 펼침 (공간 절약).
export default function MobileMapBar() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line-1 bg-white px-4 xl:hidden">
      {searchOpen ? (
        <>
          <div className="flex-1">
            <HeaderSearchBox />
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            aria-label="검색 닫기"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-ink-2 hover:bg-line-2"
          >
            <svg
              width="20"
              height="20"
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
        </>
      ) : (
        <>
          <div className="flex-1">
            <Suspense
              fallback={
                <div className="h-7 w-full rounded-anbam border border-line-1 bg-white" />
              }
            >
              <PinFilterToggle fullWidth />
            </Suspense>
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="위치 검색"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-anbam border border-line-1 text-ink-2 hover:bg-line-2"
          >
            <svg
              width="18"
              height="18"
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
          </button>
        </>
      )}
    </div>
  );
}
