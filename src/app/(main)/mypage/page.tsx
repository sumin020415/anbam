import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/services/profiles';
import { getPostsByAuthor, getLikedPosts } from '@/lib/services/posts';
import { getCommentsByAuthor } from '@/lib/services/comments';
import MyPageView from '@/components/mypage/MyPageView';

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [profile, myPosts, myComments, likedPosts] = await Promise.all([
    getProfile(supabase, user.id),
    getPostsByAuthor(supabase, user.id),
    getCommentsByAuthor(supabase, user.id),
    getLikedPosts(supabase, user.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-1">마이페이지</h1>
      <div className="mt-6">
        <MyPageView
          userId={user.id}
          email={user.email ?? ''}
          nickname={profile?.nickname ?? ''}
          posts={myPosts}
          comments={myComments}
          likedPosts={likedPosts}
          avatarUrl={profile?.avatar_url ?? null}
        />
      </div>
    </main>
  );
}
