'use client';

import { useState } from 'react';
import ProfileEditForm from './ProfileEditForm';
import AvatarUpload from './AvatarUpload';
import MyContentTabs from './MyContentTabs';
import MyReports from './MyReports';
import PasswordChangeFlow from './PasswordChangeFlow';
import LogoutButton from '@/components/auth/LogoutButton';
import type { PostRow } from '@/lib/services/posts';
import type { MyCommentRow } from '@/lib/services/comments';
import type { MyReportRow } from '@/lib/services/reports';

type Menu = 'profile' | 'history' | 'reports' | 'password';

export default function MyPageView({
  userId,
  email,
  nickname,
  posts,
  comments,
  likedPosts,
  reports,
  avatarUrl,
}: {
  userId: string;
  email: string;
  nickname: string;
  posts: PostRow[];
  comments: MyCommentRow[];
  likedPosts: PostRow[];
  reports: MyReportRow[];
  avatarUrl: string | null;
}) {
  const [menu, setMenu] = useState<Menu>('profile');

  const items: { key: Menu; label: string }[] = [
    { key: 'profile', label: '프로필' },
    { key: 'password', label: '비밀번호 변경' },
    { key: 'history', label: '내 활동' },
    { key: 'reports', label: '내 신고' },
  ];

  // 모바일: 가로 pill (w-auto) / 데스크탑: 세로 풀폭 메뉴 (md:w-full md:text-left)
  const itemClass = (active: boolean) =>
    `block w-auto whitespace-nowrap rounded-anbam px-4 py-2.5 text-sm font-bold transition md:w-full md:text-left ${
      active ? 'bg-line-2 text-ink-1' : 'text-ink-2 hover:bg-line-2'
    }`;

  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-8">
      <aside className="md:w-56 md:shrink-0">
        {/* 프로필 요약 - 데스크탑 사이드바에만 */}
        <div className="mb-4 hidden rounded-anbam border border-line-1 bg-white p-5 text-center md:block">
          <div className="mx-auto h-16 w-16 overflow-hidden rounded-full bg-line-2">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl font-bold text-ink-1">
                {nickname.charAt(0) || '?'}
              </span>
            )}
          </div>
          <p className="mt-3 font-bold text-ink-1">{nickname || '닉네임'}님</p>
          <p className="mt-0.5 break-all text-xs text-ink-2">{email}</p>
        </div>

        {/* 메뉴 - 데스크탑 세로 / 모바일 상단 가로 */}
        <nav aria-label="마이페이지 메뉴">
          <ul className="flex gap-1 overflow-x-auto border-b border-line-1 pb-2 md:flex-col md:border-b-0 md:pb-0">
            {items.map((it) => (
              <li key={it.key} className="shrink-0 md:w-full">
                <button
                  type="button"
                  onClick={() => setMenu(it.key)}
                  aria-current={menu === it.key ? 'true' : undefined}
                  className={itemClass(menu === it.key)}
                >
                  {it.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {menu === 'profile' && (
          <section className="rounded-anbam border border-line-1 bg-white p-6 shadow-card">
            <h2 className="text-lg font-bold text-ink-1">프로필</h2>
            <div className="mt-4">
              <AvatarUpload
                userId={userId}
                nickname={nickname}
                avatarUrl={avatarUrl}
              />
            </div>
            <p className="mt-5 text-xs text-ink-2">이메일</p>
            <p className="text-sm text-ink-1">{email}</p>
            <div className="mt-4">
              <ProfileEditForm userId={userId} initialNickname={nickname} />
            </div>
            <div className="mt-6 border-t border-line-1 pt-4">
              <LogoutButton />
            </div>
          </section>
        )}

        {menu === 'history' && (
          <MyContentTabs
            posts={posts}
            comments={comments}
            likedPosts={likedPosts}
          />
        )}

        {menu === 'reports' && <MyReports reports={reports} />}

        {menu === 'password' && (
          <section className="rounded-anbam border border-line-1 bg-white p-6 shadow-card">
            <h2 className="text-lg font-bold text-ink-1">비밀번호 변경</h2>
            <div className="mt-4">
              <PasswordChangeFlow email={email} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
