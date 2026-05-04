import { z } from 'zod';

const passwordRule = z
  .string()
  .min(8, { message: '비밀번호는 8자 이상' })
  .max(72, { message: '비밀번호는 72자 이하' })
  .regex(/[A-Za-z]/, { message: '영문을 포함해야 합니다' })
  .regex(/\d/, { message: '숫자를 포함해야 합니다' })
  .regex(/[^A-Za-z0-9]/, { message: '특수기호를 포함해야 합니다' });

export const signupSchema = z
  .object({
    email: z.string().email({ message: '올바른 이메일을 입력하세요' }),
    nickname: z
      .string()
      .min(2, { message: '닉네임은 2자 이상' })
      .max(20, { message: '닉네임은 20자 이하' }),
    password: passwordRule,
    passwordConfirm: z.string().min(1, { message: '비밀번호를 한 번 더 입력하세요' }),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ['passwordConfirm'],
    message: '비밀번호가 일치하지 않습니다',
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email({ message: '올바른 이메일을 입력하세요' }),
  password: z.string().min(1, { message: '비밀번호를 입력하세요' }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const PASSWORD_RULES = [
  { key: 'length', label: '8자 이상', test: (v: string) => v.length >= 8 },
  { key: 'letter', label: '영문 포함', test: (v: string) => /[A-Za-z]/.test(v) },
  { key: 'digit', label: '숫자 포함', test: (v: string) => /\d/.test(v) },
  { key: 'symbol', label: '특수기호 포함', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;
