import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PostCreateInput,
  PostUpdateInput,
} from '@/lib/schemas/post';

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
};

const POST_SELECT =
  'id, author_id, title, content, image_url, lat, lng, address, view_count, created_at, profiles!posts_author_id_fkey(nickname)';

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

export async function getPostList(
  client: SupabaseClient,
  opts: { limit?: number; offset?: number } = {},
): Promise<PostRow[]> {
  const { limit = 20, offset = 0 } = opts;
  const { data, error } = await client
    .from('posts')
    .select(POST_SELECT)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(toKoreanPostError(error));
  return (data ?? []) as unknown as PostRow[];
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
  const { error } = await client
    .from('posts')
    .update({ title: input.title, content: input.content })
    .eq('id', id);
  if (error) throw new Error(toKoreanPostError(error));
}

export async function deletePost(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await client.from('posts').delete().eq('id', id);
  if (error) throw new Error(toKoreanPostError(error));
}

export async function incrementViewCount(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { data } = await client
    .from('posts')
    .select('view_count')
    .eq('id', id)
    .maybeSingle();
  if (!data) return;
  await client
    .from('posts')
    .update({ view_count: (data.view_count ?? 0) + 1 })
    .eq('id', id);
}
