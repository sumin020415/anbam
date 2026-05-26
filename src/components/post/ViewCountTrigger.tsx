'use client';

import { useEffect, useRef } from 'react';
import { incrementViewCount } from '@/lib/services/posts';
import { createClient } from '@/lib/supabase/client';

export default function ViewCountTrigger({ postId }: { postId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return; // 같은 마운트 중복(StrictMode) 방지
    fired.current = true;

    // 같은 세션 내 새로고침/재방문 중복 카운팅 방지 (탭/세션 닫으면 리셋 → 다음 방문 1회 재카운팅)
    const key = `anbam:viewed:${postId}`;
    try {
      if (sessionStorage.getItem(key)) return; // 이미 이 세션에 본 글 → skip
      sessionStorage.setItem(key, '1');
    } catch {
      // sessionStorage 접근 불가(프라이빗 모드 등) - 가드 없이 카운팅 진행 (degradation)
    }
    void incrementViewCount(createClient(), postId);
  }, [postId]);

  return null;
}
