'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInquiry, INQUIRY_CATEGORIES } from '@/lib/services/reports';
import { createClient } from '@/lib/supabase/client';

export default function InquiryModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [category, setCategory] = useState<string>(INQUIRY_CATEGORIES[0]);
  const [content, setContent] = useState('');
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
    if (!content.trim()) {
      setError('문의 내용을 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      await createInquiry(createClient(), { category, content });
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '문의 등록 중 오류가 발생했습니다.');
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
        className="w-full max-w-md rounded-anbam bg-white p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="관리자 문의"
      >
        {done ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-ink-1">문의가 접수되었습니다.</p>
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
            <h2 className="text-lg font-bold text-ink-1">관리자 문의</h2>
            <p className="mt-1 text-xs text-ink-2">
              궁금한 점이나 건의사항을 남겨 주세요. 답변은 &quot;내 문의&quot; 에
              표시됩니다.
            </p>

            <p className="mt-4 text-xs font-bold text-ink-2">카테고리</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {INQUIRY_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={`rounded-anbam border px-3 py-1.5 text-xs font-bold transition ${
                    category === c
                      ? 'border-point bg-point/20 text-ink-1'
                      : 'border-line-1 text-ink-2 hover:border-point'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="문의 내용을 입력하세요"
              rows={5}
              maxLength={2000}
              className="mt-3 w-full rounded-anbam border border-line-1 px-3 py-2 text-sm text-ink-1 focus:border-point focus:outline-none"
            />

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
                className="rounded-anbam bg-point px-4 py-2 text-sm font-bold text-ink-1 disabled:opacity-60"
              >
                {submitting ? '등록 중…' : '문의 등록'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
