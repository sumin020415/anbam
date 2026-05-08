'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapMarker } from 'react-kakao-maps-sdk';
import {
  postCreateSchema,
  type PostCreateInput,
} from '@/lib/schemas/post';
import { createPost, updatePost } from '@/lib/services/posts';
import { uploadPostImage } from '@/lib/services/storage';
import { createClient } from '@/lib/supabase/client';
import KakaoMap from '@/components/map/KakaoMap';

type Props = {
  mode: 'create' | 'edit';
  postId?: string;
  initial?: PostCreateInput;
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.kakao?.maps?.services) {
      resolve(null);
      return;
    }
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2Address(lng, lat, (result, status) => {
      if (
        status !== window.kakao.maps.services.Status.OK ||
        !result?.[0]
      ) {
        resolve(null);
        return;
      }
      const r = result[0];
      const road = r.road_address?.address_name;
      const jibun = r.address?.address_name;
      resolve(road ?? jibun ?? null);
    });
  });
}

export default function PostForm({ mode, postId, initial }: Props) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initial?.image_url ?? null,
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PostCreateInput>({
    resolver: zodResolver(postCreateSchema),
    defaultValues:
      initial ?? {
        title: '',
        content: '',
        lat: null,
        lng: null,
        address: null,
        image_url: null,
      },
  });

  const lat = watch('lat');
  const lng = watch('lng');
  const address = watch('address');
  const hasLocation = lat != null && lng != null;

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handlePickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const picked = e.target.files?.[0] ?? null;
    if (!picked) return;
    if (picked.size > MAX_IMAGE_BYTES) {
      setImageError('이미지는 5MB 이하만 업로드 가능합니다.');
      e.target.value = '';
      return;
    }
    setFile(picked);
  };

  const handleRemoveImage = () => {
    setFile(null);
    setPreviewUrl(null);
    setImageError(null);
  };

  const handleMapClick = async (latLng: { lat: number; lng: number }) => {
    setValue('lat', latLng.lat, { shouldDirty: true });
    setValue('lng', latLng.lng, { shouldDirty: true });
    const addr = await reverseGeocode(latLng.lat, latLng.lng);
    setValue('address', addr, { shouldDirty: true });
  };

  const handleClearLocation = () => {
    setValue('lat', null, { shouldDirty: true });
    setValue('lng', null, { shouldDirty: true });
    setValue('address', null, { shouldDirty: true });
  };

  const onSubmit = async (input: PostCreateInput) => {
    setSubmitError(null);
    setImageError(null);
    try {
      const client = createClient();

      let image_url: string | null = null;
      if (file) {
        const uploaded = await uploadPostImage(client, file);
        image_url = uploaded.url;
      } else if (mode === 'edit' && previewUrl) {
        image_url = previewUrl;
      }

      const payload = { ...input, image_url };

      if (mode === 'edit' && postId) {
        await updatePost(client, postId, payload);
        router.push(`/posts/${postId}`);
        router.refresh();
      } else {
        const { id } = await createPost(client, payload);
        router.push(`/posts/${id}`);
        router.refresh();
      }
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : '저장 중 오류가 발생했습니다',
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-anbam bg-white p-6 shadow-card"
    >
      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm text-ink-2">
          제목
        </label>
        <input
          id="title"
          type="text"
          maxLength={100}
          placeholder="제목을 입력하세요"
          {...register('title')}
          className="w-full rounded-anbam border border-line-1 bg-white px-4 py-3 text-ink-1 placeholder:text-ink-2 focus:outline-none focus:border-point"
        />
        {errors.title && (
          <p className="text-warn text-xs">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="content" className="text-sm text-ink-2">
          내용
        </label>
        <textarea
          id="content"
          rows={10}
          maxLength={5000}
          placeholder="내용을 입력하세요"
          {...register('content')}
          className="w-full rounded-anbam border border-line-1 bg-white px-4 py-3 text-ink-1 placeholder:text-ink-2 focus:outline-none focus:border-point resize-y"
        />
        {errors.content && (
          <p className="text-warn text-xs">{errors.content.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm text-ink-2">
          이미지 <span className="text-xs text-ink-2">(선택, 1장, 최대 5MB)</span>
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handlePickFile}
          className="block text-sm text-ink-2 file:mr-3 file:rounded-anbam file:border file:border-line-1 file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-ink-1 hover:file:bg-line-2"
        />
        {previewUrl && (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="이미지 미리보기"
              className="max-h-72 rounded-anbam border border-line-1"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute right-2 top-2 rounded-anbam bg-white/90 px-2 py-1 text-xs font-bold text-ink-1 shadow-card"
            >
              제거
            </button>
          </div>
        )}
        {imageError && (
          <p className="text-warn text-xs">{imageError}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm text-ink-2">
            위치{' '}
            <span className="text-xs text-ink-2">(지도 클릭, 선택)</span>
          </label>
          {hasLocation && (
            <button
              type="button"
              onClick={handleClearLocation}
              className="text-xs text-ink-2 underline"
            >
              위치 지우기
            </button>
          )}
        </div>
        <div className="h-72 w-full overflow-hidden rounded-anbam border border-line-1">
          <KakaoMap
            center={hasLocation ? { lat, lng } : undefined}
            level={hasLocation ? 4 : undefined}
            onClick={handleMapClick}
          >
            {hasLocation && <MapMarker position={{ lat, lng }} />}
          </KakaoMap>
        </div>
        {address && (
          <p className="text-xs text-ink-2">📍 {address}</p>
        )}
      </div>

      {submitError && (
        <p className="text-warn text-sm rounded-anbam bg-line-2 px-3 py-2">
          {submitError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-anbam border border-line-1 bg-white px-4 py-2.5 text-sm font-bold text-ink-1"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-anbam bg-point px-4 py-2.5 text-sm font-bold text-ink-1 shadow-card disabled:opacity-60"
        >
          {isSubmitting
            ? '저장 중...'
            : mode === 'edit'
              ? '수정'
              : '작성'}
        </button>
      </div>
    </form>
  );
}
