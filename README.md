# 안밤 (ANBAM) - 부산 안전 정보 시민 커뮤니티

> Java/Spring Boot 로 만든 팀 (2주, 4인) 프로젝트를 풀스택 TypeScript + Supabase 로 1인 재구현한 사이드 프로젝트.

🔗 **Live Demo** : https://anbam.vercel.app
📖 **개발 로그 (Notion)** : https://fate-waiter-a74.notion.site/2b45ea02823a811f8e7acaddce6caa91?p=36c5ea02823a80389af8c734ef89e611&pm=c

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
| Charts | Chart.js + react-chartjs-2 (분석 페이지) |
| Animation | Framer Motion (Tab 펼침/접힘) |
| Form | React Hook Form + Zod |
| Hosting | Vercel (main 푸시 시 자동 배포) |

---

## ✨ Features

| 영역 | 상태 |
|------|------|
| 🎨 디자인 토큰 시스템 (안밤 토스/카카오 무드) | ✅ |
| 🔐 회원가입 / 로그인 (Supabase Auth) | ✅ |
| 👤 마이페이지 (네이버식 사이드바 허브 - 데스크탑 좌측 세로 / 모바일 상단 가로 메뉴) - 프로필 닉네임 수정 (가입과 동일 중복확인) + 내 활동 탭 (내 제보 / 내 댓글 / 좋아요한 글 이력) | ✅ |
| ✍️ 회원가입 폼 강화 (도메인 select, 이메일/닉네임 중복확인, 비밀번호 강도/확인) | ✅ |
| 👁 비밀번호 보이기/가리기 토글 (회원가입·로그인·재설정) | ✅ |
| 🔄 비밀번호 재설정 (이메일 링크 + PKCE 콜백) | ✅ |
| 🇰🇷 로그인 실패 메시지 한국어 매핑 | ✅ |
| 📝 시민 제보 게시글 CRUD (목록/상세/작성/수정/삭제) | ✅ |
| 🎴 velog 스타일 카드 (16:9 thumbnail + placeholder 3단 [이미지→지도→로고] + 메타 4종 조회/👍/👎/💬 + hover lift + grid 1/2/3) | ✅ |
| 🗂 5종 정렬 탭 (최신/좋아요/싫어요/조회/댓글, `useTransition` pending opacity + `?sort=X` URL query) | ✅ |
| 🔎 게시글 검색 (제목·본문 ilike, `?q=X` query, 검색어 ✕ 지우기 + 브라우저 기본 ✕ 제거, `escapeIlikeTerm` 와일드카드 이스케이프) | ✅ |
| 📍 상세 위치 지도 (`PostLocation` - 본문 아래 주소 + h-56 KakaoMap, 작성/수정/상세 너비·뒤로가기 통일) | ✅ |
| 📃 게시글 페이지네이션 ("더 보기" 방식, `<key={sort\|q}>` SSR initial reset) | ✅ |
| 💬 댓글 + 대댓글 (계층 트리, depth 0~2 들여쓰기, 카드 메타에 댓글 수 `💬 N` 표시) | ✅ |
| 👍👎 좋아요 / 싫어요 (복합 PK upsert, 토글/전환) | ✅ |
| 🗺 Kakao Map + CCTV/보안등/제보 핀 (종류별 색 + InfoWindow) | ✅ |
| 🗂 3 단 줌 클러스터링 (줌 ≥ 6 = 자치구 16개 / 3~5 = 동 ~150~200개 / < 3 = 개별 핀) | ✅ |
| ⚡ 메인 지도 RPC 성능 최적화 - `get_district_pin_counts` / `get_dong_pin_counts` PostgreSQL 함수로 GROUP BY COUNT 만 fetch (응답 **6 MB → 95 KB, 63× 감소**) + 줌 <3 진입 시 개별 핀 **viewport bbox fetch** (현재 화면 영역 핀만 - 8만 row 동시 렌더 모바일 OOM 방지) + 동 클러스터 fallback + 우상단 "개별 핀 불러오는 중…" indicator. Lighthouse 성능 **95** / **LCP 1.1s** | ✅ |
| 🧭 자치구·동 보정 스크립트 (Kakao Local REST API reverse geocoding, `npm run seed:all` chain 으로 자동 - 누적 **41,551 호출 / 3 회 100% 정확도**) | ✅ |
| 🔍 헤더 위치 검색 (Kakao Places + Geocoder 병렬, 명칭·도로명·지번 모두) | ✅ |
| 🎚 핀 필터 토글 (전체/CCTV/보안등/제보, URL query `?filter=X` 기반) | ✅ |
| 📌 검색·클릭 위치 파란 마커 + 주소 카드 + "여기에 제보 작성" Link (자동 좌표 채움) | ✅ |
| 📍 게시글 위치 picker (지도 클릭 → 좌표/주소 자동 채움) | ✅ |
| 📷 이미지 업로드 (Supabase Storage, 글당 1장, 5MB 제한) | ✅ |
| 🎥 부산 CCTV/보안등 시드 스크립트 (data.go.kr 공공데이터, streaming INSERT + 5xx retry + page skip + skip 페이지 JSON 로그) | ✅ |
| ⋯ 케밥 메뉴 (게시글 헤더 우측, 수정/삭제 통합, 외부 클릭 감지) | ✅ |
| ✏️ Floating 작성 버튼 (게시판 우하단 + 비로그인 시 로그인 페이지) | ✅ |
| ⬆ 스크롤 탑 버튼 (스크롤 200px+ 시 우하단 floating, smooth scroll) | ✅ |
| 📊 분석 페이지 (`/analysis`) - 부산 SVG 자치구 클릭 + 사이드 패널 (인구 대비 안전 점수) + 3 Tab Chart.js (제보 수 / CCTV·보안등 누적 / KST 시계열) + framer-motion 펼침 | ✅ |
| 📱 반응형 모바일 UX - nav 햄버거 우측 슬라이드 드로어 + 지도 검색·필터 모바일 서브바 (필터 full-width + 검색 아이콘 탭 펼침) + 제보 카드 모바일 가로형 리스트 (좌측 썸네일 + 우측 텍스트) + 데스크탑 헤더 분기 `xl`(1280) 상향 (태블릿·iPad 세로는 모바일 레이아웃) | ✅ |
| 🦶 하단 푸터 (콘텐츠 페이지 - 데이터 출처 [행정안전부/data.go.kr + © Kakao] + © 2026 ANBAM + 포트폴리오 링크, 풀-뷰포트 지도 메인은 제외) | ✅ |

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
NEXT_PUBLIC_KAKAO_MAP_KEY=발급받은_JS_키       # Kakao Map SDK (JavaScript 키)

# 시드 / 보정 스크립트 전용 (선택, 공공데이터 시드 시에만 필요)
KOREA_DATA_API_KEY=발급받은_data.go.kr_Decoding_키   # 서버 전용, NEXT_PUBLIC_ 금지
KAKAO_REST_API_KEY=발급받은_Kakao_REST_API_키        # 서버 전용, JavaScript 키와 다른 별개 키
```

> Vercel 대시보드에는 위 4 줄 (NEXT_PUBLIC_* / SUPABASE_SERVICE_ROLE_KEY) 만 입력. `KOREA_DATA_API_KEY` / `KAKAO_REST_API_KEY` 는 로컬 시드/보정 1회 실행용이라 Vercel 등록 불필요.

### 실행
```bash
git clone https://github.com/sumin020415/anbam.git
cd anbam
npm install          # vulnerability 경고는 무시 (audit fix --force 금지 - Next 메이저 다운그레이드)
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
2. **SQL Editor 에서 `docs/schema.sql` 전체 실행** - 다음이 한 번에 생성됩니다:
   - 테이블 6개: `profiles / posts / comments / reactions / cctvs / lamps`
   - RLS 정책 (조회 공개, 쓰기는 본인만)
   - `auth.users` → `profiles` 자동 생성 트리거 (`handle_new_user`)
   - Storage 정책 (`post-images` 버킷 - `{user.id}/{uuid}.{ext}` path 패턴)

> 모든 `create` 문은 `if not exists`, 정책은 `drop policy if exists ...; create policy ...` 패턴이라 재실행 안전합니다.

### Phase 7 / 7.5 - 부산 CCTV·보안등 시드 + 자치구·동 보정 (선택, 공공데이터)

`cctvs / lamps` 테이블을 채우려면 외부 API 두 곳 키 발급 후:

```bash
# 1) data.go.kr 활용신청 (자동승인, 5분)
#    - 행정안전부_CCTV정보 조회서비스
#    - 전국보안등정보표준데이터

# 2) Kakao Developers > 내 애플리케이션 > 앱 키 > REST API 키 복사
#    (JavaScript 키와 다른 별개 키. 자치구·동 보정 reverse geocoding 용)

# 3) .env.local 에 두 키 추가 (⚠️ NEXT_PUBLIC_ 금지)
echo "KOREA_DATA_API_KEY=발급받은_Decoding_키" >> .env.local
echo "KAKAO_REST_API_KEY=발급받은_REST_API_키" >> .env.local

# 4) 시드 + 보정 한 명령 chain (~2.5~3.5시간, PC 켜둠)
npm run seed:all
# = npm run seed -- --target=all          # CCTV + LAMP raw 시드 (~1.5~2시간)
#   && npm run fix-cctv-district          # CCTV district 자치구 보정 (~80초)
#   && npm run fix-lamp-district          # LAMP district + dong 보정 (~58분)
```

또는 단계별 단독 실행 가능 (한 단계 실패 시 그 단계만 재실행):
```bash
npm run seed -- --target=cctv --dry-run --max-pages=3   # 검증
npm run seed -- --target=cctv                            # CCTV 만
npm run seed -- --target=lamp                            # LAMP 만
npm run fix-cctv-district -- --dry-run                   # CCTV 보정 dry-run
npm run fix-cctv-district                                # CCTV 보정 실제
npm run fix-lamp-district -- --dry-run                   # LAMP 보정 dry-run
npm run fix-lamp-district                                # LAMP 보정 실제
```

#### 책임 분리 (Single Responsibility)
- `scripts/seed-pins.ts` = data.go.kr raw fetch + DB INSERT (streaming + skip)
- `scripts/fix-cctv-district.ts` / `fix-lamp-district.ts` = DB 의 깨진 row 를 Kakao Local REST API (`coord2regioncode`) 로 reverse geocoding 보정
- `npm run seed:all` = 둘을 `&&` chain (시드 도중 fail 시 보정 단계 안 돌아감)

#### 시드 스크립트 특징
- streaming INSERT (chunk 500) - 중간 실패 시 부분 보존
- HTTP 5xx 자동 retry (5회) + 페이지 실패 skip (연속 10회 한도)
- 부산 row 만 클라이언트 측 필터 (주소 prefix 매칭)
- skip 페이지 / 미시드 범위 → `seed-skipped-{target}-{ts}.json` 자동 기록 (로컬, `.gitignore`)

#### 보정 스크립트 특징 (자치구·동 정정)
- 시드 매핑 `parts[1]/parts[2]` split 가정이 도로명 주소·자치구 토큰 누락 형식에 취약 → Kakao Local API 로 좌표 → 행정구역 매핑
- rate-limit 100ms (Kakao 무료 한도 일 100,000 충분) + retry 3 (5xx exponential backoff) + dry-run + `fix-*-district-{ts}.json` 결과 로그

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
│   │   ├── analysis/page.tsx         # 분석 페이지 (서버 컴포넌트, Promise.all 4 services + revalidate 5분)
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
│   ├── analysis/                     # BusanSvg (수동 변환, 16 path id 보존, controlled props) / BusanMap (getBBox 라벨 + 위험·안전 범례 + mx-auto lg:mx-0) / DistrictBarChart (Tab 1 제보 수) / InfraStackedBar (Tab 2 CCTV+LAMP 누적) / PerCapitaPanel (사이드 - 인구·밀도·1대당·안전 점수) / TrendLineChart (Tab 3 일별/시간대 Line) / AnalysisTabs (orchestration - lg:items-center + 3 Tab + AnimatePresence)
│   ├── post/                         # PostCard (velog 16:9 thumbnail + placeholder 3단 [이미지→지도→로고] + 메타 4종 조회/👍/👎/💬 + h-full + hover lift) / PostList (grid 1/2/3 cols + key reset) / PostTabs (5종 정렬 segmented + useTransition pending) / SearchBox (제목·본문 ilike + ?q query + 브라우저 기본 ✕ 제거) / PostForm (위치 picker + 이미지 업로드 + `?lat&lng` query 마운트 자동 reverseGeocode) / PostLocation (상세 본문 아래 위치 지도 h-56) / MoreMenu (헤더 우측 ⋯ 수정·삭제 통합) / FloatingWriteButton (게시판 우하단 노란 연필) / ViewCountTrigger / ReactionButtons
│   ├── comment/                      # CommentTree / CommentItem / CommentForm
│   ├── map/                          # KakaoMap (래퍼, onMapCreate + onIdle + getBounds) / MapHome (메인 홈 + 3단 줌 분기 자치구·동·개별 + 검색·클릭 통합 파란 마커 + 주소 카드 + 여기에 제보 작성 Link + **Phase 11 개별 핀 viewport bbox fetch (onIdle + getBounds, debounce 300ms, 줌아웃 시 핀 비워 메모리 회수) + 동 클러스터 fallback + 우상단 fixed indicator**) / MapPin (개별 핀, 종류별 색) / ClusterPin (자치구·동 클러스터, count, sizeOf 36~48px, CustomOverlayMap zIndex) / clusterByDistrict (BUSAN_DISTRICTS 16 화이트리스트 + BUSAN_DISTRICT_CENTER 시내 5 자치구 분산 좌표 + clusterByDistrict + clusterByDong + normalizeDong 5 단계 정규화: 비정상값 skip → 도로명 skip → 도로명+번지 skip → 첫 (동|읍|면) lazy 추출 → 행정→법정 + **Phase 11 RPC 헬퍼 `clusterDistrictCounts` / `clusterDongCounts` ⭐**)
│   ├── mypage/                       # MyPageView (사이드바 허브 - 데스크탑 좌측 세로 / 모바일 상단 가로 메뉴) / ProfileEditForm (닉네임 수정 + 가입식 중복확인) / MyContentTabs (내 제보·내 댓글·좋아요 탭)
│   ├── auth/LogoutButton.tsx
│   └── layout/                       # Header (xl+ 데스크탑 3-컬럼 / xl 미만 햄버거) / MobileNav (모바일 nav 우측 슬라이드 드로어) / MobileMapBar (모바일 지도 페이지 검색·필터 서브바) / HeaderSearchBox (Places + Geocoder 병렬, debounce 500ms) / PinFilterToggle (4 segmented, ?filter URL query, fullWidth prop) / ScrollToTopButton (모든 메인 페이지, 200px+ floating ↑) / Footer (콘텐츠 페이지 하단, 데이터 출처 + © + 포트폴리오 링크, 지도 메인 제외)
├── hooks/                            # useUser (onAuthStateChange 구독)
├── lib/
│   ├── supabase/                     # 브라우저/서버 클라이언트 + admin (서버 전용)
│   ├── schemas/                      # zod (auth/post/comment/profile)
│   ├── utils/                        # server-safe utility (server/client 양쪽 import 가능) - pinFilter (타입/가드/OPTIONS)
│   └── services/                     # Supabase 쿼리/뮤테이션 (auth/profiles[getProfile / updateProfile / isNicknameTaken]/posts[getPosts 통합 - 5종 sort latest·likes·dislikes·views·comments + 검색 ilike + escapeIlikeTerm + comments(count) join + reactions 별도 fetch + DB 정렬 가능/불가능 분기 + getPostsByAuthor / getLikedPosts (마이페이지 내 활동)]/comments[getComments + getCommentsByAuthor]/reactions/pins[**Phase 11 `getDistrictPinCounts` / `getDongPinCounts` RPC ⭐ (6MB → 95KB, 63× 감소)** + `DistrictPinCount` / `DongPinCount` 타입 + `getCctvPinsInBounds` / `getLampPinsInBounds` (개별 핀 모드 viewport bbox fetch - gte/lte lat·lng + BOUNDS_FETCH_CAP=2000) + `LatLngBounds` 타입]/storage/analytics[자치구 카운트 N 병렬 + KST 시계열])
├── data/                             # 정적 데이터 - busanStatic.ts (헬퍼) + gu_name + population + population_density JSON (분석 페이지)
└── proxy.ts                          # 세션 자동 갱신 (Next.js 16, `export async function proxy(req)` + matcher config)

scripts/
├── seed-pins.ts                      # 부산 CCTV/보안등 시드 (data.go.kr, streaming INSERT + 5xx retry + page skip + skip JSON 로그)
├── fix-cctv-district.ts              # CCTV 자치구·동 보정 (Kakao Local REST API coord2regioncode, dry-run + JSON 로그)
└── fix-lamp-district.ts              # LAMP 자치구·동 보정 (도로명 단편 row 만 좁혀서 reverse geocoding)

docs/
└── schema.sql                        # Supabase 통합 SQL - 6테이블 + RLS + 트리거 + Storage 정책 + Data API GRANT + **§10 RPC (`get_district_pin_counts` / `get_dong_pin_counts`, Phase 11) + §11 RPC (`increment_post_view` - 조회수 +1, RLS 우회 security definer, 비로그인 포함 카운팅) ⭐** (재실행 안전, create or replace)

public/
└── Busan.svg                         # 부산 16 자치구 SVG (원본 nightsafe 자산, BusanSvg.tsx 의 path 데이터 원본)
```

### 데이터 소스 (Phase 7.5 - 2026-05-17 기준, 새 시드 + 보정 완료 ⭐)

| 종류 | 출처 | 수정/기준일 | 부산 row (`npm run seed:all` 결과) |
|------|------|------------|---------|
| CCTV | 행정안전부_CCTV정보 조회서비스 (data.go.kr, OpenAPI) | 일간 갱신 | **15,277** (4차 시드 + fix-cctv-district 1,885 row 100% 보정) |
| 보안등 | 전국보안등정보표준데이터 (data.go.kr, OpenAPI) | 2025-12-01 | **68,168** (풀 시드 + fix-lamp-district 35,006 row 100% 보정) |

> **자치구·동 보정 (Phase 7.5)** - 시드 매핑이 `parts[1]/parts[2]` 가정으로 깨지는 두 패턴이 발견되어 별도 보정 스크립트 (Kakao Local REST API `coord2regioncode`) 작성:
> 1) CCTV 의 강서구·남구 row 의 district 자리에 동/도로명 단편 - 자치단체별로 "부산광역시 명지동..." 같이 자치구 토큰 누락 표기 존재. **이번 시드에서 1,885 row 발견 + 100% 복구**
> 2) LAMP 의 ~51% row 의 dong 자리에 도로명 단편 "용소로52-2" 등 - `rdnmadr` (도로명) 만 있고 `lnmadr` (지번) 빈 row 가 자치단체별로 극단 (남구·영도구·연제구·부산진구·수영구 ~100% 도로명 / 강서구·기장군·동래구·북구·사상구 0%). **이번 시드에서 35,006 row 발견 + 100% 복구**
>
> → `scripts/fix-cctv-district.ts` / `scripts/fix-lamp-district.ts` 가 Kakao Local REST API 로 좌표 → 행정구역 reverse geocoding. **`npm run seed:all` 한 명령에 자동 chain** 으로 미래 재시드도 영구 깨끗.
>
> **CCTV 자치구별 분포 (16 개 모두 표시 ⭐)** - 수영구 1,851 / 기장군 1,529 / 금정구 1,300 / 사하구 1,037 / 부산진구 1,014 / 강서구 1,014 / 동래구 989 / 연제구 939 / 영도구 915 / 북구 885 / 사상구 876 / 남구 861 / 해운대구 752 / 서구 569 / 중구 421 / 동구 325. **4차 시드 결과 - 어제 3차 (6,781) 의 225%**, 1차 (3,017) 의 506%. data.go.kr 게이트웨이 일시 timeout 으로 page 3,370/3,544 (95.1%) 진행 후 종료 - skip 페이지 44 개 + 미시드 범위 174 페이지 (`seed-skipped-cctv-*.json` 자동 기록). 향후 부분 재시드 CLI (`--pages=N`, `--append`, `--retry-from=*.json`) 추가 후 ~800 row 추가 가능 (목표 ~16,000).
>
> **LAMP 자치구별 분포 (16 개 모두 표시 ⭐⭐)** - 부산진구 8,623 / 기장군 5,948 / 사하구 5,683 / 강서구 5,613 / 금정구 4,907 / 동래구 4,645 / 남구 4,445 / 영도구 4,247 / 사상구 4,188 / 서구 3,843 / 해운대구 3,785 / 북구 3,740 / 연제구 3,312 / 수영구 3,179 / 중구 2,005 / **동구 5** (Kakao API 가 좌표 기반으로 동구 행정구역 row 5 개 발견 - 어제 "원본 데이터 한계로 동구 0" 가정도 미세 부정). 전국 ~183만 row 중 부산만 필터한 풀 시드 결과 page 1,829/1,829 전체 완주.

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

| 항목 | 내용 | 상태 |
|------|------|------|
| 🗂 지도 클러스터링 | 자치구 단위 (~16 개) 클러스터링 - 14k 핀 DOM 부담 해소 | ✅ |
| 🗺 3 단 줌 클러스터 모드 | 자치구 (줌 6+, 16 표시 - BUSAN_DISTRICT_CENTER 시내 5 자치구 좌표 분산) / 동 (3~5, `clusterByDong + normalizeDong` 5 단계 정규화: 비정상값·도로명·도로명+번지 skip + 첫 (동\|읍\|면) lazy + 행정→법정) / 개별 (<3) | ✅ |
| 🧭 자치구·동 보정 | `fix-cctv-district.ts` + `fix-lamp-district.ts` (Kakao Local REST API reverse geocoding, 누적 **41,551 호출 / 3 회 100%**) + `npm run seed:all` chain | ✅ |
| 🔍 위치 검색 | Kakao Places + Geocoder 병렬 + debounce 500ms 검색창 (헤더 중앙) | ✅ |
| 🎚 핀 필터 토글 | 4 segmented (전체/CCTV/보안등/제보) URL query 기반 | ✅ |
| ✨ UX 보강 | 케밥 메뉴 / 스크롤 탑 / Floating 작성 | ✅ |
| 🔁 CCTV 부분 재시드 CLI | `--pages=N` / `--append` / `--retry-from=*.json` + unique constraint → CCTV ~15,000 row 도달 | ⏳ |
| 📊 분석 페이지 (`/analysis`) | 부산 SVG 자치구 클릭 (16 path id 보존, 수동 변환) + 사이드 패널 (인구·밀도·CCTV/LAMP 1대당·안전 점수) + 3 Tab Chart.js (제보 수 / CCTV+LAMP 누적 / KST 일별·시간대 Line) + framer-motion 펼침/접힘 + Header 분석 메뉴 활성화 + `shrink-0` (긴 본문 페이지 헤더 압축 방지) | ✅ |
| 🎴 velog 스타일 게시판 리뉴얼 | 5종 정렬 (`PostTabs`) + 검색 (`SearchBox`, ilike + ?q) + velog 카드 (16:9 + placeholder 3단 + 메타 4종) + 상세 위치 지도 (`PostLocation`) + 작성/수정/상세 너비·뒤로가기 통일. `getPosts` 통합 services (DB 정렬 가능/불가능 분기). 카드 댓글 수 `💬 N` 포함 | ✅ |
| 🗨 인기 게시글 사이드바 (좋아요 상위 5) | 원본 nightsafe parity 마지막 - **의도적 제외** (velog 스타일 단일 컬럼 채택, "좋아요순" 정렬 탭이 대체 역할) | ⏸️ 제외 |
| ⚡ Phase 11 - 메인 지도 RPC 성능 최적화 | `docs/schema.sql §10` 의 `get_district_pin_counts` / `get_dong_pin_counts` PostgreSQL 함수 + `pins.ts` RPC services + `clusterByDistrict.ts` RPC 헬퍼 + `(main)/page.tsx` 풀 fetch → RPC 전환. **응답 6 MB → 95 KB (63× 감소), 콜드 ~3~5초 / warm ~1~2초** | ✅ |
| 🚀 Phase 11 후속 - Lighthouse 측정 + 모바일 OOM 수정 | Lighthouse 측정 (성능 **95** / **LCP 1.1s** / 접근성·SEO 100 / 권장사항 77) → LCP Good 이라 추가 캐싱 (unstable_cache / Edge / 정적 JSON) 불필요 판정. **모바일 개별 핀 OOM 튕김 수정** - 풀 row fetch → `getCctvPinsInBounds` / `getLampPinsInBounds` viewport bbox fetch (`KakaoMap.onIdle` + `getBounds`, 8만 row 동시 렌더 → 수백) | ✅ |
| 📖 문서화 | Notion 페이지 게시 (개발 로그 통합본) + 포트폴리오 사이트 V2 카드 최신화 + README Notion 링크 활성화 | ✅ |

### 중기 (실사용 가능한 사이트로 확장)

| 항목 | 내용 |
|------|------|
| 🔔 알림 | Web Push (브라우저) - 본인 동선 근처 신규 제보 시 알림 |
| 🤖 데이터 자동 갱신 | Vercel Cron 또는 Supabase Edge Function - 월/주 단위 시드 자동 실행 |
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
| 🔐 Supabase Auth | 토큰 기반 (PKCE 그대로) - 모바일도 같은 사용자 풀 |
| 🗺 네이티브 지도 | `react-native-kakao-maps` 또는 `react-native-maps` (Google) - 웹과 같은 핀/InfoWindow 패턴 유지 |
| 📍 GPS 기반 | 사용자 현재 위치 자동 감지 + 주변 인프라 자동 fetch |
| 🔔 푸시 알림 | Expo Notifications - 내 동선 근처 신규 제보 푸시 |
| 🏗 단일 백엔드 | 웹 + 모바일이 같은 Supabase + RLS - 두플 프로젝트의 "단일 백엔드 + 다중 클라이언트" 패턴 |

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
