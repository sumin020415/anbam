import type { SupabaseClient } from '@supabase/supabase-js';
import type { CommentCreateInput } from '@/lib/schemas/comment';

export type CommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  profiles: { nickname: string | null } | null;
};

const COMMENT_SELECT =
  'id, post_id, author_id, parent_id, content, created_at, profiles!comments_author_id_fkey(nickname)';

function toKoreanCommentError(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}): string {
  console.error('[comments] Supabase error:', {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
  const msg = error.message ?? '';
  if (
    error.code === '42501' ||
    /permission denied|violates row-level security|policy/i.test(msg)
  ) {
    return '권한이 없습니다. 본인 댓글만 수정/삭제할 수 있어요.';
  }
  if (error.code === 'PGRST116' || /not found/i.test(msg)) {
    return '댓글을 찾을 수 없습니다.';
  }
  return '댓글 처리 중 오류가 발생했습니다.';
}

// 마이페이지 "내 댓글" - 작성자 본인 댓글 (최신순, 각 댓글이 달린 글 제목/링크 포함)
export type MyCommentRow = {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  posts: { title: string } | null;
};

export async function getCommentsByAuthor(
  client: SupabaseClient,
  authorId: string,
): Promise<MyCommentRow[]> {
  const { data, error } = await client
    .from('comments')
    .select('id, post_id, content, created_at, posts(title)')
    .eq('author_id', authorId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(toKoreanCommentError(error));
  return (data ?? []) as unknown as MyCommentRow[];
}

export async function getComments(
  client: SupabaseClient,
  postId: string,
): Promise<CommentRow[]> {
  const { data, error } = await client
    .from('comments')
    .select(COMMENT_SELECT)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(toKoreanCommentError(error));
  return (data ?? []) as unknown as CommentRow[];
}

export async function createComment(
  client: SupabaseClient,
  input: CommentCreateInput,
): Promise<{ id: string }> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) {
    throw new Error('로그인이 필요합니다.');
  }
  const { data, error } = await client
    .from('comments')
    .insert({
      post_id: input.postId,
      author_id: user.id,
      parent_id: input.parentId ?? null,
      content: input.content,
    })
    .select('id')
    .single();
  if (error) throw new Error(toKoreanCommentError(error));
  return data;
}

export async function updateComment(
  client: SupabaseClient,
  id: string,
  content: string,
): Promise<void> {
  const { error } = await client
    .from('comments')
    .update({ content })
    .eq('id', id);
  if (error) throw new Error(toKoreanCommentError(error));
}

export async function deleteComment(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await client.from('comments').delete().eq('id', id);
  if (error) throw new Error(toKoreanCommentError(error));
}
