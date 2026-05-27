import { z } from 'zod';

// 닉네임 규칙은 signupSchema 와 동일 (2~20자)
export const profileSchema = z.object({
  nickname: z
    .string()
    .min(2, { message: '닉네임은 2자 이상' })
    .max(20, { message: '닉네임은 20자 이하' }),
});

export type ProfileInput = z.infer<typeof profileSchema>;
