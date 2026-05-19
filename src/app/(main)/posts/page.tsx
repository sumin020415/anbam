import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  getPosts,
  POSTS_PAGE_SIZE,
  type PostSort,
} from '@/lib/services/posts';
import PostList from '@/components/post/PostList';
import PostTabs from '@/components/post/PostTabs';
import SearchBox from '@/components/post/SearchBox';
import FloatingWriteButton from '@/components/post/FloatingWriteButton';

export const dynamic = 'force-dynamic';

const VALID_SORTS: PostSort[] = [
  'latest',
  'likes',
  'dislikes',
  'views',
  'comments',
];

function parseSort(value: string | string[] | undefined): PostSort {
  if (typeof value !== 'string') return 'latest';
  return (VALID_SORTS as string[]).includes(value)
    ? (value as PostSort)
    : 'latest';
}

function parseQuery(value: string | string[] | undefined): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const sp = await searchParams;
  const sort = parseSort(sp.sort);
  const q = parseQuery(sp.q);

  const [
    {
      data: { user },
    },
    posts,
  ] = await Promise.all([
    supabase.auth.getUser(),
    getPosts(supabase, { sort, q, limit: POSTS_PAGE_SIZE }),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-1">시민 제보 게시판</h1>
        <p className="mt-1 text-sm text-ink-2">
          부산 안전 정보를 함께 나눠주세요.
        </p>
      </div>

      <SearchBox initialQuery={q} />

      <PostTabs current={sort} />

      {posts.length === 0 ? (
        <div className="rounded-anbam border border-line-1 bg-white p-12 text-center">
          {q ? (
            <p className="text-sm text-ink-2">
              <span className="font-bold text-ink-1">&quot;{q}&quot;</span>{' '}
              검색 결과가 없습니다.
            </p>
          ) : (
            <>
              <p className="text-sm text-ink-2">아직 제보가 없습니다.</p>
              {user ? (
                <Link
                  href="/posts/new"
                  className="mt-4 inline-block text-sm font-bold text-ink-1 underline"
                >
                  첫 제보 작성하기
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="mt-4 inline-block text-sm font-bold text-ink-1 underline"
                >
                  로그인하고 제보하기
                </Link>
              )}
            </>
          )}
        </div>
      ) : (
        <PostList
          key={`${sort}|${q}`}
          initial={posts}
          sort={sort}
          query={q}
        />
      )}

      <FloatingWriteButton />
    </main>
  );
}
