import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'post-images';
const AVATAR_BUCKET = 'avatars';

export type UploadedImage = {
  path: string;
  url: string;
};

function logStorageError(scope: string, error: unknown): void {
  console.error(`[storage:${scope}] error:`, error);
}

function toKoreanStorageError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (/permission denied|policy|row-level security/i.test(msg)) {
    return '이미지 업로드 권한이 없습니다. 로그인 상태를 확인해 주세요.';
  }
  if (/payload too large|exceeded|size/i.test(msg)) {
    return '이미지 크기가 너무 큽니다.';
  }
  if (/mime|content type/i.test(msg)) {
    return '지원하지 않는 이미지 형식입니다.';
  }
  return '이미지 처리 중 오류가 발생했습니다.';
}

function getFileExtension(file: File): string {
  const fromName = file.name?.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName) && fromName.length <= 5) {
    return fromName;
  }
  const fromType = file.type?.split('/')[1];
  if (fromType === 'jpeg') return 'jpg';
  return fromType ?? 'bin';
}

function extractStoragePath(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

export async function uploadPostImage(
  client: SupabaseClient,
  file: File,
): Promise<UploadedImage> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) {
    throw new Error('로그인이 필요합니다.');
  }

  const ext = getFileExtension(file);
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadErr } = await client.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadErr) {
    logStorageError('upload', uploadErr);
    throw new Error(toKoreanStorageError(uploadErr));
  }

  const { data: pub } = client.storage.from(BUCKET).getPublicUrl(path);

  return { path, url: pub.publicUrl };
}

// 프로필 아바타 업로드 - avatars 버킷 ({user.id}/{uuid}.{ext}, post-images 와 동일 RLS 패턴).
// 공개 버킷이라 getPublicUrl 로 바로 표시. 반환된 url 을 profiles.avatar_url 에 저장.
export async function uploadAvatar(
  client: SupabaseClient,
  file: File,
): Promise<string> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) {
    throw new Error('로그인이 필요합니다.');
  }

  const ext = getFileExtension(file);
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadErr } = await client.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (uploadErr) {
    logStorageError('avatar:upload', uploadErr);
    throw new Error(toKoreanStorageError(uploadErr));
  }

  const { data: pub } = client.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return pub.publicUrl;
}

export async function deletePostImage(
  client: SupabaseClient,
  pathOrUrl: string | null | undefined,
): Promise<void> {
  if (!pathOrUrl) return;

  const path = pathOrUrl.startsWith('http')
    ? extractStoragePath(pathOrUrl)
    : pathOrUrl;
  if (!path) {
    logStorageError('delete', {
      reason: 'invalid path/url',
      input: pathOrUrl,
    });
    return;
  }

  const { error } = await client.storage.from(BUCKET).remove([path]);
  if (error) {
    logStorageError('delete', error);
  }
}
