-- ============================================================
-- 안밤 (ANBAM) - Supabase 통합 스키마
-- ============================================================
-- 적용 방법:
--   1) Supabase Dashboard → SQL Editor 에서 새 쿼리 생성
--   2) 이 파일 전체 내용 붙여넣고 Run
--   3) Storage 섹션의 버킷은 Storage UI 에서 먼저 생성 ("post-images", Public)
--
-- 구성:
--   - 테이블 6개: profiles / posts / comments / reactions / cctvs / lamps
--   - RLS 정책 (공개 조회 + 본인만 쓰기)
--   - 인증 트리거: auth.users → profiles 자동 생성
--   - Storage 정책: post-images 버킷 ({user.id}/{uuid}.{ext} 패턴)
--   - Data API GRANT (anon/authenticated/service_role)
--
-- 데이터 흐름:
--   - 회원가입 시 supabase.auth.signUp 에 options.data.nickname 전달
--     → handle_new_user() 트리거가 raw_user_meta_data 에서 추출해 profiles INSERT
--   - cctvs / lamps 는 service_role 로 시드 스크립트가 채움 (scripts/seed-pins.ts)
--
-- Data API 접근 정책 변경 대비 (2026-05-30 신규 / 2026-10-30 전체 enforced):
--   Supabase 의 신규 정책상 public 스키마 테이블이 Data API (supabase-js/PostgREST/GraphQL)
--   에 노출되려면 명시적 GRANT 가 필요. §9 섹션에서 일괄 부여.
-- ============================================================


-- ============================================================
-- 1. profiles
-- ============================================================
-- auth.users 와 1:1. 트리거로 자동 생성.
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique,
  nickname     text unique,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id);


-- ============================================================
-- 2. auth.users → profiles 자동 생성 트리거
-- ============================================================
-- 회원가입 시 raw_user_meta_data.nickname 으로 profiles row 생성.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- 3. posts
-- ============================================================
-- 시민 제보 게시글. 위치(lat/lng/address) 와 이미지는 nullable.
create table if not exists public.posts (
  id          bigint primary key generated always as identity,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  content     text not null,
  image_url   text,
  lat         double precision,
  lng         double precision,
  address     text,
  view_count  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- FK 이름을 명시적으로 지정 (PostgREST 임베드 모호성 회피 - services 의 select 가
-- "profiles!posts_author_id_fkey(nickname)" 패턴 사용).
-- → "create table" 의 references 가 자동으로 "posts_author_id_fkey" 이름을 만듬.
--   만약 다른 이름이면 아래 명령으로 rename:
--   alter table public.posts rename constraint <old_name> to posts_author_id_fkey;

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_author_idx on public.posts (author_id);

alter table public.posts enable row level security;

drop policy if exists "posts_select_all" on public.posts;
create policy "posts_select_all"
  on public.posts for select
  using (true);

drop policy if exists "posts_insert_self" on public.posts;
create policy "posts_insert_self"
  on public.posts for insert
  with check (auth.uid() = author_id);

drop policy if exists "posts_update_self" on public.posts;
create policy "posts_update_self"
  on public.posts for update
  using (auth.uid() = author_id);

drop policy if exists "posts_delete_self" on public.posts;
create policy "posts_delete_self"
  on public.posts for delete
  using (auth.uid() = author_id);


-- ============================================================
-- 4. comments (대댓글 트리)
-- ============================================================
-- parent_id 로 self-reference. depth 는 클라이언트에서 0~2 로 들여쓰기.
create table if not exists public.comments (
  id          bigint primary key generated always as identity,
  post_id     bigint not null references public.posts(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  parent_id   bigint references public.comments(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists comments_post_idx on public.comments (post_id, created_at);
create index if not exists comments_parent_idx on public.comments (parent_id);

alter table public.comments enable row level security;

drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all"
  on public.comments for select
  using (true);

drop policy if exists "comments_insert_self" on public.comments;
create policy "comments_insert_self"
  on public.comments for insert
  with check (auth.uid() = author_id);

drop policy if exists "comments_update_self" on public.comments;
create policy "comments_update_self"
  on public.comments for update
  using (auth.uid() = author_id);

drop policy if exists "comments_delete_self" on public.comments;
create policy "comments_delete_self"
  on public.comments for delete
  using (auth.uid() = author_id);


-- ============================================================
-- 5. reactions (좋아요/싫어요)
-- ============================================================
-- (post_id, user_id) 복합 PK - 사용자당 게시글 1개 반응만.
-- type 전환은 services 에서 upsert(onConflict='post_id,user_id') 로 처리.
create table if not exists public.reactions (
  post_id    bigint not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null check (type in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists reactions_post_idx on public.reactions (post_id);

alter table public.reactions enable row level security;

drop policy if exists "reactions_select_all" on public.reactions;
create policy "reactions_select_all"
  on public.reactions for select
  using (true);

drop policy if exists "reactions_insert_self" on public.reactions;
create policy "reactions_insert_self"
  on public.reactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "reactions_update_self" on public.reactions;
create policy "reactions_update_self"
  on public.reactions for update
  using (auth.uid() = user_id);

drop policy if exists "reactions_delete_self" on public.reactions;
create policy "reactions_delete_self"
  on public.reactions for delete
  using (auth.uid() = user_id);


-- ============================================================
-- 6. cctvs (부산 CCTV 공공데이터)
-- ============================================================
-- 시드: scripts/seed-pins.ts (행정안전부_CCTV정보, data.go.kr)
-- 출처상 자치구/동이 항상 있어야 row 유효 → NOT NULL.
create table if not exists public.cctvs (
  id         bigserial primary key,
  district   text not null,
  dong       text not null,
  lat        double precision not null,
  lng        double precision not null,
  purpose    text,
  created_at timestamptz not null default now()
);

create index if not exists cctvs_geo_idx on public.cctvs (lat, lng);
create index if not exists cctvs_district_idx on public.cctvs (district);

alter table public.cctvs enable row level security;

-- 조회만 공개. 쓰기는 service_role 만 (RLS bypass).
drop policy if exists "cctvs_select_all" on public.cctvs;
create policy "cctvs_select_all"
  on public.cctvs for select
  using (true);


-- ============================================================
-- 7. lamps (부산 보안등 공공데이터)
-- ============================================================
-- 시드: scripts/seed-pins.ts (전국보안등정보표준데이터, data.go.kr)
create table if not exists public.lamps (
  id         bigserial primary key,
  district   text not null,
  dong       text not null,
  lat        double precision not null,
  lng        double precision not null,
  created_at timestamptz not null default now()
);

create index if not exists lamps_geo_idx on public.lamps (lat, lng);
create index if not exists lamps_district_idx on public.lamps (district);

alter table public.lamps enable row level security;

drop policy if exists "lamps_select_all" on public.lamps;
create policy "lamps_select_all"
  on public.lamps for select
  using (true);


-- ============================================================
-- 8. Storage - post-images 버킷 정책
-- ============================================================
-- ⚠️ 버킷은 Dashboard → Storage 에서 미리 생성:
--   - Name: post-images
--   - Public: ON  (썸네일/상세 페이지 public URL 사용)
--   - File size limit: 5MB (services 에서도 한 번 더 검증)
--   - Allowed MIME: image/*
--
-- Path 패턴: {user.id}/{uuid}.{ext}  (services/storage.ts)
-- → (storage.foldername(name))[1] = auth.uid()::text 로 본인 폴더만 쓰기 허용.

drop policy if exists "post_images_insert_self" on storage.objects;
create policy "post_images_insert_self"
  on storage.objects for insert
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "post_images_delete_self" on storage.objects;
create policy "post_images_delete_self"
  on storage.objects for delete
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- public 버킷이라 SELECT 는 사실상 anon 도 OK 지만 RLS 정책도 같이 명시.
drop policy if exists "post_images_select_all" on storage.objects;
create policy "post_images_select_all"
  on storage.objects for select
  using (bucket_id = 'post-images');

-- ============================================================
-- 8b. Storage - avatars 버킷 정책 (프로필 사진)
-- ============================================================
-- ⚠️ 버킷은 Dashboard → Storage 에서 미리 생성:
--   - Name: avatars
--   - Public: ON
--   - File size limit: 2MB
--   - Allowed MIME: image/*
-- Path 패턴: {user.id}/{uuid}.{ext}  (services/storage.ts uploadAvatar)
-- post-images 와 동일하게 본인 폴더만 쓰기, SELECT 는 public.

drop policy if exists "avatars_insert_self" on storage.objects;
create policy "avatars_insert_self"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_self" on storage.objects;
create policy "avatars_delete_self"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_select_all" on storage.objects;
create policy "avatars_select_all"
  on storage.objects for select
  using (bucket_id = 'avatars');


-- ============================================================
-- 9. Default privileges (GRANT) - Data API 접근 권한
-- ============================================================
-- Supabase 2026-05-30 신규 / 2026-10-30 전체 enforced 정책 대비.
-- public 스키마의 테이블이 Data API (supabase-js/PostgREST/GraphQL) 에 노출되려면
-- 명시적 GRANT 가 필요. RLS 가 켜져 있어도 GRANT 가 없으면 PostgREST 가 42501 거절.
--
-- 권한 모델 (안밤 컨벤션):
--   anon          → 비로그인. 모든 테이블 SELECT 만.
--   authenticated → 로그인 사용자. profiles/posts/comments/reactions 는 본인 row 한정
--                   (실제 본인 row 한정 검사는 RLS 가 담당, GRANT 는 명령어 단위).
--   service_role  → 시드 스크립트 / admin API. 모든 테이블 풀 권한 (RLS bypass).
--
-- cctvs / lamps 는 읽기 전용 공공데이터 → anon/authenticated 는 SELECT 만,
-- INSERT/UPDATE/DELETE 는 service_role 에게만.

-- profiles
grant select on public.profiles to anon, authenticated;
grant insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- posts
grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;

-- comments
grant select on public.comments to anon, authenticated;
grant insert, update, delete on public.comments to authenticated;
grant all on public.comments to service_role;

-- reactions
grant select on public.reactions to anon, authenticated;
grant insert, update, delete on public.reactions to authenticated;
grant all on public.reactions to service_role;

-- cctvs (읽기 전용 공공데이터, 쓰기는 service_role 만 - RLS + GRANT 이중 통제)
grant select on public.cctvs to anon, authenticated;
grant all on public.cctvs to service_role;

-- lamps (읽기 전용 공공데이터, 쓰기는 service_role 만)
grant select on public.lamps to anon, authenticated;
grant all on public.lamps to service_role;

-- bigserial 시퀀스 (cctvs / lamps) - service_role 이 nextval 호출 가능하도록.
-- (Supabase 의 service_role 은 기본적으로 권한이 넓지만, 신규 정책 대비 명시.)
grant usage, select on all sequences in schema public to service_role;


-- ============================================================
-- 10. RPC 함수 (PostgREST 노출) - 클러스터 카운트
-- ============================================================
-- 메인 지도 페이지가 cctvs/lamps 풀 row (~84,000) 를 매번 fetch 하면 6MB JSON →
-- 모바일 첫 페인트 10~30초. RPC 로 자치구/동 단위 GROUP BY COUNT 만 반환 → ~2KB.
--
-- 클라이언트 측에서:
--   - 자치구 모드 (줌 6+): get_district_pin_counts → 16 row → BUSAN_DISTRICT_CENTER 좌표 lookup
--   - 동 모드 (줌 3~5): get_dong_pin_counts → ~200 row → normalizeDong 정규화 + 합산
--   - 개별 핀 모드 (줌 <3): getCctvPinsInBounds / getLampPinsInBounds (현재 화면 영역만 fetch)

-- 자치구 단위 핀 카운트 (16 row 반환)
-- target_table 인자로 cctvs / lamps 동적 선택 (format %I 로 SQL injection 안전)
create or replace function public.get_district_pin_counts(target_table text)
returns table(district text, pin_count bigint)
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
begin
  -- 화이트리스트 - cctvs / lamps 만 허용 (그 외 테이블 호출 차단)
  if target_table not in ('cctvs', 'lamps') then
    raise exception 'invalid target_table: %', target_table
      using errcode = '22023';
  end if;

  return query execute format(
    'select district, count(*)::bigint as pin_count
       from %I
      where lat is not null
        and lng is not null
        and district is not null
      group by district',
    target_table
  );
end;
$$;

-- 동 단위 핀 카운트 + 평균 좌표 (~200 row 반환)
-- avg_lat/avg_lng 는 fallback (BUSAN_DISTRICT_CENTER 에 없는 동·도로명 fallback 그룹 대비)
create or replace function public.get_dong_pin_counts(target_table text)
returns table(
  district text,
  dong text,
  pin_count bigint,
  avg_lat double precision,
  avg_lng double precision
)
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
begin
  if target_table not in ('cctvs', 'lamps') then
    raise exception 'invalid target_table: %', target_table
      using errcode = '22023';
  end if;

  return query execute format(
    'select district, dong, count(*)::bigint as pin_count,
            avg(lat)::double precision as avg_lat,
            avg(lng)::double precision as avg_lng
       from %I
      where lat is not null
        and lng is not null
        and district is not null
      group by district, dong',
    target_table
  );
end;
$$;

-- Data API 노출 - anon/authenticated 모두 execute (cctvs/lamps SELECT 권한과 동일)
grant execute on function public.get_district_pin_counts(text) to anon, authenticated;
grant execute on function public.get_dong_pin_counts(text) to anon, authenticated;


-- ============================================================
-- 11. RPC 함수 - 게시글 조회수 증가
-- ============================================================
-- posts UPDATE RLS 는 작성자 본인만 (posts_update_self) + anon 은 update GRANT 없음.
-- 따라서 클라이언트 일반 UPDATE 로 view_count 를 올리면 비로그인/타 사용자는 막힘
-- (작성자가 자기 글 볼 때만 +1 되는 버그). public 조회수는 RLS 우회 RPC 가 정석.
--   - security definer: 함수 소유자 권한으로 실행 → RLS/GRANT 우회
--   - +1 만 수행 (임의 값 set 불가 → 안전). 누구나 호출 가능하지만 조작 불가
-- post_id 는 bigint: posts.id 가 bigint identity (§3). 라이브 anbam 도 동일 (초기부터 bigint 생성).
create or replace function public.increment_post_view(post_id bigint)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.posts set view_count = view_count + 1 where id = post_id;
$$;

-- 비로그인(anon) 포함 모두 조회수 +1 가능
grant execute on function public.increment_post_view(bigint) to anon, authenticated;


-- ============================================================
-- 완료
-- ============================================================
-- 검증 쿼리:
--   select tablename from pg_tables where schemaname = 'public' order by tablename;
--   → cctvs / comments / lamps / posts / profiles / reactions  (6개)
--
--   select polname, tablename from pg_policies where schemaname = 'public' order by tablename, polname;
--   → 각 테이블별 정책 확인
--
--   select tgname from pg_trigger where tgname = 'on_auth_user_created';
--   → 트리거 등록 확인
--
--   select grantee, table_name, privilege_type
--     from information_schema.role_table_grants
--    where table_schema = 'public'
--      and grantee in ('anon', 'authenticated', 'service_role')
--    order by table_name, grantee, privilege_type;
--   → 각 role 의 테이블별 권한 확인 (Data API 노출 정책 대비)
--
--   select proname from pg_proc where pronamespace = 'public'::regnamespace order by proname;
--   → get_district_pin_counts / get_dong_pin_counts / handle_new_user
--
--   select * from public.get_district_pin_counts('cctvs');
--   → 16 row 자치구별 카운트 (시드된 row 수에 따라 다름)
