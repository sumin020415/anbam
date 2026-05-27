import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPost } from '@/lib/services/posts';
import { getComments } from '@/lib/services/comments';
import {
  getReactionCounts,
  getMyReaction,
} from '@/lib/services/reactions';
import ViewCountTrigger from '@/components/post/ViewCountTrigger';
import MoreMenu from '@/components/post/MoreMenu';
import ReactionButtons from '@/components/post/ReactionButtons';
import PostLocation from '@/components/post/PostLocation';
import CommentTree from '@/components/comment/CommentTree';
import AuthorAvatar from '@/components/AuthorAvatar';

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

  const [comments, userResult, reactionCounts, myReaction] = await Promise.all([
    getComments(supabase, id),
    supabase.auth.getUser(),
    getReactionCounts(supabase, id),
    getMyReaction(supabase, id),
  ]);
  const user = userResult.data.user;
  const isOwner = !!user && user.id === post.author_id;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <ViewCountTrigger postId={post.id} />

      <Link
        href="/posts"
        className="inline-flex items-center gap-1 rounded-anbam border border-line-1 bg-white px-3.5 py-2 text-sm font-bold text-ink-1 shadow-card transition hover:border-point"
      >
        <span aria-hidden>←</span>
        <span>목록으로</span>
      </Link>

      <article className="mt-4 rounded-anbam bg-white p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-bold text-ink-1 break-words">
          {post.title}
        </h1>

        <div className="mt-3 flex items-center justify-between text-xs text-ink-2">
          <span className="flex items-center gap-2 font-medium text-ink-1">
            <AuthorAvatar
              nickname={post.profiles?.nickname ?? null}
              avatarUrl={post.profiles?.avatar_url ?? null}
              size={28}
            />
            {post.profiles?.nickname ?? '익명'}
          </span>
          <div className="flex items-center gap-3">
            <span>조회 {post.view_count}</span>
            <span>{formatDateTime(post.created_at)}</span>
            {user && <MoreMenu postId={post.id} isOwner={isOwner} />}
          </div>
        </div>

        {post.image_url && (
          <div className="mt-6 overflow-hidden rounded-anbam border border-line-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.image_url}
              alt=""
              className="w-full max-h-[60vh] object-contain bg-line-2"
            />
          </div>
        )}

        <div className="mt-6 whitespace-pre-wrap text-base text-ink-1 leading-relaxed">
          {post.content}
        </div>

        <PostLocation
          lat={post.lat}
          lng={post.lng}
          address={post.address}
        />

        <div className="mt-6 flex justify-center">
          <ReactionButtons
            postId={post.id}
            initialCounts={reactionCounts}
            initialMine={myReaction}
            isLoggedIn={!!user}
          />
        </div>
      </article>

      <CommentTree
        postId={post.id}
        comments={comments}
        currentUserId={user?.id ?? null}
      />
    </main>
  );
}
