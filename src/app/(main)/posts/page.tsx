import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getPostList, POSTS_PAGE_SIZE } from '@/lib/services/posts';
import PostList from '@/components/post/PostList';
import FloatingWriteButton from '@/components/post/FloatingWriteButton';

export const dynamic = 'force-dynamic';

export default async function PostsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const posts = await getPostList(supabase, { limit: POSTS_PAGE_SIZE });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-1">시민 제보 게시판</h1>
          <p className="mt-1 text-sm text-ink-2">
            부산 안전 정보를 함께 나눠주세요.
          </p>
        </div>
        {user && (
          <Link
            href="/posts/new"
            className="rounded-anbam bg-point px-4 py-2.5 text-sm font-bold text-ink-1 shadow-card"
          >
            글쓰기
          </Link>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="rounded-anbam border border-line-1 bg-white p-12 text-center">
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
        </div>
      ) : (
        <PostList initial={posts} />
      )}

      <FloatingWriteButton />
    </main>
  );
}
