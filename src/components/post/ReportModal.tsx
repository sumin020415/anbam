'use client';

import { useEffect, useState } from 'react';
import { createReport, REPORT_REASONS } from '@/lib/services/reports';
import { createClient } from '@/lib/supabase/client';

export default function ReportModal({
  postId,
  onClose,
}: {
  postId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Esc 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async () => {
    setError(null);
    if (reason === '기타' && !detail.trim()) {
      setError('기타 사유를 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      await createReport(createClient(), { postId, reason, detail });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '신고 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-anbam bg-white p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="게시글 신고"
      >
        {done ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-ink-1">신고가 접수되었습니다.</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-anbam bg-point px-4 py-2 text-sm font-bold text-ink-1"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-ink-1">게시글 신고</h2>
            <p className="mt-1 text-xs text-ink-2">신고 사유를 선택해 주세요.</p>

            <div className="mt-4 space-y-1.5">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2 text-sm text-ink-1"
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                  />
                  {r}
                </label>
              ))}
            </div>

            {reason === '기타' && (
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="상세 사유를 입력하세요"
                rows={3}
                className="mt-3 w-full rounded-anbam border border-line-1 px-3 py-2 text-sm text-ink-1 focus:border-point focus:outline-none"
              />
            )}

            {error && <p className="mt-2 text-xs text-warn">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-anbam border border-line-1 px-4 py-2 text-sm font-bold text-ink-2 hover:text-ink-1"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-anbam bg-warn px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {submitting ? '신고 중…' : '신고'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
