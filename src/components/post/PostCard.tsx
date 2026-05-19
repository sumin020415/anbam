import Link from 'next/link';
import type { PostRow } from '@/lib/services/posts';
import KakaoMap from '@/components/map/KakaoMap';
import MapPin from '@/components/map/MapPin';

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

export default function PostCard({ post }: { post: PostRow }) {
  const commentCount = post.comments?.[0]?.count ?? 0;

  return (
    <Link
      href={`/posts/${post.id}`}
      className="flex h-full flex-col overflow-hidden rounded-anbam border border-line-1 bg-white shadow-card transition hover:-translate-y-0.5 hover:border-point hover:shadow-md"
    >
      <div className="relative aspect-[16/9] w-full bg-line-2">
        {post.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image_url}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : post.lat !== null && post.lng !== null ? (
          <div className="pointer-events-none absolute inset-0">
            <KakaoMap center={{ lat: post.lat, lng: post.lng }} level={3}>
              <MapPin type="post" position={{ lat: post.lat, lng: post.lng }} />
            </KakaoMap>
          </div>
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-point/40 to-line-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt=""
              className="h-10 w-auto opacity-60"
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="min-h-0 flex-1">
          <h3 className="text-base font-bold text-ink-1 line-clamp-2">
            {post.title}
          </h3>
          <p className="mt-2 text-sm text-ink-2 line-clamp-3 whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        <p className="mt-4 text-xs text-ink-2">
          {formatDateTime(post.created_at)}
        </p>

        <div className="mt-3 flex items-center justify-between border-t border-line-1 pt-3 text-xs">
          <span className="font-medium text-ink-1">
            {post.profiles?.nickname ?? '익명'}
          </span>
          <span className="flex items-center gap-2.5 text-ink-2">
            <span>조회 {post.view_count}</span>
            <span aria-label="좋아요 수">👍 {post.like_count ?? 0}</span>
            <span aria-label="싫어요 수">👎 {post.dislike_count ?? 0}</span>
            <span aria-label="댓글 수">💬 {commentCount}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
