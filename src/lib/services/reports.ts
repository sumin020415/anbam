import type { SupabaseClient } from '@supabase/supabase-js';

// 신고 사유 고정 목록 (라디오). value 가 DB reason 에 저장됨.
export const REPORT_REASONS = [
  '스팸·광고',
  '욕설·혐오 표현',
  '부적절·불법 정보',
  '허위 정보',
  '기타',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

// 제보글 신고. posts.id 는 bigint → Number 변환. 1인 1신고(unique) 위반 시 안내.
export async function createReport(
  client: SupabaseClient,
  input: { postId: string; reason: string; detail?: string },
): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) {
    throw new Error('로그인이 필요합니다.');
  }

  const { error } = await client.from('reports').insert({
    post_id: Number(input.postId),
    reporter_id: user.id,
    reason: input.reason,
    detail: input.detail?.trim() ? input.detail.trim() : null,
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error('이미 신고하신 글입니다.');
    }
    console.error('[reports] createReport error:', error);
    throw new Error('신고 처리 중 오류가 발생했습니다.');
  }
}
