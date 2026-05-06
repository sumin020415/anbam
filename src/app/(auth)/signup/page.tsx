'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import {
  signupSchema,
  type SignupInput,
  PASSWORD_RULES,
} from '@/lib/schemas/auth';
import { signUp } from '@/lib/services/auth';
import { isNicknameTaken } from '@/lib/services/profiles';
import { createClient } from '@/lib/supabase/client';

const EMAIL_DOMAIN_PRESETS = [
  'gmail.com',
  'naver.com',
  'daum.net',
  'kakao.com',
  'nate.com',
  'hanmail.net',
] as const;
const CUSTOM_DOMAIN = '직접입력';

type CheckState = 'idle' | 'checking' | 'available' | 'taken' | 'error';

function Badge({ state }: { state: CheckState }) {
  if (state === 'idle') return null;
  const map: Record<Exclude<CheckState, 'idle'>, { text: string; cls: string }> = {
    checking: { text: '확인 중...', cls: 'text-ink-2 bg-line-2' },
    available: { text: '사용 가능', cls: 'text-ink-1 bg-ok/30' },
    taken: { text: '이미 사용 중', cls: 'text-warn bg-line-2' },
    error: { text: '확인 실패', cls: 'text-warn bg-line-2' },
  };
  const { text, cls } = map[state];
  return (
    <span className={`text-xs rounded-anbam px-2 py-1 ${cls}`}>{text}</span>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // 이메일 분리 입력 상태
  const [emailLocal, setEmailLocal] = useState('');
  const [emailDomainSelect, setEmailDomainSelect] = useState<string>(
    EMAIL_DOMAIN_PRESETS[0],
  );
  const [emailDomainCustom, setEmailDomainCustom] = useState('');

  // 중복확인 상태
  const [emailCheck, setEmailCheck] = useState<CheckState>('idle');
  const [nicknameCheck, setNicknameCheck] = useState<CheckState>('idle');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      nickname: '',
      password: '',
      passwordConfirm: '',
    },
    mode: 'onBlur',
  });

  const passwordValue = watch('password');
  const passwordConfirmValue = watch('passwordConfirm');
  const nicknameValue = watch('nickname');
  const emailValue = watch('email');

  const passwordMismatch =
    !!passwordValue &&
    !!passwordConfirmValue &&
    passwordValue !== passwordConfirmValue;

  // 이메일 로컬/도메인 변경 시 form 값 동기화 + 중복확인 리셋
  useEffect(() => {
    const domain =
      emailDomainSelect === CUSTOM_DOMAIN ? emailDomainCustom : emailDomainSelect;
    const combined = emailLocal && domain ? `${emailLocal}@${domain}` : '';
    setValue('email', combined, { shouldValidate: false });
    setEmailCheck('idle');
  }, [emailLocal, emailDomainSelect, emailDomainCustom, setValue]);

  // 닉네임 변경 시 중복확인 리셋
  useEffect(() => {
    setNicknameCheck('idle');
  }, [nicknameValue]);

  const handleCheckEmail = async () => {
    const ok = await trigger('email');
    if (!ok) return;
    setEmailCheck('checking');
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: emailValue }),
      });
      if (!res.ok) {
        setEmailCheck('error');
        return;
      }
      const data: { taken: boolean } = await res.json();
      setEmailCheck(data.taken ? 'taken' : 'available');
    } catch {
      setEmailCheck('error');
    }
  };

  const handleCheckNickname = async () => {
    const ok = await trigger('nickname');
    if (!ok) return;
    setNicknameCheck('checking');
    try {
      const taken = await isNicknameTaken(createClient(), nicknameValue);
      setNicknameCheck(taken ? 'taken' : 'available');
    } catch {
      setNicknameCheck('error');
    }
  };

  const onSubmit = async (input: SignupInput) => {
    setSubmitError(null);
    if (emailCheck !== 'available') {
      setSubmitError('이메일 중복확인을 완료해주세요');
      return;
    }
    if (nicknameCheck !== 'available') {
      setSubmitError('닉네임 중복확인을 완료해주세요');
      return;
    }
    try {
      await signUp(createClient(), input);
      router.push('/login?signed_up=1');
    } catch (e) {
      const message =
        e instanceof Error ? e.message : '회원가입 중 오류가 발생했습니다';
      setSubmitError(message);
    }
  };

  const submitDisabled =
    isSubmitting ||
    emailCheck !== 'available' ||
    nicknameCheck !== 'available';

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm rounded-anbam bg-white p-8 shadow-card space-y-5"
      >
        <h1 className="text-2xl font-bold text-ink-1">회원가입</h1>

        {/* 이메일 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="email-local" className="text-sm text-ink-2">
              이메일
            </label>
            <Badge state={emailCheck} />
          </div>
          <div className="flex gap-1.5">
            <input
              id="email-local"
              type="text"
              autoComplete="email"
              placeholder="아이디"
              value={emailLocal}
              onChange={(e) => setEmailLocal(e.target.value)}
              className="min-w-0 flex-1 rounded-anbam border border-line-1 bg-white px-3 py-3 text-ink-1 placeholder:text-ink-2 focus:outline-none focus:border-point"
            />
            <span className="self-center text-ink-2">@</span>
            {emailDomainSelect === CUSTOM_DOMAIN ? (
              <input
                type="text"
                placeholder="example.com"
                value={emailDomainCustom}
                onChange={(e) => setEmailDomainCustom(e.target.value)}
                className="min-w-0 flex-1 rounded-anbam border border-line-1 bg-white px-3 py-3 text-ink-1 placeholder:text-ink-2 focus:outline-none focus:border-point"
              />
            ) : (
              <span className="self-center min-w-0 flex-1 truncate text-ink-1 px-1">
                {emailDomainSelect}
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            <select
              value={emailDomainSelect}
              onChange={(e) => {
                setEmailDomainSelect(e.target.value);
                setEmailDomainCustom('');
              }}
              className="flex-1 rounded-anbam border border-line-1 bg-white px-3 py-2 text-sm text-ink-1 focus:outline-none focus:border-point"
            >
              {EMAIL_DOMAIN_PRESETS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
              <option value={CUSTOM_DOMAIN}>{CUSTOM_DOMAIN}</option>
            </select>
            <button
              type="button"
              onClick={handleCheckEmail}
              disabled={emailCheck === 'checking' || !emailValue}
              className="rounded-anbam border border-line-1 bg-line-2 px-3 py-2 text-sm font-bold text-ink-1 disabled:opacity-50"
            >
              중복확인
            </button>
          </div>
          {/* hidden RHF input */}
          <input type="hidden" {...register('email')} />
          {errors.email && (
            <p className="text-warn text-xs">{errors.email.message}</p>
          )}
        </div>

        {/* 닉네임 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="nickname" className="text-sm text-ink-2">
              닉네임
            </label>
            <Badge state={nicknameCheck} />
          </div>
          <div className="flex gap-1.5">
            <input
              id="nickname"
              type="text"
              placeholder="2~20자"
              {...register('nickname')}
              className="min-w-0 flex-1 rounded-anbam border border-line-1 bg-white px-4 py-3 text-ink-1 placeholder:text-ink-2 focus:outline-none focus:border-point"
            />
            <button
              type="button"
              onClick={handleCheckNickname}
              disabled={nicknameCheck === 'checking' || !nicknameValue}
              className="rounded-anbam border border-line-1 bg-line-2 px-3 py-2 text-sm font-bold text-ink-1 disabled:opacity-50"
            >
              중복확인
            </button>
          </div>
          {errors.nickname && (
            <p className="text-warn text-xs">{errors.nickname.message}</p>
          )}
        </div>

        {/* 비밀번호 */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm text-ink-2">
            비밀번호
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
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보이기'}
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

        {/* 비밀번호 확인 */}
        <div className="space-y-1.5">
          <label htmlFor="passwordConfirm" className="text-sm text-ink-2">
            비밀번호 확인
          </label>
          <div className="relative">
            <input
              id="passwordConfirm"
              type={showPasswordConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="비밀번호 재입력"
              {...register('passwordConfirm')}
              className="w-full rounded-anbam border border-line-1 bg-white pl-4 pr-11 py-3 text-ink-1 placeholder:text-ink-2 focus:outline-none focus:border-point"
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm((v) => !v)}
              aria-label={showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보이기'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-2 hover:text-ink-1"
            >
              {showPasswordConfirm ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {passwordMismatch ? (
            <p className="text-warn text-xs">비밀번호가 일치하지 않습니다</p>
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
          disabled={submitDisabled}
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
