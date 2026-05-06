import { AuthError, type SupabaseClient } from '@supabase/supabase-js';
import type { LoginInput, SignupInput } from '@/lib/schemas/auth';

function toKoreanLoginMessage(error: AuthError): string {
  const msg = error.message ?? '';
  if (
    error.code === 'invalid_credentials' ||
    /invalid login credentials/i.test(msg)
  ) {
    return '가입하신 이메일/비밀번호를 확인해주세요.';
  }
  if (error.status === 429 || /rate limit/i.test(msg)) {
    return '잠시 후 다시 시도해주세요.';
  }
  return '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
}

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
  if (error) {
    throw new Error(toKoreanLoginMessage(error));
  }
  return data;
}

export async function signOut(client: SupabaseClient) {
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function requestPasswordReset(
  client: SupabaseClient,
  email: string,
  redirectTo: string,
) {
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) throw error;
}

export async function updatePassword(
  client: SupabaseClient,
  newPassword: string,
) {
  const { error } = await client.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
