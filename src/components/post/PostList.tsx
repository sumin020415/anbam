'use client';

import { useState } from 'react';
import { getPostList, type PostRow } from '@/lib/services/posts';
import { createClient } from '@/lib/supabase/client';
import PostCard from './PostCard';

export const POSTS_PAGE_SIZE = 20;

type Props = {
  initial: PostRow[];
};

export default function PostList({ initial }: Props) {
  const [posts, setPosts] = useState<PostRow[]>(initial);
  const [hasMore, setHasMore] = useState(initial.length === POSTS_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadMore = async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await getPostList(createClient(), {
        limit: POSTS_PAGE_SIZE,
        offset: posts.length,
      });
      setPosts((prev) => [...prev, ...next]);
      if (next.length < POSTS_PAGE_SIZE) setHasMore(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : '불러오는 중 오류가 발생했습니다',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard post={post} />
          </li>
        ))}
      </ul>

      {error && (
        <p className="mt-4 rounded-anbam bg-line-2 px-3 py-2 text-sm text-warn">
          {error}
        </p>
      )}

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loading}
            className="rounded-anbam border border-line-1 bg-white px-6 py-2.5 text-sm font-bold text-ink-1 disabled:opacity-60"
          >
            {loading ? '불러오는 중...' : '더 보기'}
          </button>
        </div>
      )}
    </>
  );
}
