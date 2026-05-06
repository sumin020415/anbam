'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import {
  resetPasswordSchema,
  type ResetPasswordInput,
  PASSWORD_RULES,
} from '@/lib/schemas/auth';
import { updatePassword } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', passwordConfirm: '' },
    mode: 'onBlur',
  });

  const passwordValue = watch('password');
  const passwordConfirmValue = watch('passwordConfirm');
  const passwordMismatch =
    !!passwordValue &&
    !!passwordConfirmValue &&
    passwordValue !== passwordConfirmValue;

  const onSubmit = async (input: ResetPasswordInput) => {
    setSubmitError(null);
    try {
      await updatePassword(createClient(), input.password);
      setDone(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : '비밀번호 변경 중 오류가 발생했습니다';
      setSubmitError(message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm rounded-anbam bg-white p-8 shadow-card space-y-5"
      >
        <h1 className="text-2xl font-bold text-ink-1">새 비밀번호 설정</h1>

        {done ? (
          <p className="text-sm text-ink-2 rounded-anbam bg-line-2 px-3 py-2">
            비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다.
          </p>
        ) : (
          <>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm text-ink-2">
                새 비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="영문 + 숫자 + 특수기호 포함 8자 이상"
                  {...register('password')}
                  className="w-full rounded-anbam border border-line-1 bg-white pl-4 pr-11 py-3 text-ink-1 placeholder:text-ink-2 focus:outline-none focus:border-point"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? '비밀번호 숨기기' : '비밀번호 보이기'
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-2 hover:text-ink-1"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(passwordValue ?? '');
                  return (
                    <li
                      key={rule.key}
                      className={passed ? 'text-ink-1' : 'text-ink-2'}
                    >
                      {passed ? '✓' : '·'} {rule.label}
                    </li>
                  );
                })}
              </ul>
              {errors.password && (
                <p className="text-warn text-xs">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="passwordConfirm" className="text-sm text-ink-2">
                비밀번호 확인
              </label>
              <div className="relative">
                <input
                  id="passwordConfirm"
                  type={showPasswordConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="새 비밀번호 재입력"
                  {...register('passwordConfirm')}
                  className="w-full rounded-anbam border border-line-1 bg-white pl-4 pr-11 py-3 text-ink-1 placeholder:text-ink-2 focus:outline-none focus:border-point"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm((v) => !v)}
                  aria-label={
                    showPasswordConfirm
                      ? '비밀번호 숨기기'
                      : '비밀번호 보이기'
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-2 hover:text-ink-1"
                >
                  {showPasswordConfirm ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {passwordMismatch ? (
                <p className="text-warn text-xs">
                  비밀번호가 일치하지 않습니다
                </p>
              ) : errors.passwordConfirm ? (
                <p className="text-warn text-xs">
                  {errors.passwordConfirm.message}
                </p>
              ) : null}
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
              {isSubmitting ? '변경 중...' : '비밀번호 변경'}
            </button>
          </>
        )}
      </form>
    </main>
  );
}
