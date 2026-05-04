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
