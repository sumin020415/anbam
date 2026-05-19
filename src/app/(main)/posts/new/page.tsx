import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PostForm from '@/components/post/PostForm';

export const dynamic = 'force-dynamic';

function parseLatLng(value: string | string[] | undefined): number | null {
  if (typeof value !== 'string') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ lat?: string; lng?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const sp = await searchParams;
  const lat = parseLatLng(sp.lat);
  const lng = parseLatLng(sp.lng);
  const initial =
    lat !== null && lng !== null
      ? {
          title: '',
          content: '',
          image_url: null,
          address: null,
          lat,
          lng,
        }
      : undefined;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <Link
        href="/posts"
        className="inline-flex items-center gap-1 rounded-anbam border border-line-1 bg-white px-3.5 py-2 text-sm font-bold text-ink-1 shadow-card transition hover:border-point"
      >
        <span aria-hidden>←</span>
        <span>목록으로</span>
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold text-ink-1">
        새 제보 작성
      </h1>
      <PostForm mode="create" initial={initial} />
    </main>
  );
}
