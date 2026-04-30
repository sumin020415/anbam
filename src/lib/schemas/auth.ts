import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email({ message: '올바른 이메일을 입력하세요' }),
  password: z
    .string()
    .min(8, { message: '비밀번호는 8자 이상' })
    .max(72, { message: '비밀번호는 72자 이하' }),
  nickname: z
    .string()
    .min(2, { message: '닉네임은 2자 이상' })
    .max(20, { message: '닉네임은 20자 이하' }),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email({ message: '올바른 이메일을 입력하세요' }),
  password: z.string().min(1, { message: '비밀번호를 입력하세요' }),
});

export type LoginInput = z.infer<typeof loginSchema>;
