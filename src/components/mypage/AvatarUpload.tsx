'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { uploadAvatar } from '@/lib/services/storage';
import { updateProfile } from '@/lib/services/profiles';
import { createClient } from '@/lib/supabase/client';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export default function AvatarUpload({
  userId,
  nickname,
  avatarUrl,
}: {
  userId: string;
  nickname: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = () => inputRef.current?.click();

  const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일 재선택 허용
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('이미지 크기는 2MB 이하만 가능합니다.');
      return;
    }
    setUploading(true);
    try {
      const client = createClient();
      const url = await uploadAvatar(client, file);
      await updateProfile(client, userId, { avatar_url: url });
      setPreview(url);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '아바타 업로드 중 오류가 발생했습니다.',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={pick}
        aria-label="프로필 사진 변경"
        className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-line-2 ring-1 ring-line-1"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-ink-1">
            {nickname.charAt(0) || '?'}
          </span>
        )}
      </button>
      <div>
        <button
          type="button"
          onClick={pick}
          disabled={uploading}
          className="rounded-anbam border border-line-1 bg-line-2 px-3 py-2 text-sm font-bold text-ink-1 disabled:opacity-60"
        >
          {uploading ? '업로드 중…' : '사진 변경'}
        </button>
        <p className="mt-1 text-xs text-ink-2">JPG/PNG, 2MB 이하</p>
        {error && <p className="mt-1 text-xs text-warn">{error}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
      />
    </div>
  );
}
