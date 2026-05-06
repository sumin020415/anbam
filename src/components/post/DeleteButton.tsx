'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deletePost } from '@/lib/services/posts';
import { createClient } from '@/lib/supabase/client';

export default function DeleteButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
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
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="rounded-anbam border border-line-1 bg-white px-4 py-2 text-sm font-bold text-warn disabled:opacity-60"
    >
      {busy ? '삭제 중...' : '삭제'}
    </button>
  );
}
