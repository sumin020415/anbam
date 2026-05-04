import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/services/profiles';
import LogoutButton from '@/components/auth/LogoutButton';

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile(supabase, user.id);

  return (
    <main className="flex flex-1 items-start justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-anbam bg-white p-8 shadow-card space-y-6">
        <h1 className="text-2xl font-bold text-ink-1">마이페이지</h1>

        <dl className="space-y-3">
          <div>
            <dt className="text-xs text-ink-2">닉네임</dt>
            <dd className="text-base text-ink-1">{profile?.nickname ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-2">이메일</dt>
            <dd className="text-base text-ink-1">{user.email}</dd>
          </div>
        </dl>

        <LogoutButton />
      </div>
    </main>
  );
}
