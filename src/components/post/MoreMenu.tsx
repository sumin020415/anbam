'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { deletePost } from '@/lib/services/posts';
import ReportModal from './ReportModal';

export default function MoreMenu({
  postId,
  isOwner,
}: {
  postId: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleEdit = () => {
    setOpen(false);
    router.push(`/posts/${postId}/edit`);
  };

  const handleDelete = async () => {
    setOpen(false);
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    setBusy(true);
    try {
      await deletePost(createClient(), postId);
      router.push('/posts');
      router.refresh();
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : '삭제 중 오류가 발생했습니다',
      );
      setBusy(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="더보기"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded text-lg text-ink-2 hover:bg-line-2 disabled:opacity-50"
      >
        ⋯
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 min-w-[110px] overflow-hidden rounded-anbam border border-line-1 bg-white shadow-card"
        >
          {isOwner ? (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={handleEdit}
                className="block w-full px-3 py-2 text-left text-sm text-ink-1 hover:bg-line-2"
              >
                수정
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleDelete}
                className="block w-full px-3 py-2 text-left text-sm font-bold text-warn hover:bg-line-2"
              >
                {busy ? '삭제 중...' : '삭제'}
              </button>
            </>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setReportOpen(true);
              }}
              className="block w-full px-3 py-2 text-left text-sm font-bold text-warn hover:bg-line-2"
            >
              신고
            </button>
          )}
        </div>
      )}

      {reportOpen && (
        <ReportModal postId={postId} onClose={() => setReportOpen(false)} />
      )}
    </div>
  );
}
