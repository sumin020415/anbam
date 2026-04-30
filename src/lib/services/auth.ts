import type { SupabaseClient } from '@supabase/supabase-js';
import type { LoginInput, SignupInput } from '@/lib/schemas/auth';

export async function signUp(client: SupabaseClient, input: SignupInput) {
  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { nickname: input.nickname },
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithPassword(
  client: SupabaseClient,
  input: LoginInput,
) {
  const { data, error } = await client.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) throw error;
  return data;
}

export async function signOut(client: SupabaseClient) {
  const { error } = await client.auth.signOut();
  if (error) throw error;
}
