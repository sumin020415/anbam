import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PostCreateInput,
  PostUpdateInput,
} from '@/lib/schemas/post';
import { deletePostImage } from './storage';

export type PostRow = {
  id: string;
  author_id: string;
  title: string;
  content: string;
  image_url: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  view_count: number;
  created_at: string;
  profiles: { nickname: string | null } | null;
  comments?: { count: number }[];
  like_count?: number;
  dislike_count?: number;
};

export type PostSort = 'latest' | 'likes' | 'dislikes' | 'views' | 'comments';

export const POSTS_PAGE_SIZE = 20;

const POST_SELECT =
  'id, author_id, title, content, image_url, lat, lng, address, view_count, created_at, profiles!posts_author_id_fkey(nickname)';

const POST_SELECT_WITH_COMMENT_COUNT = `${POST_SELECT}, comments(count)`;

function toKoreanPostError(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}): string {
  console.error('[posts] Supabase error:', {
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
    return '권한이 없습니다. 본인 글만 수정/삭제할 수 있어요.';
  }
  if (error.code === 'PGRST116' || /not found/i.test(msg)) {
    return '게시글을 찾을 수 없습니다.';
  }
  return '게시글 처리 중 오류가 발생했습니다.';
}

async function attachReactionCounts(
  client: SupabaseClient,
  rows: PostRow[],
): Promise<PostRow[]> {
  if (rows.length === 0) return rows;
  const ids = rows.map((r) => r.id);
  const { data, error } = await client
    .from('reactions')
    .select('post_id, type')
    .in('post_id', ids);
  if (error) {
    console.error('[posts] attachReactionCounts error:', error);
    return rows;
  }
  const likeMap = new Map<string, number>();
  const dislikeMap = new Map<string, number>();
  for (const r of (data ?? []) as { post_id: string; type: string }[]) {
    const map = r.type === 'like' ? likeMap : dislikeMap;
    map.set(r.post_id, (map.get(r.post_id) ?? 0) + 1);
  }
  return rows.map((r) => ({
    ...r,
    like_count: likeMap.get(r.id) ?? 0,
    dislike_count: dislikeMap.get(r.id) ?? 0,
  }));
}

// 마이페이지 "내 제보" - 작성자 본인 글 목록 (최신순, 댓글 수 + 반응 수 포함, PostCard 재사용)
export async function getPostsByAuthor(
  client: SupabaseClient,
  authorId: string,
): Promise<PostRow[]> {
  const { data, error } = await client
    .from('posts')
    .select(POST_SELECT_WITH_COMMENT_COUNT)
    .eq('author_id', authorId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(toKoreanPostError(error));
  const rows = (data ?? []) as unknown as PostRow[];
  return attachReactionCounts(client, rows);
}

// 마이페이지 "좋아요" - 내가 좋아요(👍) 누른 글 목록 (좋아요 누른 최신순)
export async function getLikedPosts(
  client: SupabaseClient,
  userId: string,
): Promise<PostRow[]> {
  const { data: reacts, error: rErr } = await client
    .from('reactions')
    .select('post_id, created_at')
    .eq('user_id', userId)
    .eq('type', 'like')
    .order('created_at', { ascending: false });
  if (rErr) throw new Error(toKoreanPostError(rErr));
  const ids = (reacts ?? []).map((r) => (r as { post_id: number }).post_id);
  if (ids.length === 0) return [];

  const { data, error } = await client
    .from('posts')
    .select(POST_SELECT_WITH_COMMENT_COUNT)
    .in('id', ids);
  if (error) throw new Error(toKoreanPostError(error));
  const rows = await attachReactionCounts(
    client,
    (data ?? []) as unknown as PostRow[],
  );
  // 좋아요 누른 순서(reaction 최신순) 유지
  const order = new Map(ids.map((id, i) => [String(id), i]));
  return rows.sort(
    (a, b) => (order.get(String(a.id)) ?? 0) - (order.get(String(b.id)) ?? 0),
  );
}

function escapeIlikeTerm(q: string): string {
  return q.replace(/([%_])/g, '\\$1');
}

function applySearch<T extends { or: (q: string) => T }>(
  query: T,
  q: string | undefined,
): T {
  if (!q || q.trim().length === 0) return query;
  const term = escapeIlikeTerm(q.trim());
  return query.or(`title.ilike.%${term}%,content.ilike.%${term}%`);
}

async function getPostsByLatest(
  client: SupabaseClient,
  limit: number,
  offset: number,
  q?: string,
): Promise<PostRow[]> {
  const base = client
    .from('posts')
    .select(POST_SELECT_WITH_COMMENT_COUNT)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  const { data, error } = await applySearch(base, q);
  if (error) throw new Error(toKoreanPostError(error));
  return attachReactionCounts(client, (data ?? []) as unknown as PostRow[]);
}

async function getPostsByViews(
  client: SupabaseClient,
  limit: number,
  offset: number,
  q?: string,
): Promise<PostRow[]> {
  const base = client
    .from('posts')
    .select(POST_SELECT_WITH_COMMENT_COUNT)
    .order('view_count', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  const { data, error } = await applySearch(base, q);
  if (error) throw new Error(toKoreanPostError(error));
  return attachReactionCounts(client, (data ?? []) as unknown as PostRow[]);
}

async function getPostsByExternalCount(
  client: SupabaseClient,
  countMap: Map<string, number>,
  limit: number,
  offset: number,
  q?: string,
): Promise<PostRow[]> {
  const base = client.from('posts').select(POST_SELECT_WITH_COMMENT_COUNT);
  const { data, error } = await applySearch(base, q);
  if (error) throw new Error(toKoreanPostError(error));
  const rows = await attachReactionCounts(
    client,
    (data ?? []) as unknown as PostRow[],
  );
  rows.sort((a, b) => {
    const ma = countMap.get(a.id) ?? 0;
    const mb = countMap.get(b.id) ?? 0;
    if (mb !== ma) return mb - ma;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return rows.slice(offset, offset + limit);
}

async function getPostsByReaction(
  client: SupabaseClient,
  type: 'like' | 'dislike',
  limit: number,
  offset: number,
  q?: string,
): Promise<PostRow[]> {
  const { data, error } = await client
    .from('reactions')
    .select('post_id')
    .eq('type', type);
  if (error) {
    console.error(`[posts] getPostsByReaction(${type}) error:`, error);
    return [];
  }
  const countMap = new Map<string, number>();
  for (const r of (data ?? []) as { post_id: string }[]) {
    countMap.set(r.post_id, (countMap.get(r.post_id) ?? 0) + 1);
  }
  return getPostsByExternalCount(client, countMap, limit, offset, q);
}

async function getPostsByComments(
  client: SupabaseClient,
  limit: number,
  offset: number,
  q?: string,
): Promise<PostRow[]> {
  const { data, error } = await client.from('comments').select('post_id');
  if (error) {
    console.error('[posts] getPostsByComments error:', error);
    return [];
  }
  const countMap = new Map<string, number>();
  for (const r of (data ?? []) as { post_id: string }[]) {
    countMap.set(r.post_id, (countMap.get(r.post_id) ?? 0) + 1);
  }
  return getPostsByExternalCount(client, countMap, limit, offset, q);
}

export async function getPosts(
  client: SupabaseClient,
  opts: {
    sort?: PostSort;
    q?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<PostRow[]> {
  const {
    sort = 'latest',
    q,
    limit = POSTS_PAGE_SIZE,
    offset = 0,
  } = opts;
  switch (sort) {
    case 'latest':
      return getPostsByLatest(client, limit, offset, q);
    case 'views':
      return getPostsByViews(client, limit, offset, q);
    case 'likes':
      return getPostsByReaction(client, 'like', limit, offset, q);
    case 'dislikes':
      return getPostsByReaction(client, 'dislike', limit, offset, q);
    case 'comments':
      return getPostsByComments(client, limit, offset, q);
  }
}

export async function getPost(
  client: SupabaseClient,
  id: string,
): Promise<PostRow | null> {
  const { data, error } = await client
    .from('posts')
    .select(POST_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(toKoreanPostError(error));
  return (data ?? null) as unknown as PostRow | null;
}

export async function createPost(
  client: SupabaseClient,
  input: PostCreateInput,
): Promise<{ id: string }> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) {
    throw new Error('로그인이 필요합니다.');
  }
  const { data, error } = await client
    .from('posts')
    .insert({
      author_id: user.id,
      title: input.title,
      content: input.content,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      address: input.address ?? null,
      image_url: input.image_url ?? null,
    })
    .select('id')
    .single();
  if (error) throw new Error(toKoreanPostError(error));
  return data;
}

export async function updatePost(
  client: SupabaseClient,
  id: string,
  input: PostUpdateInput,
): Promise<void> {
  const { data: prev } = await client
    .from('posts')
    .select('image_url')
    .eq('id', id)
    .maybeSingle();

  const newImageUrl = input.image_url ?? null;
  const oldImageUrl = (prev?.image_url as string | null | undefined) ?? null;

  const { error } = await client
    .from('posts')
    .update({
      title: input.title,
      content: input.content,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      address: input.address ?? null,
      image_url: newImageUrl,
    })
    .eq('id', id);
  if (error) throw new Error(toKoreanPostError(error));

  if (oldImageUrl && oldImageUrl !== newImageUrl) {
    await deletePostImage(client, oldImageUrl);
  }
}

export async function deletePost(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { data: prev } = await client
    .from('posts')
    .select('image_url')
    .eq('id', id)
    .maybeSingle();

  const { error } = await client.from('posts').delete().eq('id', id);
  if (error) throw new Error(toKoreanPostError(error));

  const oldImageUrl = (prev?.image_url as string | null | undefined) ?? null;
  if (oldImageUrl) {
    await deletePostImage(client, oldImageUrl);
  }
}

// 조회수 +1. 일반 UPDATE 는 posts RLS(작성자 본인만)+anon GRANT 없음으로 막혀서
// 비로그인/타 사용자가 카운팅 안 됨 → SECURITY DEFINER RPC 로 RLS 우회 (docs/schema.sql §11).
export async function incrementViewCount(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  // posts.id 는 라이브에서 bigint → RPC 인자도 number 로 전달 (schema.sql §11)
  const postId = Number(id);
  if (!Number.isFinite(postId)) return;
  const { error } = await client.rpc('increment_post_view', { post_id: postId });
  if (error) console.error('[posts:incrementViewCount] error:', error);
}
