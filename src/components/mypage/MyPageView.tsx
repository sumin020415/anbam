'use client';

import { useState } from 'react';
import ProfileEditForm from './ProfileEditForm';
import AvatarUpload from './AvatarUpload';
import MyContentTabs from './MyContentTabs';
import MyReports from './MyReports';
import PasswordChangeFlow from './PasswordChangeFlow';
import AdminReportsView from '@/components/admin/AdminReportsView';
import LogoutButton from '@/components/auth/LogoutButton';
import type { PostRow } from '@/lib/services/posts';
import type { MyCommentRow } from '@/lib/services/comments';
import type { MyReportRow, AdminReportRow } from '@/lib/services/reports';

type Menu = 'profile' | 'history' | 'reports' | 'admin' | 'password';

function formatJoinDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
}

export default function MyPageView({
  userId,
  email,
  nickname,
  posts,
  comments,
  likedPosts,
  reports,
  isAdmin,
  adminReports,
  avatarUrl,
  joinedAt,
}: {
  userId: string;
  email: string;
  nickname: string;
  posts: PostRow[];
  comments: MyCommentRow[];
  likedPosts: PostRow[];
  reports: MyReportRow[];
  isAdmin: boolean;
  adminReports: AdminReportRow[];
  avatarUrl: string | null;
  joinedAt: string | null;
}) {
  const [menu, setMenu] = useState<Menu>('profile');

  // 활동 요약 - getPostsByAuthor 가 이미 like_count / view_count 를 포함하므로 추가 쿼리 없음
  const likesReceived = posts.reduce((sum, p) => sum + (p.like_count ?? 0), 0);
  const totalViews = posts.reduce((sum, p) => sum + (p.view_count ?? 0), 0);

  const items: { key: Menu; label: string }[] = [
    { key: 'profile', label: '프로필' },
    { key: 'password', label: '비밀번호 변경' },
    { key: 'history', label: '내 활동' },
    { key: 'reports', label: '내 문의' },
    // 관리자 전용 - 사람들이 신고·문의한 내역 확인 + 답변
    ...(isAdmin ? [{ key: 'admin' as Menu, label: '문의내역' }] : []),
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
          {joinedAt && (
            <p className="mt-1 text-xs text-ink-2">가입일 {formatJoinDate(joinedAt)}</p>
          )}

          {/* 활동 요약 - 글로만 (카드 X) */}
          <dl className="mt-3 space-y-1 border-t border-line-1 pt-3 text-xs text-ink-2">
            <div className="flex justify-between">
              <dt>내 제보</dt>
              <dd className="font-bold text-ink-1">{posts.length.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt>내 댓글</dt>
              <dd className="font-bold text-ink-1">{comments.length.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt>받은 좋아요</dt>
              <dd className="font-bold text-ink-1">{likesReceived.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt>총 조회수</dt>
              <dd className="font-bold text-ink-1">{totalViews.toLocaleString()}</dd>
            </div>
          </dl>
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
            {joinedAt && (
              <>
                <p className="mt-3 text-xs text-ink-2">가입일</p>
                <p className="text-sm text-ink-1">{formatJoinDate(joinedAt)}</p>
              </>
            )}
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

        {menu === 'admin' && isAdmin && (
          <section className="rounded-anbam border border-line-1 bg-white p-6 shadow-card">
            <h2 className="text-lg font-bold text-ink-1">문의내역 (신고 관리)</h2>
            <p className="mt-1 text-xs text-ink-2">
              사용자가 신고한 글·댓글입니다. 상태를 변경하고 답변을 남기면 신고자
              마이페이지 &quot;내 신고&quot; 에 표시됩니다.
            </p>
            <div className="mt-4">
              <AdminReportsView reports={adminReports} />
            </div>
          </section>
        )}

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
