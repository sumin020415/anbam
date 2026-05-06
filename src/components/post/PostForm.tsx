'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  postCreateSchema,
  type PostCreateInput,
} from '@/lib/schemas/post';
import { createPost, updatePost } from '@/lib/services/posts';
import { createClient } from '@/lib/supabase/client';

type Props = {
  mode: 'create' | 'edit';
  postId?: string;
  initial?: PostCreateInput;
};

export default function PostForm({ mode, postId, initial }: Props) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PostCreateInput>({
    resolver: zodResolver(postCreateSchema),
    defaultValues: initial ?? { title: '', content: '' },
  });

  const onSubmit = async (input: PostCreateInput) => {
    setSubmitError(null);
    try {
      const client = createClient();
      if (mode === 'edit' && postId) {
        await updatePost(client, postId, input);
        router.push(`/posts/${postId}`);
        router.refresh();
      } else {
        const { id } = await createPost(client, input);
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
