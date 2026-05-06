'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/lib/schemas/auth';
import { requestPasswordReset } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (input: ForgotPasswordInput) => {
    setSubmitError(null);
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
      await requestPasswordReset(createClient(), input.email, redirectTo);
      setSent(true);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : '메일 발송 중 오류가 발생했습니다';
      setSubmitError(message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-anbam bg-white p-8 shadow-card space-y-5">
        <h1 className="text-2xl font-bold text-ink-1">비밀번호 재설정</h1>

        {sent ? (
          <>
            <p className="text-sm text-ink-2 rounded-anbam bg-line-2 px-3 py-2">
              입력하신 이메일로 재설정 안내를 보냈습니다. 메일이 오지 않으면
              가입 여부와 스팸함을 확인해주세요.
            </p>
            <Link
              href="/login"
              className="block text-center text-sm font-bold text-ink-1 underline"
            >
              로그인으로 돌아가기
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <p className="text-sm text-ink-2">
              가입하신 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm text-ink-2">
                이메일
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email')}
                className="w-full rounded-anbam border border-line-1 bg-white px-4 py-3 text-ink-1 placeholder:text-ink-2 focus:outline-none focus:border-point"
              />
              {errors.email && (
                <p className="text-warn text-xs">{errors.email.message}</p>
              )}
            </div>

            {submitError && (
              <p className="text-warn text-sm rounded-anbam bg-line-2 px-3 py-2">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-anbam bg-point py-3 font-bold text-ink-1 shadow-card disabled:opacity-60"
            >
              {isSubmitting ? '발송 중...' : '재설정 메일 보내기'}
            </button>

            <p className="text-center text-sm text-ink-2">
              <Link href="/login" className="font-bold text-ink-1 underline">
                로그인으로 돌아가기
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
