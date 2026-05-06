import { z } from 'zod';

export const commentCreateSchema = z.object({
  postId: z.string().uuid(),
  parentId: z.string().uuid().nullable().optional(),
  content: z
    .string()
    .min(1, { message: '댓글 내용을 입력하세요' })
    .max(1000, { message: '댓글은 1000자 이하' }),
});

export type CommentCreateInput = z.infer<typeof commentCreateSchema>;

export const commentUpdateSchema = z.object({
  content: z
    .string()
    .min(1, { message: '댓글 내용을 입력하세요' })
    .max(1000, { message: '댓글은 1000자 이하' }),
});

export type CommentUpdateInput = z.infer<typeof commentUpdateSchema>;
