import type { SupabaseClient } from '@supabase/supabase-js';

export async function getProfile(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from('profiles')
    .select('id, username, nickname, avatar_url')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// 마이페이지 프로필 수정 (닉네임 / 아바타). 전달된 필드만 업데이트.
// profiles_update_self RLS 로 본인만 가능.
export async function updateProfile(
  client: SupabaseClient,
  userId: string,
  input: { nickname?: string; avatar_url?: string },
): Promise<void> {
  const { error } = await client
    .from('profiles')
    .update(input)
    .eq('id', userId);
  if (error) throw error;
}

export async function isNicknameTaken(
  client: SupabaseClient,
  nickname: string,
): Promise<boolean> {
  const { count, error } = await client
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('nickname', nickname);
  if (error) throw error;
  return (count ?? 0) > 0;
}
