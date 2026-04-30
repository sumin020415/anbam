'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { loginSchema, type LoginInput } from '@/lib/schemas/auth';
import { signInWithPassword } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justSignedUp = searchParams.get('signed_up') === '1';
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (input: LoginInput) => {
    setSubmitError(null);
    try {
      await signInWithPassword(createClient(), input);
      router.push('/');
      router.refresh();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : '로그인 중 오류가 발생했습니다';
      setSubmitError(message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-sm rounded-anbam bg-white p-8 shadow-card space-y-5"
    >
      <h1 className="text-2xl font-bold text-ink-1">로그인</h1>

      {justSignedUp && (
        <p className="text-sm text-ink-2 rounded-anbam bg-line-2 px-3 py-2">
          가입이 완료되었습니다. 로그인해주세요.
        </p>
      )}

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
        <label htmlFor="password" className="text-sm text-ink-2">
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
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
        {isSubmitting ? '로그인 중...' : '로그인'}
      </button>

      <p className="text-center text-sm text-ink-2">
        아직 계정이 없으신가요?{' '}
        <Link href="/signup" className="font-bold text-ink-1 underline">
          회원가입
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
