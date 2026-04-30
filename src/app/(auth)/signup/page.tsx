'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { signupSchema, type SignupInput } from '@/lib/schemas/auth';
import { signUp } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', nickname: '' },
  });

  const onSubmit = async (input: SignupInput) => {
    setSubmitError(null);
    try {
      await signUp(createClient(), input);
      router.push('/login?signed_up=1');
    } catch (e) {
      const message =
        e instanceof Error ? e.message : '회원가입 중 오류가 발생했습니다';
      setSubmitError(message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm rounded-anbam bg-white p-8 shadow-card space-y-5"
      >
        <h1 className="text-2xl font-bold text-ink-1">회원가입</h1>

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

        <div className="space-y-1.5">
          <label htmlFor="nickname" className="text-sm text-ink-2">
            닉네임
          </label>
          <input
            id="nickname"
            type="text"
            placeholder="2~20자"
            {...register('nickname')}
            className="w-full rounded-anbam border border-line-1 bg-white px-4 py-3 text-ink-1 placeholder:text-ink-2 focus:outline-none focus:border-point"
          />
          {errors.nickname && (
            <p className="text-warn text-xs">{errors.nickname.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm text-ink-2">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="8자 이상"
            {...register('password')}
            className="w-full rounded-anbam border border-line-1 bg-white px-4 py-3 text-ink-1 placeholder:text-ink-2 focus:outline-none focus:border-point"
          />
          {errors.password && (
            <p className="text-warn text-xs">{errors.password.message}</p>
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
          {isSubmitting ? '가입 중...' : '가입하기'}
        </button>

        <p className="text-center text-sm text-ink-2">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-bold text-ink-1 underline">
            로그인
          </Link>
        </p>
      </form>
    </main>
  );
}
