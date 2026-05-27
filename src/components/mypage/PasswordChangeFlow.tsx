'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  resetPasswordSchema,
  type ResetPasswordInput,
  PASSWORD_RULES,
} from '@/lib/schemas/auth';
import { signInWithPassword, updatePassword } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/client';

// 2단계: (1) 현재 비밀번호 확인 → (2) 새 비밀번호 변경
export default function PasswordChangeFlow({ email }: { email: string }) {
  const [step, setStep] = useState<'verify' | 'change'>('verify');
  const [currentPassword, setCurrentPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange', // 새 비밀번호 확인 불일치 즉시 안내
    defaultValues: { password: '', passwordConfirm: '' },
  });
  const passwordValue = watch('password') ?? '';

  const inputClass =
    'w-full rounded-anbam border border-line-1 px-3 py-2 text-sm text-ink-1 focus:border-point focus:outline-none';

  const handleVerify = async () => {
    setVerifyError(null);
    setDone(false);
    if (!currentPassword) {
      setVerifyError('현재 비밀번호를 입력하세요.');
      return;
    }
    setVerifying(true);
    try {
      await signInWithPassword(createClient(), {
        email,
        password: currentPassword,
      });
      setStep('change');
    } catch {
      setVerifyError('현재 비밀번호가 일치하지 않습니다.');
    } finally {
      setVerifying(false);
    }
  };

  const onChangeSubmit = async (data: ResetPasswordInput) => {
    setServerError(null);
    try {
      await updatePassword(createClient(), data.password);
      setDone(true);
      setStep('verify');
      setCurrentPassword('');
      reset({ password: '', passwordConfirm: '' });
    } catch {
      setServerError('비밀번호 변경 중 오류가 발생했습니다.');
    }
  };

  const backToVerify = () => {
    setStep('verify');
    setCurrentPassword('');
    setServerError(null);
    reset({ password: '', passwordConfirm: '' });
  };

  if (step === 'verify') {
    return (
      <div className="max-w-sm space-y-2">
        <p className="text-sm text-ink-2">
          보안을 위해 현재 비밀번호를 먼저 확인합니다.
        </p>
        <input
          type="password"
          autoComplete="current-password"
          placeholder="현재 비밀번호"
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            setVerifyError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleVerify();
            }
          }}
          className={inputClass}
        />
        {verifyError && <p className="text-xs text-warn">{verifyError}</p>}
        {done && <p className="text-xs text-ok">비밀번호가 변경되었습니다.</p>}
        <button
          type="button"
          onClick={handleVerify}
          disabled={verifying || !currentPassword}
          className="rounded-anbam bg-point px-4 py-2 text-sm font-bold text-ink-1 disabled:opacity-60"
        >
          {verifying ? '확인 중…' : '확인'}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onChangeSubmit)}
      className="max-w-sm space-y-2"
    >
      <p className="text-sm font-medium text-ok">✓ 현재 비밀번호 확인 완료</p>
      <input
        type="password"
        autoComplete="new-password"
        placeholder="새 비밀번호"
        {...register('password')}
        className={inputClass}
      />
      <input
        type="password"
        autoComplete="new-password"
        placeholder="새 비밀번호 확인"
        {...register('passwordConfirm')}
        className={inputClass}
      />
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {PASSWORD_RULES.map((r) => {
          const ok = r.test(passwordValue);
          return (
            <li key={r.key} className={ok ? 'text-ok' : 'text-ink-2'}>
              {ok ? '✓' : '·'} {r.label}
            </li>
          );
        })}
      </ul>
      {errors.password && (
        <p className="text-xs text-warn">{errors.password.message}</p>
      )}
      {errors.passwordConfirm && (
        <p className="text-xs text-warn">{errors.passwordConfirm.message}</p>
      )}
      {serverError && <p className="text-xs text-warn">{serverError}</p>}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-anbam bg-point px-4 py-2 text-sm font-bold text-ink-1 disabled:opacity-60"
        >
          {isSubmitting ? '변경 중…' : '비밀번호 변경'}
        </button>
        <button
          type="button"
          onClick={backToVerify}
          className="rounded-anbam border border-line-1 px-4 py-2 text-sm font-bold text-ink-2 hover:text-ink-1"
        >
          취소
        </button>
      </div>
    </form>
  );
}
