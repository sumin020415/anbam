import Link from 'next/link';
import { REPORT_STATUS_LABEL, type MyReportRow } from '@/lib/services/reports';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
}

function statusClass(status: string): string {
  if (status === 'reviewed') return 'bg-ok/15 text-ok';
  if (status === 'dismissed') return 'bg-line-2 text-ink-2';
  return 'bg-point/20 text-ink-1'; // pending
}

export default function MyReports({ reports }: { reports: MyReportRow[] }) {
  return (
    <section className="rounded-anbam border border-line-1 bg-white p-6 shadow-card">
      <h2 className="text-lg font-bold text-ink-1">내 신고</h2>
      <p className="mt-1 text-xs text-ink-2">
        내가 신고한 글·댓글과 처리 상태, 관리자 답변을 확인할 수 있습니다.
      </p>

      {reports.length === 0 ? (
        <p className="mt-4 rounded-anbam border border-line-1 bg-line-2/40 p-6 text-center text-sm text-ink-2">
          아직 신고한 내역이 없습니다.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reports.map((r) => {
            const isComment = r.comment_id != null;
            const targetPostId = isComment ? r.comments?.post_id : r.post_id;
            const targetTitle = isComment
              ? r.comments?.content
              : r.posts?.title;
            return (
              <li
                key={r.id}
                className="rounded-anbam border border-line-1 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-bold text-ink-1">
                    <span className="rounded bg-line-2 px-1.5 py-0.5 text-xs font-bold text-ink-2">
                      {isComment ? '댓글' : '게시글'}
                    </span>
                    {r.reason}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${statusClass(r.status)}`}
                  >
                    {REPORT_STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>

                <p className="mt-2 text-xs text-ink-2">
                  대상:{' '}
                  {targetPostId ? (
                    <Link
                      href={`/posts/${targetPostId}`}
                      className="text-ink-1 underline"
                    >
                      {targetTitle?.slice(0, 40) || '(내용 없음)'}
                    </Link>
                  ) : (
                    <span className="text-ink-2">(삭제된 대상)</span>
                  )}
                </p>

                {r.detail && (
                  <p className="mt-1 text-xs text-ink-2">상세: {r.detail}</p>
                )}

                {r.admin_reply && (
                  <div className="mt-2 rounded-anbam bg-line-2/50 p-3">
                    <p className="text-xs font-bold text-ink-1">관리자 답변</p>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-ink-1">
                      {r.admin_reply}
                    </p>
                  </div>
                )}

                <p className="mt-2 text-right text-xs text-ink-2">
                  {formatDate(r.created_at)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
