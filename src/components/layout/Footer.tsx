'use client';

import { usePathname } from 'next/navigation';

// 풀-뷰포트 지도 메인(`/`)은 스크롤이 없어 푸터를 넣으면 지도가 밀림 → 제외.
// 스크롤되는 콘텐츠 페이지(게시판/분석/마이페이지 등)에만 노출.
export default function Footer() {
  const pathname = usePathname();
  if (pathname === '/') return null;

  return (
    <footer className="shrink-0 border-t border-line-1 bg-white px-4 py-6 text-xs text-ink-2 sm:px-6 lg:px-10 xl:px-20">
      <div className="flex flex-col gap-1.5">
        <p>
          데이터 출처: 행정안전부 CCTV · 전국보안등 표준데이터 (
          <a
            href="https://www.data.go.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-ink-1"
          >
            data.go.kr
          </a>
          ) · 지도 © Kakao
        </p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>© 2026 ANBAM</span>
          <span aria-hidden>·</span>
          <span>포트폴리오 데모 프로젝트</span>
          <span aria-hidden>·</span>
          <a
            href="https://sumin020415.github.io/portfolio/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-ink-1"
          >
            포트폴리오
          </a>
        </p>
      </div>
    </footer>
  );
}
