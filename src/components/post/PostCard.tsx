import Link from 'next/link';
import type { PostRow } from '@/lib/services/posts';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

export default function PostCard({ post }: { post: PostRow }) {
  return (
    <Link
      href={`/posts/${post.id}`}
      className="block rounded-anbam border border-line-1 bg-white p-5 shadow-card transition hover:border-point"
    >
      <h3 className="text-base font-bold text-ink-1 line-clamp-1">
        {post.title}
      </h3>
      <p className="mt-2 text-sm text-ink-2 line-clamp-2 whitespace-pre-wrap">
        {post.content}
      </p>
      <div className="mt-4 flex items-center justify-between text-xs text-ink-2">
        <span>{post.profiles?.nickname ?? '익명'}</span>
        <span className="flex items-center gap-3">
          <span>조회 {post.view_count}</span>
          <span>{formatDate(post.created_at)}</span>
        </span>
      </div>
    </Link>
  );
}
