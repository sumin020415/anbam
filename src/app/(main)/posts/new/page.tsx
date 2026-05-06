import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PostForm from '@/components/post/PostForm';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link href="/posts" className="text-sm text-ink-2 underline">
        ← 목록으로
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold text-ink-1">
        새 제보 작성
      </h1>
      <PostForm mode="create" />
    </main>
  );
}
