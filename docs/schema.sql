-- ============================================================
-- 안밤 (ANBAM) — Supabase 통합 스키마
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
--
-- 데이터 흐름:
--   - 회원가입 시 supabase.auth.signUp 에 options.data.nickname 전달
--     → handle_new_user() 트리거가 raw_user_meta_data 에서 추출해 profiles INSERT
--   - cctvs / lamps 는 service_role 로 시드 스크립트가 채움 (scripts/seed-pins.ts)
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
  id          uuid primary key default gen_random_uuid(),
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

-- FK 이름을 명시적으로 지정 (PostgREST 임베드 모호성 회피 — services 의 select 가
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
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  parent_id   uuid references public.comments(id) on delete cascade,
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
-- (post_id, user_id) 복합 PK — 사용자당 게시글 1개 반응만.
-- type 전환은 services 에서 upsert(onConflict='post_id,user_id') 로 처리.
create table if not exists public.reactions (
  post_id    uuid not null references public.posts(id) on delete cascade,
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
-- 8. Storage — post-images 버킷 정책
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
