// 지도 핀 필터 타입 + 가드 — server / client 양쪽에서 import 가능하도록 분리.
// `'use client'` 모듈 안에 두면 서버 컴포넌트에서 호출 시
// "Attempted to call X() from the server" 에러 발생 (CLAUDE.md §9 'use client' 경계).

export type PinFilter = 'all' | 'cctv' | 'lamp' | 'post';

export const PIN_FILTER_OPTIONS: { value: PinFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'cctv', label: 'CCTV' },
  { value: 'lamp', label: '보안등' },
  { value: 'post', label: '제보' },
];

export function isPinFilter(value: string | null | undefined): value is PinFilter {
  return value === 'all' || value === 'cctv' || value === 'lamp' || value === 'post';
}
