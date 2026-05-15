# 안밤 (ANBAM) — 부산 안전 정보 시민 커뮤니티

> Java/Spring Boot 로 만든 팀 (2주, 4인) 프로젝트를 풀스택 TypeScript + Supabase 로 1인 재구현한 사이드 프로젝트.

🔗 **Live Demo** : https://anbam.vercel.app
📖 **개발 로그 (Notion)** : _(정리 중 — 게시 예정)_

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
| 📷 이미지 업로드 (Supabase Storage, 글당 1장, 5MB 제한) | ✅ |
| 🎥 부산 CCTV/보안등 시드 스크립트 (data.go.kr 공공데이터) | ✅ |

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

통합 스키마 파일 [`docs/schema.sql`](docs/schema.sql) 한 번에 실행:

1. **Storage 버킷 사전 생성** (Dashboard → Storage)
   - Name: `post-images` / Public: ON / File size limit: 5MB / Allowed MIME: `image/*`
2. **SQL Editor 에서 `docs/schema.sql` 전체 실행** — 다음이 한 번에 생성됩니다:
   - 테이블 6개: `profiles / posts / comments / reactions / cctvs / lamps`
   - RLS 정책 (조회 공개, 쓰기는 본인만)
   - `auth.users` → `profiles` 자동 생성 트리거 (`handle_new_user`)
   - Storage 정책 (`post-images` 버킷 — `{user.id}/{uuid}.{ext}` path 패턴)

> 모든 `create` 문은 `if not exists`, 정책은 `drop policy if exists ...; create policy ...` 패턴이라 재실행 안전합니다.

### Phase 7 — 부산 CCTV/보안등 시드 (선택, 공공데이터)

`cctvs / lamps` 테이블을 채우려면 data.go.kr 인증키 발급 후:

```bash
# 1) data.go.kr 활용신청 (자동승인, 5분)
#    - 행정안전부_CCTV정보 조회서비스
#    - 전국보안등정보표준데이터

# 2) .env.local 에 추가 (⚠️ NEXT_PUBLIC_ 금지)
echo "KOREA_DATA_API_KEY=발급받은_Decoding_키" >> .env.local

# 3) 시드 실행 (로컬 1회, 30~60분 소요)
npm run seed -- --target=cctv --dry-run --max-pages=3  # 검증
npm run seed -- --target=cctv                          # 부산 CCTV
npm run seed -- --target=lamp --max-pages=1            # 부산 보안등
```

시드 스크립트 (`scripts/seed-pins.ts`) 특징:
- streaming INSERT (chunk 500) — 중간 실패 시 부분 보존
- HTTP 5xx 자동 retry (5회) + 페이지 실패 skip (연속 10회 한도)
- 부산 row 만 클라이언트 측 필터 (주소 prefix 매칭)

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
│   │   ├── page.tsx                  # 지도 메인 (CCTV/보안등/제보 핀)
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
│   ├── post/                         # PostCard (이미지 thumbnail) / PostList / PostForm (위치 picker + 이미지 업로드) / DeleteButton / ViewCountTrigger / ReactionButtons
│   ├── comment/                      # CommentTree / CommentItem / CommentForm
│   ├── map/                          # KakaoMap (래퍼) / MapHome (메인 홈) / MapPin (종류별 색 + InfoWindow)
│   ├── auth/LogoutButton.tsx
│   └── layout/Header.tsx
├── hooks/                            # useUser (onAuthStateChange 구독)
├── lib/
│   ├── supabase/                     # 브라우저/서버 클라이언트 + admin (서버 전용)
│   ├── schemas/                      # zod (auth/post/comment)
│   └── services/                     # Supabase 쿼리/뮤테이션 (auth/profiles/posts/comments/reactions/pins/storage)
└── proxy.ts                          # 세션 자동 갱신 (Next.js 16, `export async function proxy(req)` + matcher config)

scripts/
└── seed-pins.ts                      # 부산 CCTV/보안등 시드 (data.go.kr, streaming INSERT)
```

### 데이터 소스 (Phase 7 — 2026-05-13 기준)

| 종류 | 출처 | 수정/기준일 | 부산 row |
|------|------|------------|---------|
| CCTV | 행정안전부_CCTV정보 조회서비스 (data.go.kr, OpenAPI) | 일간 갱신 | 3,017 |
| 보안등 | 전국보안등정보표준데이터 (data.go.kr, OpenAPI) | 2025-12-01 | 37 |

> CCTV 는 전국 ~35만 row 중 부산만 필터한 1차 시드. data.go.kr 게이트웨이 일시 timeout 으로 22.7% 진행 후 중단되어 향후 재시드로 보강 예정 (목표 ~14,000건).
> 보안등은 표준데이터 등록 자치단체 데이터만 포함되어 부산 강서구 일부만 표시됩니다. 향후 부산광역시 자체 데이터 포털 등 다른 소스 검토 예정.

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
| `SecurityConfig` + `JwtUtil` | Supabase Auth + RLS + proxy.ts |
| Oracle | Supabase PostgreSQL |

---

## 🚀 Roadmap

현재까지는 **포트폴리오 라이브 데모** 가 목표. 단계별 확장 계획:

### 단기 (Phase 7.5 ~ Phase 10)

| 항목 | 내용 |
|------|------|
| 🔁 CCTV 시드 보강 | 페이지 실패 skip 패턴 적용된 시드 재실행 → 부산 ~14,000 row 확보 |
| 🗂 지도 클러스터링 | 자치구 단위 클러스터링 (줌 ≥ 5 = 클러스터 / < 5 = 개별 핀) — 14k 핀 DOM 부담 해소 |
| 💡 보안등 데이터 보강 | `data.busan.go.kr` 부산광역시 자체 포털 또는 시·구별 OpenAPI 조사 |
| 📖 문서화 | Notion 페이지 게시 (개발 로그 통합본), 포트폴리오 사이트 카드 추가 |
| 📊 분석 페이지 | 원본 nightsafe parity — 부산 SVG 자치구 클릭 + Chart.js 자치구별 제보/인구 대비 보안등 (헤더 "분석" 회색 비활성 해소) |
| 🔍 위치 검색 | Kakao Places `keywordSearch` + 디바운스 검색창 — 지도 위 floating UI |
| ✨ UX 보강 | 케밥 메뉴 (수정/삭제 통합) / 스크롤 탑 / Floating 작성 / 게시글 카드 댓글 수 / 인기 게시글 사이드바 |

### 중기 (실사용 가능한 사이트로 확장)

| 항목 | 내용 |
|------|------|
| 🔔 알림 | Web Push (브라우저) — 본인 동선 근처 신규 제보 시 알림 |
| 🤖 데이터 자동 갱신 | Vercel Cron 또는 Supabase Edge Function — 월/주 단위 시드 자동 실행 |
| 🛡 신고 처리 | 부적절 제보 신고 → 관리자 검토 → soft delete (현재는 본인 삭제만) |
| 🏷 카테고리/필터 | 제보 종류 (사고/시설고장/조명불량 등) + 지도에서 카테고리별 핀 토글 |
| 🔍 검색 | 게시글 전문 검색 (PostgreSQL `tsvector` 또는 Supabase Search) |
| 📈 통계 | 자치구별 안전 인프라 분포 + 시간대별 제보 트렌드 차트 |
| ♿ 접근성 | 스크린리더/키보드 네비게이션 보강, 색약 대응 (현재 빨간/노란/라임 핀 구분 강화) |
| 🌗 다크 모드 | 토스/카카오 무드 다크 토큰 추가 (디자인 토큰 시스템 활용) |

### 장기 (지역 확장)

| 항목 | 내용 |
|------|------|
| 🌏 전국 확대 | 부산 한정 필터 제거 + viewport bbox 동적 fetch (`lat.gte/lte`, `lng.gte/lte`) |
| ⚡ 성능 최적화 | `cctvs(lat, lng)` 공간 인덱스 + 페이지네이션, 클러스터 마커 |
| 🗺 시도별 진입 | URL 파라미터 `?region=busan|seoul|daegu` 또는 메인 페이지에서 시도 선택 |
| 📊 시도별 통계 | 16개 시도별 안전 인프라 비교 대시보드 |

### 모바일 앱으로 확장

| 항목 | 내용 |
|------|------|
| 📱 React Native (Expo) | `lib/services/*.ts` + `lib/schemas/*.ts` 그대로 재사용 (RN 이식 대비 설계됨) |
| 🔐 Supabase Auth | 토큰 기반 (PKCE 그대로) — 모바일도 같은 사용자 풀 |
| 🗺 네이티브 지도 | `react-native-kakao-maps` 또는 `react-native-maps` (Google) — 웹과 같은 핀/InfoWindow 패턴 유지 |
| 📍 GPS 기반 | 사용자 현재 위치 자동 감지 + 주변 인프라 자동 fetch |
| 🔔 푸시 알림 | Expo Notifications — 내 동선 근처 신규 제보 푸시 |
| 🏗 단일 백엔드 | 웹 + 모바일이 같은 Supabase + RLS — 두플 프로젝트의 "단일 백엔드 + 다중 클라이언트" 패턴 |

---

## 🏗 데이터 레이어 분리 원칙 (RN 이식 대비)

컴포넌트/페이지는 **`supabase.from(...)` 을 직접 호출하지 않음.**

```
React Native (미래) ┐
                    ├──> lib/services/*.ts  ──> Supabase
Next.js (현재)     ┘    (RN 그대로 이식)
```

→ `services / schemas` 폴더는 플랫폼 독립적. 웹/모바일 공유 가능.

---

## 📜 License

MIT (코드 한정). 스크린샷·콘텐츠는 개인 저작물.

---

## 📬 Contact

sumin0759@kakao.com
[GitHub](https://github.com/sumin020415) · [Portfolio](https://github.com/sumin020415/portfolio)
