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

// 신고 처리 상태 라벨 (마이페이지 / admin 공용)
export const REPORT_STATUS_LABEL: Record<string, string> = {
  pending: '접수',
  reviewed: '처리완료',
  dismissed: '반려',
};

export const REPORT_STATUS_OPTIONS = [
  'pending',
  'reviewed',
  'dismissed',
] as const;

// 게시글 또는 댓글 신고. postId / commentId 중 하나만 전달.
// 타깃별 1인 1신고(unique) 위반 시 안내.
export async function createReport(
  client: SupabaseClient,
  input: {
    postId?: string;
    commentId?: string;
    reason: string;
    detail?: string;
  },
): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) {
    throw new Error('로그인이 필요합니다.');
  }

  const { error } = await client.from('reports').insert({
    post_id: input.postId != null ? Number(input.postId) : null,
    comment_id: input.commentId != null ? Number(input.commentId) : null,
    reporter_id: user.id,
    reason: input.reason,
    detail: input.detail?.trim() ? input.detail.trim() : null,
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error('이미 신고하셨습니다.');
    }
    console.error('[reports] createReport error:', error);
    throw new Error('신고 처리 중 오류가 발생했습니다.');
  }
}

// 마이페이지 "내 신고" - 본인이 한 신고 + 대상(글/댓글) + 상태/답변.
export type MyReportRow = {
  id: number;
  post_id: number | null;
  comment_id: number | null;
  reason: string;
  detail: string | null;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
  posts: { id: number; title: string } | null;
  comments: { id: number; content: string; post_id: number } | null;
};

const REPORT_SELECT =
  'id, post_id, comment_id, reason, detail, status, admin_reply, replied_at, created_at, posts(id, title), comments(id, content, post_id)';

export async function getMyReports(
  client: SupabaseClient,
  userId: string,
): Promise<MyReportRow[]> {
  const { data, error } = await client
    .from('reports')
    .select(REPORT_SELECT)
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[reports] getMyReports error:', error);
    return [];
  }
  return (data ?? []) as unknown as MyReportRow[];
}

// 관리자 - 전체 신고 (RLS reports_select_self_or_admin 가 is_admin 한정). 신고자 닉네임 포함.
export type AdminReportRow = MyReportRow & {
  reporter_id: string;
  profiles: { nickname: string | null } | null;
};

export async function getAllReports(
  client: SupabaseClient,
): Promise<AdminReportRow[]> {
  const { data, error } = await client
    .from('reports')
    .select(
      `${REPORT_SELECT}, reporter_id, profiles!reports_reporter_id_fkey(nickname)`,
    )
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[reports] getAllReports error:', error);
    return [];
  }
  return (data ?? []) as unknown as AdminReportRow[];
}

// 관리자 - 신고 처리 (상태 변경 + 답변). RLS update 가 is_admin 한정.
export async function updateReport(
  client: SupabaseClient,
  id: number,
  input: { status: string; adminReply?: string },
): Promise<void> {
  const { error } = await client
    .from('reports')
    .update({
      status: input.status,
      admin_reply: input.adminReply?.trim() ? input.adminReply.trim() : null,
      replied_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) {
    console.error('[reports] updateReport error:', error);
    throw new Error('신고 처리 중 오류가 발생했습니다.');
  }
}
