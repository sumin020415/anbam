import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPost } from '@/lib/services/posts';
import { getComments } from '@/lib/services/comments';
import ViewCountTrigger from '@/components/post/ViewCountTrigger';
import DeleteButton from '@/components/post/DeleteButton';
import CommentTree from '@/components/comment/CommentTree';

export const dynamic = 'force-dynamic';

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const post = await getPost(supabase, id);
  if (!post) notFound();

  const [comments, userResult] = await Promise.all([
    getComments(supabase, id),
    supabase.auth.getUser(),
  ]);
  const user = userResult.data.user;
  const isOwner = !!user && user.id === post.author_id;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <ViewCountTrigger postId={post.id} />

      <Link
        href="/posts"
        className="text-sm text-ink-2 underline"
      >
        ← 목록으로
      </Link>

      <article className="mt-4 rounded-anbam bg-white p-6 shadow-card">
        <h1 className="text-2xl font-bold text-ink-1 break-words">
          {post.title}
        </h1>

        <div className="mt-3 flex items-center justify-between text-xs text-ink-2">
          <span>{post.profiles?.nickname ?? '익명'}</span>
          <span className="flex items-center gap-3">
            <span>조회 {post.view_count}</span>
            <span>{formatDateTime(post.created_at)}</span>
          </span>
        </div>

        <div className="mt-6 whitespace-pre-wrap text-base text-ink-1 leading-relaxed">
          {post.content}
        </div>

        {isOwner && (
          <div className="mt-8 flex justify-end gap-2">
            <Link
              href={`/posts/${post.id}/edit`}
              className="rounded-anbam border border-line-1 bg-white px-4 py-2 text-sm font-bold text-ink-1"
            >
              수정
            </Link>
            <DeleteButton postId={post.id} />
          </div>
        )}
      </article>

      <CommentTree
        postId={post.id}
        comments={comments}
        currentUserId={user?.id ?? null}
      />
    </main>
  );
}
