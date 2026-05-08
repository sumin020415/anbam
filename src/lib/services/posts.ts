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
};

export const POSTS_PAGE_SIZE = 20;

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
  const { limit = POSTS_PAGE_SIZE, offset = 0 } = opts;
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
