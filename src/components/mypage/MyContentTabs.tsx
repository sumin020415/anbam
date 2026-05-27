'use client';

import { useState } from 'react';
import Link from 'next/link';
import PostCard from '@/components/post/PostCard';
import type { PostRow } from '@/lib/services/posts';
import type { MyCommentRow } from '@/lib/services/comments';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
}

type Tab = 'posts' | 'comments' | 'likes';

export default function MyContentTabs({
  posts,
  comments,
  likedPosts,
}: {
  posts: PostRow[];
  comments: MyCommentRow[];
  likedPosts: PostRow[];
}) {
  const [tab, setTab] = useState<Tab>('posts');

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'posts', label: '내 제보', count: posts.length },
    { key: 'comments', label: '내 댓글', count: comments.length },
    { key: 'likes', label: '좋아요', count: likedPosts.length },
  ];

  return (
    <div>
      <nav aria-label="마이페이지 콘텐츠" className="border-b border-line-1">
        <ul className="flex items-center gap-1">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <li key={t.key}>
                <button
                  type="button"
                  onClick={() => setTab(t.key)}
                  aria-current={active ? 'true' : undefined}
                  className={`relative px-4 py-3 text-sm font-bold transition ${
                    active ? 'text-ink-1' : 'text-ink-2 hover:text-ink-1'
                  }`}
                >
                  {t.label} <span className="text-ink-2">{t.count}</span>
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-3 -bottom-px h-0.5 bg-ink-1"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-4">
        {tab === 'posts' &&
          (posts.length === 0 ? (
            <p className="rounded-anbam border border-line-1 bg-white p-6 text-center text-sm text-ink-2">
              아직 작성한 제보가 없습니다.{' '}
              <Link href="/posts/new" className="font-bold text-ink-1 underline">
                제보 작성하기
              </Link>
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          ))}

        {tab === 'likes' &&
          (likedPosts.length === 0 ? (
            <p className="rounded-anbam border border-line-1 bg-white p-6 text-center text-sm text-ink-2">
              아직 좋아요한 글이 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {likedPosts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          ))}

        {tab === 'comments' &&
          (comments.length === 0 ? (
            <p className="rounded-anbam border border-line-1 bg-white p-6 text-center text-sm text-ink-2">
              아직 작성한 댓글이 없습니다.
            </p>
          ) : (
            <ul className="space-y-2">
              {comments.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/posts/${c.post_id}`}
                    className="block rounded-anbam border border-line-1 bg-white p-4 shadow-card transition hover:border-point"
                  >
                    <p className="line-clamp-2 text-sm text-ink-1">{c.content}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-ink-2">
                      {c.posts?.title ?? '(삭제된 글)'} · {formatDate(c.created_at)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
      </div>
    </div>
  );
}
