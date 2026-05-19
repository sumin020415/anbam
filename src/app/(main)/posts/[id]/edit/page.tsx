import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPost } from '@/lib/services/posts';
import PostForm from '@/components/post/PostForm';

export const dynamic = 'force-dynamic';

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const post = await getPost(supabase, id);
  if (!post) notFound();
  if (post.author_id !== user.id) redirect(`/posts/${id}`);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <Link
        href={`/posts/${id}`}
        className="inline-flex items-center gap-1 rounded-anbam border border-line-1 bg-white px-3.5 py-2 text-sm font-bold text-ink-1 shadow-card transition hover:border-point"
      >
        <span aria-hidden>←</span>
        <span>상세로</span>
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold text-ink-1">제보 수정</h1>
      <PostForm
        mode="edit"
        postId={id}
        initial={{
          title: post.title,
          content: post.content,
          lat: post.lat,
          lng: post.lng,
          address: post.address,
          image_url: post.image_url,
        }}
      />
    </main>
  );
}
