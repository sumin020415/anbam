# 안밤 (ANBAM) — 부산 안전 정보 시민 커뮤니티

> Java/Spring Boot 로 만든 팀 프로젝트(2주, 4인)를 풀스택 TypeScript + Supabase 로 1인 재구현한 사이드 프로젝트.

🔗 **Live Demo** : https://anbam.vercel.app
📖 **개발 로그 (Notion)** : _(정리 중 — 게시 예정)_
🧑‍💻 **원본 (Java/Spring 팀 프로젝트)** : https://github.com/sumin020415/project_2

---

## 🛠 Tech Stack

| 영역 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Style | Tailwind CSS v4 (`@theme` CSS-first config) |
| Auth | Supabase Auth (HttpOnly 쿠키 세션) |
| Database | Supabase (PostgreSQL + RLS) |
| Storage | Supabase Storage |
| Map | Kakao Map JS SDK |
| Form | React Hook Form + Zod |
| Hosting | Vercel (main 푸시 시 자동 배포) |

---

## ✨ Features

| 영역 | 상태 |
|------|------|
| 🎨 디자인 토큰 시스템 (안밤 토스/카카오 무드) | ✅ |
| 🔐 회원가입 / 로그인 (Supabase Auth) | ✅ |
| 👤 마이페이지 + 헤더 네비게이션 | ✅ |
| ✍️ 회원가입 폼 강화 (도메인 select, 이메일/닉네임 중복확인, 비밀번호 강도/확인) | ✅ |
| 📝 시민 제보 게시글 CRUD | ⏳ |
| 💬 댓글 + 대댓글 (계층 구조) | ⏳ |
| 👍👎 좋아요 / 싫어요 | ⏳ |
| 🗺 Kakao Map + CCTV/보안등/제보 핀 | ⏳ |
| 📷 이미지 업로드 (Supabase Storage) | ⏳ |

---

## 🎯 왜 다시 만들었나

- 원본은 **로컬 Docker + Oracle** 의존 → 데모 공유 불가능
- 무료로 24시간 동작하는 라이브 데모 환경 확보
- JWT/Spring Security 자체 구현 → Supabase Auth + RLS 로 대체 (보안 코드 80% 감소)
- Oracle → PostgreSQL 마이그레이션 경험
- 풀스택을 단일 언어(TypeScript)로 다루는 일관성

---

## 🚀 Run Locally

### 사전 준비
- Node.js 20+ / Git
- Supabase 프로젝트 + Kakao Developers 앱 (JavaScript 키)

### 환경변수 (`.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxx
NEXT_PUBLIC_KAKAO_MAP_KEY=발급받은_JS_키
```

### 실행
```bash
git clone https://github.com/sumin020415/anbam.git
cd anbam
npm install          # vulnerability 경고는 무시 (audit fix --force 금지 — Next 메이저 다운그레이드)
npm run dev          # → http://localhost:3000
```

### 검증 / 빌드
```bash
npm run lint         # ESLint
npm run build        # 프로덕션 빌드 (타입체크 + 라우트 매핑 확인)
npm run start        # 프로덕션 서버 (build 후)
```

### DB 셋업
Supabase SQL Editor 에서 다음을 생성:
- 테이블 6개: `profiles / posts / comments / reactions / cctvs / lamps`
- RLS 정책 (조회 공개, 쓰기는 본인만)
- `auth.users` → `profiles` 자동 생성 트리거

> 통합 SQL 파일은 `docs/schema.sql` 로 정리 예정 (Phase 9).

---

## 📂 Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # 회원가입/로그인 (라우트 그룹)
│   ├── (main)/           # 메인 — 헤더 공유 (홈/마이페이지/지도/게시판)
│   └── api/              # Route Handlers
│       └── auth/check-email/   # 이메일 중복확인 (service_role)
├── components/
│   ├── auth/             # LogoutButton 등
│   └── layout/           # Header
├── hooks/                # useUser (onAuthStateChange 구독)
├── lib/
│   ├── supabase/         # 브라우저/서버 클라이언트 + admin (서버 전용)
│   ├── schemas/          # zod 검증 스키마 (비밀번호 강도 등)
│   └── services/         # Supabase 쿼리/뮤테이션 (RN 이식 대비)
└── middleware.ts         # 세션 자동 갱신
```

### 데이터 레이어 분리 원칙
컴포넌트/페이지는 **`supabase.from(...)` 을 직접 호출하지 않고** `lib/services/*.ts` 의 함수만 사용. 향후 React Native 클라이언트 추가 시 `services / schemas` 폴더가 그대로 이동 가능하도록 설계.

---

## 🎨 디자인 토큰

원본 nightsafe(React+Vite) 의 토스/카카오 무드 토큰을 Tailwind v4 `@theme` 으로 이식:
- 컬러: `ink-1/2` (텍스트), `line-1/2` (보더/배경), `point` (노랑), `ok` / `warn`
- 폰트: Noto Sans KR (`next/font` 로 셀프 호스팅)
- 모서리: `rounded-anbam` (12px)
- 그림자: `shadow-nav`, `shadow-card`
- 레이아웃: `h-nav` (60px)

---

## 🗺 Spring → Next.js 매핑

| Spring | Next.js |
|--------|---------|
| `@RestController` | `app/api/[resource]/route.ts` |
| `@Service` | `lib/services/*.ts` |
| `JpaRepository` | `supabase.from('...').select(...)` |
| `SecurityConfig` + `JwtUtil` | Supabase Auth + RLS + middleware |
| Oracle | Supabase PostgreSQL |

---

## 📜 License

MIT (코드 한정). 스크린샷·콘텐츠는 개인 저작물.

---

## 📬 Contact

idkhs05@gmail.com · [GitHub](https://github.com/sumin020415) · [Portfolio](https://github.com/sumin020415/portfolio)
