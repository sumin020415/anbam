'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { profileSchema, type ProfileInput } from '@/lib/schemas/profile';
import { updateProfile, isNicknameTaken } from '@/lib/services/profiles';
import { createClient } from '@/lib/supabase/client';

type CheckState = 'idle' | 'checking' | 'available' | 'taken';

export default function ProfileEditForm({
  userId,
  initialNickname,
}: {
  userId: string;
  initialNickname: string;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [nicknameCheck, setNicknameCheck] = useState<CheckState>('idle');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { nickname: initialNickname },
  });

  const nicknameValue = watch('nickname');
  const unchanged = nicknameValue === initialNickname;

  // 닉네임 변경 시 중복확인 상태 리셋 (가입 폼과 동일 - 다시 확인해야 저장 가능)
  useEffect(() => {
    setNicknameCheck('idle');
    setDone(false);
    setServerError(null);
  }, [nicknameValue]);

  const handleCheck = async () => {
    if (!nicknameValue || nicknameValue.length < 2) return;
    // 본인 현재 닉네임은 자기 것이라 isNicknameTaken 이 true 로 나옴 → available 처리
    if (unchanged) {
      setNicknameCheck('available');
      return;
    }
    setNicknameCheck('checking');
    try {
      const taken = await isNicknameTaken(createClient(), nicknameValue);
      setNicknameCheck(taken ? 'taken' : 'available');
    } catch {
      setNicknameCheck('idle');
      setServerError('중복확인 중 오류가 발생했습니다.');
    }
  };

  const onSubmit = async (data: ProfileInput) => {
    setServerError(null);
    setDone(false);
    // 닉네임을 바꿨다면 중복확인 'available' 완료 필수 (가입 폼과 동일)
    if (data.nickname !== initialNickname && nicknameCheck !== 'available') {
      setServerError('닉네임 중복확인을 완료해주세요.');
      return;
    }
    try {
      await updateProfile(createClient(), userId, { nickname: data.nickname });
      setDone(true);
      router.refresh();
    } catch {
      setServerError('프로필 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <label htmlFor="nickname" className="block text-xs text-ink-2">
        닉네임
      </label>
      <div className="flex gap-2">
        <input
          id="nickname"
          {...register('nickname')}
          className="min-w-0 flex-1 rounded-anbam border border-line-1 px-3 py-2 text-sm text-ink-1 focus:border-point focus:outline-none"
        />
        <button
          type="button"
          onClick={handleCheck}
          disabled={nicknameCheck === 'checking' || !nicknameValue || unchanged}
          className="shrink-0 rounded-anbam border border-line-1 bg-line-2 px-3 py-2 text-sm font-bold text-ink-1 disabled:opacity-50"
        >
          중복확인
        </button>
        <button
          type="submit"
          disabled={isSubmitting || unchanged || nicknameCheck !== 'available'}
          className="shrink-0 rounded-anbam bg-point px-4 py-2 text-sm font-bold text-ink-1 disabled:opacity-60"
        >
          {isSubmitting ? '저장 중…' : '저장'}
        </button>
      </div>

      {errors.nickname && (
        <p className="text-xs text-warn">{errors.nickname.message}</p>
      )}
      {!errors.nickname && nicknameCheck === 'checking' && (
        <p className="text-xs text-ink-2">확인 중…</p>
      )}
      {!errors.nickname && nicknameCheck === 'available' && (
        <p className="text-xs text-ok">
          {unchanged ? '현재 사용 중인 닉네임입니다.' : '사용 가능한 닉네임입니다.'}
        </p>
      )}
      {!errors.nickname && nicknameCheck === 'taken' && (
        <p className="text-xs text-warn">이미 사용 중인 닉네임입니다.</p>
      )}
      {serverError && <p className="text-xs text-warn">{serverError}</p>}
      {done && <p className="text-xs text-ok">닉네임이 저장되었습니다.</p>}
    </form>
  );
}
