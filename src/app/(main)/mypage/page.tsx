import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/services/profiles';
import { getPostsByAuthor } from '@/lib/services/posts';
import { getCommentsByAuthor } from '@/lib/services/comments';
import LogoutButton from '@/components/auth/LogoutButton';
import ProfileEditForm from '@/components/mypage/ProfileEditForm';
import MyContentTabs from '@/components/mypage/MyContentTabs';

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [profile, myPosts, myComments] = await Promise.all([
    getProfile(supabase, user.id),
    getPostsByAuthor(supabase, user.id),
    getCommentsByAuthor(supabase, user.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-1">마이페이지</h1>

      {/* 프로필 */}
      <section className="mt-6 rounded-anbam border border-line-1 bg-white p-6 shadow-card">
        <h2 className="text-lg font-bold text-ink-1">프로필</h2>
        <p className="mt-3 text-xs text-ink-2">이메일</p>
        <p className="text-sm text-ink-1">{user.email}</p>
        <div className="mt-4">
          <ProfileEditForm
            userId={user.id}
            initialNickname={profile?.nickname ?? ''}
          />
        </div>
        <div className="mt-6 border-t border-line-1 pt-4">
          <LogoutButton />
        </div>
      </section>

      {/* 내 제보 / 내 댓글 (탭 전환) */}
      <section className="mt-8">
        <MyContentTabs posts={myPosts} comments={myComments} />
      </section>
    </main>
  );
}
