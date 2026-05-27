'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  updateReport,
  REPORT_STATUS_LABEL,
  REPORT_STATUS_OPTIONS,
  type AdminReportRow,
} from '@/lib/services/reports';

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd} ${hh}:${mi}`;
}

function ReportRow({ report }: { report: AdminReportRow }) {
  const router = useRouter();
  const [status, setStatus] = useState(report.status);
  const [reply, setReply] = useState(report.admin_reply ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isComment = report.comment_id != null;
  const isInquiry = report.post_id == null && report.comment_id == null;
  const kindLabel = isInquiry ? '문의' : isComment ? '댓글' : '게시글';
  const targetPostId = isComment ? report.comments?.post_id : report.post_id;
  const targetText = isComment ? report.comments?.content : report.posts?.title;

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await updateReport(createClient(), report.id, {
        status,
        adminReply: reply,
      });
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="rounded-anbam border border-line-1 bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-line-2 px-1.5 py-0.5 text-xs font-bold text-ink-2">
          {kindLabel}
        </span>
        <span className="text-sm font-bold text-ink-1">{report.reason}</span>
        <span className="text-xs text-ink-2">
          {isInquiry ? '문의자' : '신고자'} {report.profiles?.nickname ?? '익명'} ·{' '}
          {formatDateTime(report.created_at)}
        </span>
      </div>

      {isInquiry ? (
        report.detail && (
          <p className="mt-2 whitespace-pre-wrap text-xs text-ink-2">
            {report.detail}
          </p>
        )
      ) : (
        <>
          <p className="mt-2 text-xs text-ink-2">
            대상:{' '}
            {targetPostId ? (
              <Link
                href={`/posts/${targetPostId}`}
                target="_blank"
                className="text-ink-1 underline"
              >
                {targetText?.slice(0, 60) || '(내용 없음)'}
              </Link>
            ) : (
              <span>(삭제된 대상)</span>
            )}
          </p>
          {report.detail && (
            <p className="mt-1 text-xs text-ink-2">상세: {report.detail}</p>
          )}
        </>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-anbam border border-line-1 px-3 py-2 text-sm text-ink-1 focus:border-point focus:outline-none"
        >
          {REPORT_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {REPORT_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="신고자에게 보일 답변 (선택)"
          rows={2}
          className="min-w-0 flex-1 rounded-anbam border border-line-1 px-3 py-2 text-sm text-ink-1 focus:border-point focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="shrink-0 rounded-anbam bg-point px-4 py-2 text-sm font-bold text-ink-1 disabled:opacity-60"
        >
          {saving ? '저장 중…' : '저장'}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-warn">{error}</p>}
      {saved && !error && <p className="mt-2 text-xs text-ok">저장되었습니다.</p>}
    </li>
  );
}

export default function AdminReportsView({
  reports,
}: {
  reports: AdminReportRow[];
}) {
  if (reports.length === 0) {
    return (
      <p className="rounded-anbam border border-line-1 bg-white p-8 text-center text-sm text-ink-2">
        접수된 신고가 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {reports.map((r) => (
        <ReportRow key={r.id} report={r} />
      ))}
    </ul>
  );
}
