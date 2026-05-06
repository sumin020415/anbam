'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  commentUpdateSchema,
  type CommentUpdateInput,
} from '@/lib/schemas/comment';
import { createComment, updateComment } from '@/lib/services/comments';
import { createClient } from '@/lib/supabase/client';

type Props = {
  postId: string;
  parentId?: string;
  mode?: 'create' | 'edit';
  commentId?: string;
  initialContent?: string;
  placeholder?: string;
  onDone?: () => void;
};

export default function CommentForm({
  postId,
  parentId,
  mode = 'create',
  commentId,
  initialContent,
  placeholder = '댓글을 입력하세요',
  onDone,
}: Props) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentUpdateInput>({
    resolver: zodResolver(commentUpdateSchema),
    defaultValues: { content: initialContent ?? '' },
  });

  const onSubmit = async (input: CommentUpdateInput) => {
    setSubmitError(null);
    try {
      const client = createClient();
      if (mode === 'edit' && commentId) {
        await updateComment(client, commentId, input.content);
      } else {
        await createComment(client, {
          postId,
          parentId: parentId ?? null,
          content: input.content,
        });
      }
      reset({ content: '' });
      onDone?.();
      router.refresh();
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : '댓글 저장 중 오류가 발생했습니다',
      );
    }
  };

  const cancellable = mode === 'edit' || !!parentId;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <textarea
        rows={3}
        maxLength={1000}
        placeholder={placeholder}
        {...register('content')}
        className="w-full rounded-anbam border border-line-1 bg-white px-3 py-2 text-sm text-ink-1 placeholder:text-ink-2 focus:outline-none focus:border-point resize-y"
      />
      {errors.content && (
        <p className="text-warn text-xs">{errors.content.message}</p>
      )}
      {submitError && <p className="text-warn text-xs">{submitError}</p>}
      <div className="flex justify-end gap-2">
        {cancellable && (
          <button
            type="button"
            onClick={() => onDone?.()}
            className="rounded-anbam border border-line-1 bg-white px-3 py-1.5 text-xs font-bold text-ink-1"
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-anbam bg-point px-3 py-1.5 text-xs font-bold text-ink-1 shadow-card disabled:opacity-60"
        >
          {isSubmitting ? '저장 중...' : mode === 'edit' ? '수정' : '등록'}
        </button>
      </div>
    </form>
  );
}
