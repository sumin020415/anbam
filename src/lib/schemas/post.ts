import { z } from 'zod';

export const postCreateSchema = z.object({
  title: z
    .string()
    .min(1, { message: '제목을 입력하세요' })
    .max(100, { message: '제목은 100자 이하' }),
  content: z
    .string()
    .min(1, { message: '내용을 입력하세요' })
    .max(5000, { message: '내용은 5000자 이하' }),
  lat: z
    .number()
    .min(-90, { message: '위도 범위 오류' })
    .max(90, { message: '위도 범위 오류' })
    .nullable()
    .optional(),
  lng: z
    .number()
    .min(-180, { message: '경도 범위 오류' })
    .max(180, { message: '경도 범위 오류' })
    .nullable()
    .optional(),
  address: z
    .string()
    .max(200, { message: '주소는 200자 이하' })
    .nullable()
    .optional(),
});

export type PostCreateInput = z.infer<typeof postCreateSchema>;

export const postUpdateSchema = postCreateSchema;

export type PostUpdateInput = z.infer<typeof postUpdateSchema>;
