import type { SupabaseClient } from '@supabase/supabase-js';

export type ReactionType = 'like' | 'dislike';

export type ReactionCounts = { like: number; dislike: number };

function toKoreanReactionError(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}): string {
  console.error('[reactions] Supabase error:', {
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
    return '권한이 없습니다.';
  }
  return '반응 처리 중 오류가 발생했습니다.';
}

export async function getReactionCounts(
  client: SupabaseClient,
  postId: string,
): Promise<ReactionCounts> {
  const [likeRes, dislikeRes] = await Promise.all([
    client
      .from('reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('type', 'like'),
    client
      .from('reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('type', 'dislike'),
  ]);
  if (likeRes.error) {
    console.error('[reactions] like count error:', likeRes.error);
  }
  if (dislikeRes.error) {
    console.error('[reactions] dislike count error:', dislikeRes.error);
  }
  return {
    like: likeRes.count ?? 0,
    dislike: dislikeRes.count ?? 0,
  };
}

export async function getMyReaction(
  client: SupabaseClient,
  postId: string,
): Promise<ReactionType | null> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  const { data, error } = await client
    .from('reactions')
    .select('type')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) {
    console.error('[reactions] getMyReaction error:', error);
    return null;
  }
  return (data?.type ?? null) as ReactionType | null;
}

export async function setReaction(
  client: SupabaseClient,
  postId: string,
  type: ReactionType,
): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) {
    throw new Error('로그인이 필요합니다.');
  }
  const { error } = await client
    .from('reactions')
    .upsert(
      { post_id: postId, user_id: user.id, type },
      { onConflict: 'post_id,user_id' },
    );
  if (error) throw new Error(toKoreanReactionError(error));
}

export async function removeReaction(
  client: SupabaseClient,
  postId: string,
): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) {
    throw new Error('로그인이 필요합니다.');
  }
  const { error } = await client
    .from('reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', user.id);
  if (error) throw new Error(toKoreanReactionError(error));
}
