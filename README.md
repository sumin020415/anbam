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
| Auth | Supabase Auth (HttpOnly 쿠키 세션, PKCE 흐름) |
| Database | Supabase (PostgreSQL + RLS) |
| Storage | Supabase Storage |
| Map | Kakao Map JS SDK + react-kakao-maps-sdk |
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
| 👁 비밀번호 보이기/가리기 토글 (회원가입·로그인·재설정) | ✅ |
| 🔄 비밀번호 재설정 (이메일 링크 + PKCE 콜백) | ✅ |
| 🇰🇷 로그인 실패 메시지 한국어 매핑 | ✅ |
| 📝 시민 제보 게시글 CRUD (목록/상세/작성/수정/삭제) | ✅ |
| 📃 게시글 페이지네이션 ("더 보기" 방식) | ✅ |
| 💬 댓글 + 대댓글 (계층 트리, depth 0~2 들여쓰기) | ✅ |
| 👍👎 좋아요 / 싫어요 (복합 PK upsert, 토글/전환) | ✅ |
| 🗺 Kakao Map + CCTV/보안등/제보 핀 (종류별 색 + InfoWindow) | ✅ |
| 📍 게시글 위치 picker (지도 클릭 → 좌표/주소 자동 채움) | ✅ |
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

### Supabase URL Configuration (인증 메일 링크용)

비밀번호 재설정 등 이메일 링크 흐름이 정상 동작하려면 대시보드에서 Site URL 과 Redirect URLs 를 등록해야 합니다.

**Authentication → URL Configuration**
- **Site URL**: `https://anbam.vercel.app` (또는 자신의 배포 도메인)
- **Redirect URLs** (와일드카드 권장):
  ```
  https://anbam.vercel.app/**
  http://localhost:3000/**
  ```

> Redirect URLs 화이트리스트에 매칭 안 되면 Supabase 가 보안상 `redirectTo` 를 무시하고 Site URL 로 fallback 합니다. 메일 링크가 엉뚱한 도메인/경로로 떨어진다면 99% 이 설정 누락.

---

## 📂 Project Structure

```
src/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # 회원가입/로그인/비밀번호 찾기·재설정 (라우트 그룹)
│   ├── (main)/                       # 헤더 공유 (라우트 그룹)
│   │   ├── posts/                    # 게시판
│   │   │   ├── page.tsx              # 목록 + 페이지네이션
│   │   │   ├── new/page.tsx          # 작성
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # 상세 + 댓글
│   │   │       └── edit/page.tsx     # 수정
│   │   └── mypage/page.tsx
│   ├── auth/callback/                # PKCE 코드 교환 (resetPasswordForEmail 등)
│   └── api/auth/check-email/         # 이메일 중복확인 (service_role)
├── components/
│   ├── post/                         # PostCard / PostList / PostForm (위치 picker 포함) / DeleteButton / ViewCountTrigger / ReactionButtons
│   ├── comment/                      # CommentTree / CommentItem / CommentForm
│   ├── map/                          # KakaoMap (래퍼) / MapHome (메인 홈) / MapPin (종류별 색 + InfoWindow)
│   ├── auth/LogoutButton.tsx
│   └── layout/Header.tsx
├── hooks/                            # useUser (onAuthStateChange 구독)
├── lib/
│   ├── supabase/                     # 브라우저/서버 클라이언트 + admin (서버 전용)
│   ├── schemas/                      # zod (auth/post/comment)
│   └── services/                     # Supabase 쿼리/뮤테이션 (auth/profiles/posts/comments/reactions/pins)
└── middleware.ts                     # 세션 자동 갱신 (Phase 8 에서 proxy.ts 로 rename 예정)
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

sumin0759@kakao.com
[GitHub](https://github.com/sumin020415) · [Portfolio](https://github.com/sumin020415/portfolio)
