'use client';

import { useState } from 'react';
import Link from 'next/link';
import { REPORT_STATUS_LABEL, type MyReportRow } from '@/lib/services/reports';
import InquiryModal from './InquiryModal';

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

// 신고/문의 종류 판별 - 둘 다 null = 일반 문의
function kindOf(r: MyReportRow): { label: string; isInquiry: boolean } {
  if (r.comment_id != null) return { label: '댓글 신고', isInquiry: false };
  if (r.post_id != null) return { label: '게시글 신고', isInquiry: false };
  return { label: '문의', isInquiry: true };
}

export default function MyReports({ reports }: { reports: MyReportRow[] }) {
  const [inquiryOpen, setInquiryOpen] = useState(false);

  return (
    <section className="rounded-anbam border border-line-1 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-ink-1">내 문의</h2>
        <button
          type="button"
          onClick={() => setInquiryOpen(true)}
          className="shrink-0 rounded-anbam bg-point px-3.5 py-2 text-sm font-bold text-ink-1"
        >
          문의 작성
        </button>
      </div>
      <p className="mt-1 text-xs text-ink-2">
        내가 신고한 글·댓글과 관리자에게 남긴 문의, 처리 상태·답변을 확인할 수
        있습니다.
      </p>

      {reports.length === 0 ? (
        <p className="mt-4 rounded-anbam border border-line-1 bg-line-2/40 p-6 text-center text-sm text-ink-2">
          아직 신고·문의 내역이 없습니다.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reports.map((r) => {
            const { label, isInquiry } = kindOf(r);
            const targetPostId = r.comment_id != null ? r.comments?.post_id : r.post_id;
            const targetTitle = r.comment_id != null ? r.comments?.content : r.posts?.title;
            return (
              <li key={r.id} className="rounded-anbam border border-line-1 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-ink-1">
                    <span className="shrink-0 rounded bg-line-2 px-1.5 py-0.5 text-xs font-bold text-ink-2">
                      {label}
                    </span>
                    <span className="truncate">{r.reason}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${statusClass(r.status)}`}
                  >
                    {REPORT_STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>

                {isInquiry
                  ? r.detail && (
                      <p className="mt-2 whitespace-pre-wrap text-xs text-ink-2">
                        {r.detail}
                      </p>
                    )
                  : (
                    <>
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
                    </>
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

      {inquiryOpen && <InquiryModal onClose={() => setInquiryOpen(false)} />}
    </section>
  );
}
